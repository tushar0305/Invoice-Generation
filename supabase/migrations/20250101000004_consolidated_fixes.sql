-- ==========================================
-- Migration 0004: Consolidated Fixes
-- Description: Merges all fix/patch migrations into a single file
-- Includes: Loyalty hotfix, Invoice RPCs, Khata Audit, Cancel Ledger, 
--           Loans Ledger, Khata V2 Schema/View/RPC, Security Fixes, 
--           Relationship Fixes, Import Contact Fix
-- ==========================================

-- ==========================================
-- PART 1: HOTFIX - Add Loyalty Columns
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'invoices' 
        AND column_name = 'loyalty_points_earned'
    ) THEN
        ALTER TABLE public.invoices ADD COLUMN loyalty_points_earned INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'invoices' 
        AND column_name = 'loyalty_points_redeemed'
    ) THEN
        ALTER TABLE public.invoices ADD COLUMN loyalty_points_redeemed INTEGER DEFAULT 0;
    END IF;
END $$;

-- ==========================================
-- PART 2: KHATA V2 SCHEMA
-- ==========================================
CREATE TABLE IF NOT EXISTS khatabook_contacts (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    type TEXT NOT NULL CHECK (type IN ('CUSTOMER', 'SUPPLIER', 'KARIGAR', 'PARTNER', 'OTHER')),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(shop_id, phone, type)
);

CREATE TABLE IF NOT EXISTS ledger_transactions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id),
    customer_id UUID REFERENCES customers(id),
    transaction_type TEXT,
    amount DECIMAL NOT NULL DEFAULT 0,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('DEBIT', 'CREDIT')),
    description TEXT,
    transaction_date TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_khatabook_contacts_shop_type ON khatabook_contacts(shop_id, type);
CREATE INDEX IF NOT EXISTS idx_khatabook_contacts_phone ON khatabook_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_khatabook_contacts_name ON khatabook_contacts(name);

-- RLS for khatabook_contacts (handled in consolidated_policies.sql)
ALTER TABLE khatabook_contacts ENABLE ROW LEVEL SECURITY;

-- Modify ledger_transactions
DO $$ 
BEGIN
    ALTER TABLE ledger_transactions ALTER COLUMN customer_id DROP NOT NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ledger_transactions' AND column_name='khatabook_contact_id') THEN
        ALTER TABLE ledger_transactions ADD COLUMN khatabook_contact_id UUID REFERENCES khatabook_contacts(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ledger_transactions' AND column_name='deleted_at') THEN
        ALTER TABLE ledger_transactions ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END $$;

ALTER TABLE ledger_transactions DROP CONSTRAINT IF EXISTS check_party_exists;
ALTER TABLE ledger_transactions ADD CONSTRAINT check_party_exists CHECK (
  (customer_id IS NOT NULL AND khatabook_contact_id IS NULL) OR 
  (khatabook_contact_id IS NOT NULL AND customer_id IS NULL)
);

ALTER TABLE ledger_transactions DROP CONSTRAINT IF EXISTS ledger_transactions_transaction_type_check;
ALTER TABLE ledger_transactions ADD CONSTRAINT ledger_transactions_transaction_type_check CHECK (
  transaction_type IN ('INVOICE', 'PAYMENT', 'ADJUSTMENT', 'SALE', 'SALE_RETURN', 'PURCHASE', 'PURCHASE_RETURN', 'WORK_ORDER', 'MAKING_CHARGES', 'JAMA', 'ODHARA', 'LOAN_GIVEN', 'LOAN_RECEIVED', 'SETTLEMENT')
);

CREATE INDEX IF NOT EXISTS idx_ledger_khatabook_contact_id ON ledger_transactions(khatabook_contact_id);

-- Transaction Documents
CREATE TABLE IF NOT EXISTS transaction_documents (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES ledger_transactions(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES shops(id),
    file_name TEXT,
    file_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    description TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT now(),
    uploaded_by UUID REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS idx_documents_transaction ON transaction_documents(transaction_id);
ALTER TABLE transaction_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view docs for their shops" ON transaction_documents;
DROP POLICY IF EXISTS "Users can upload docs for their shops" ON transaction_documents;
DROP POLICY IF EXISTS "Users can delete docs for their shops" ON transaction_documents;
DROP POLICY IF EXISTS "Transaction documents access" ON transaction_documents;
CREATE POLICY "Transaction documents access" ON transaction_documents
    FOR ALL USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())));

-- RLS for ledger_transactions (handled in consolidated_policies.sql)
ALTER TABLE ledger_transactions ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- PART 3: KHATA VIEWS
-- ==========================================
-- Remove unused customer_balances_view (superseded by khatabook_ledger_view)
DROP VIEW IF EXISTS customer_balances_view CASCADE;

CREATE OR REPLACE VIEW khatabook_ledger_view WITH (security_invoker = true) AS
SELECT 
    k.id, k.shop_id, k.name, k.phone, k.type as entity_type,
    'khatabook_contact' as source_table, k.created_at as last_transaction_date, k.updated_at,
    (NOT k.is_active) as is_deleted,
    COALESCE(SUM(CASE WHEN lt.entry_type = 'DEBIT' THEN lt.amount ELSE 0 END), 0) as total_debit,
    COALESCE(SUM(CASE WHEN lt.entry_type = 'CREDIT' THEN lt.amount ELSE 0 END), 0) as total_credit,
    COALESCE(SUM(CASE WHEN lt.entry_type = 'DEBIT' THEN lt.amount ELSE -lt.amount END), 0) as current_balance,
    COUNT(lt.id) as transaction_count,
    MAX(lt.transaction_date) as latest_transaction_date
FROM khatabook_contacts k
LEFT JOIN ledger_transactions lt ON k.id = lt.khatabook_contact_id AND lt.deleted_at IS NULL
GROUP BY k.id, k.shop_id, k.name, k.type, k.created_at, k.updated_at, k.is_active;

-- ==========================================
-- PART 4: CUSTOMER/LEDGER FUNCTIONS
-- ==========================================
DROP FUNCTION IF EXISTS create_customer(uuid, text, text, text, text, text, text, text, numeric);
DROP FUNCTION IF EXISTS create_customer(uuid, text, text, text, text, text, text, text);
CREATE OR REPLACE FUNCTION create_customer(
    p_shop_id UUID, p_name TEXT, p_phone TEXT DEFAULT NULL, p_email TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL, p_state TEXT DEFAULT NULL, p_pincode TEXT DEFAULT NULL,
    p_gst_number TEXT DEFAULT NULL, p_opening_balance NUMERIC DEFAULT 0
) RETURNS UUID AS $$
DECLARE v_customer_id UUID;
BEGIN
    INSERT INTO customers (shop_id, name, phone, email, address, state, pincode, gst_number)
    VALUES (p_shop_id, p_name, p_phone, p_email, p_address, p_state, p_pincode, p_gst_number)
    RETURNING id INTO v_customer_id;
    IF p_opening_balance <> 0 THEN
        INSERT INTO ledger_transactions (shop_id, customer_id, transaction_type, amount, entry_type, description, transaction_date, created_by)
        VALUES (p_shop_id, v_customer_id, 'ADJUSTMENT', ABS(p_opening_balance), 
                CASE WHEN p_opening_balance > 0 THEN 'DEBIT' ELSE 'CREDIT' END, 'Opening Balance', CURRENT_DATE, auth.uid());
        IF p_opening_balance > 0 THEN
            UPDATE customers SET total_spent = total_spent + ABS(p_opening_balance) WHERE id = v_customer_id;
        END IF;
    END IF;
    RETURN v_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

DROP FUNCTION IF EXISTS update_customer(uuid, uuid, text, text, text, text, text, text, text);
CREATE OR REPLACE FUNCTION update_customer(
    p_customer_id UUID, p_shop_id UUID, p_name TEXT, p_phone TEXT, p_email TEXT,
    p_address TEXT, p_state TEXT, p_pincode TEXT, p_gst_number TEXT
) RETURNS VOID AS $$
BEGIN
    UPDATE customers SET name = p_name, phone = p_phone, email = p_email, address = p_address,
        state = p_state, pincode = p_pincode, gst_number = p_gst_number, updated_at = NOW()
    WHERE id = p_customer_id AND shop_id = p_shop_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

DROP FUNCTION IF EXISTS add_ledger_transaction(uuid, uuid, numeric, text, text, text, date);
CREATE OR REPLACE FUNCTION add_ledger_transaction(
    p_shop_id UUID, p_customer_id UUID, p_amount NUMERIC, p_transaction_type TEXT, 
    p_entry_type TEXT, p_description TEXT, p_date DATE
) RETURNS UUID AS $$
DECLARE v_trans_id UUID;
BEGIN
    INSERT INTO ledger_transactions (shop_id, customer_id, transaction_type, amount, entry_type, description, transaction_date, created_by)
    VALUES (p_shop_id, p_customer_id, p_transaction_type, p_amount, p_entry_type, p_description, p_date, auth.uid())
    RETURNING id INTO v_trans_id;
    IF p_entry_type = 'DEBIT' THEN
        UPDATE customers SET total_spent = total_spent + p_amount WHERE id = p_customer_id;
    END IF;
    RETURN v_trans_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

DROP FUNCTION IF EXISTS delete_ledger_transaction(uuid, uuid);
CREATE OR REPLACE FUNCTION delete_ledger_transaction(p_transaction_id UUID, p_shop_id UUID) RETURNS VOID AS $$
DECLARE v_amount NUMERIC; v_entry_type TEXT; v_customer_id UUID;
BEGIN
    SELECT amount, entry_type, customer_id INTO v_amount, v_entry_type, v_customer_id
    FROM ledger_transactions WHERE id = p_transaction_id AND shop_id = p_shop_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Transaction not found'; END IF;
    DELETE FROM ledger_transactions WHERE id = p_transaction_id;
    IF v_entry_type = 'DEBIT' THEN
        UPDATE customers SET total_spent = total_spent - v_amount WHERE id = v_customer_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

CREATE INDEX IF NOT EXISTS idx_ledger_customer_date ON ledger_transactions (customer_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_shop_date ON ledger_transactions (shop_id, transaction_date DESC);

-- ==========================================
-- PART 5: KHATABOOK CONTACT FUNCTIONS
-- ==========================================
CREATE OR REPLACE FUNCTION create_khatabook_contact(
    p_shop_id UUID, p_name TEXT, p_phone TEXT, p_address TEXT, p_type TEXT, p_email TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_contact_id UUID;
BEGIN
    IF p_phone IS NOT NULL AND p_phone <> '' THEN
        SELECT id INTO v_contact_id FROM khatabook_contacts
        WHERE shop_id = p_shop_id AND phone = p_phone AND type = p_type LIMIT 1;
        IF v_contact_id IS NOT NULL THEN
            UPDATE khatabook_contacts SET name = p_name, address = COALESCE(p_address, address),
                email = COALESCE(p_email, email), updated_at = now() WHERE id = v_contact_id;
            RETURN v_contact_id;
        END IF;
    END IF;
    INSERT INTO khatabook_contacts (shop_id, name, phone, address, type, email)
    VALUES (p_shop_id, p_name, p_phone, p_address, p_type, p_email)
    RETURNING id INTO v_contact_id;
    RETURN v_contact_id;
END;
$$;
ALTER FUNCTION create_khatabook_contact(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION add_ledger_entry_v2(
    p_shop_id UUID, p_khatabook_contact_id UUID, p_amount DECIMAL, p_transaction_type TEXT, p_entry_type TEXT,
    p_description TEXT DEFAULT NULL, p_transaction_date TIMESTAMPTZ DEFAULT now(),
    p_file_path TEXT DEFAULT NULL, p_file_type TEXT DEFAULT NULL, p_file_name TEXT DEFAULT NULL
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_transaction_id UUID;
BEGIN
    INSERT INTO ledger_transactions (shop_id, khatabook_contact_id, transaction_type, amount, entry_type, description, transaction_date)
    VALUES (p_shop_id, p_khatabook_contact_id, p_transaction_type, p_amount, p_entry_type, p_description, p_transaction_date)
    RETURNING id INTO v_transaction_id;
    IF p_file_path IS NOT NULL THEN
        INSERT INTO transaction_documents (transaction_id, shop_id, storage_path, file_type, file_name)
        VALUES (v_transaction_id, p_shop_id, p_file_path, p_file_type, p_file_name);
    END IF;
    RETURN json_build_object('transaction_id', v_transaction_id, 'status', 'success');
END;
$$;
ALTER FUNCTION add_ledger_entry_v2(UUID, UUID, DECIMAL, TEXT, TEXT, TEXT, TIMESTAMPTZ, TEXT, TEXT, TEXT) SET search_path = public, extensions;

-- ==========================================
-- PART 6: INVOICE FUNCTIONS (Fixed)
-- ==========================================
DROP FUNCTION IF EXISTS create_invoice_v2(UUID, UUID, JSONB, JSONB, NUMERIC, TEXT, TEXT, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION create_invoice_v2(
    p_shop_id UUID, p_customer_id UUID, p_customer_snapshot JSONB, p_items JSONB,
    p_discount NUMERIC, p_notes TEXT, p_status TEXT DEFAULT 'due',
    p_loyalty_points_earned INTEGER DEFAULT 0, p_loyalty_points_redeemed INTEGER DEFAULT 0
) RETURNS JSONB AS $$
DECLARE
    v_invoice_id UUID; v_invoice_number TEXT; v_item JSONB; v_subtotal NUMERIC := 0;
    v_cgst_rate NUMERIC; v_sgst_rate NUMERIC; v_cgst_amount NUMERIC; v_sgst_amount NUMERIC;
    v_grand_total NUMERIC; v_user_id UUID; v_user_email TEXT; v_stock_id UUID;
    v_rows_updated INTEGER; v_net_weight NUMERIC; v_rate NUMERIC; v_making NUMERIC;
    v_making_rate NUMERIC; v_stone_amount NUMERIC; v_item_total NUMERIC;
BEGIN
    v_user_id := auth.uid();
    IF NOT is_shop_member(p_shop_id) THEN RAISE EXCEPTION 'Access denied' USING ERRCODE = 'P0403'; END IF;
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
    SELECT cgst_rate, sgst_rate INTO v_cgst_rate, v_sgst_rate FROM shops WHERE id = p_shop_id;
    v_invoice_number := generate_invoice_number_safe(p_shop_id);
    INSERT INTO invoices (shop_id, invoice_number, customer_id, customer_snapshot, status, discount, notes, created_by_name, created_by, loyalty_points_earned, loyalty_points_redeemed)
    VALUES (p_shop_id, v_invoice_number, p_customer_id, p_customer_snapshot, p_status, p_discount, p_notes, v_user_email, v_user_id,
            CASE WHEN p_status = 'paid' THEN p_loyalty_points_earned ELSE 0 END, p_loyalty_points_redeemed)
    RETURNING id INTO v_invoice_id;
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_stock_id := (v_item->>'stockId')::UUID;
        v_net_weight := COALESCE((v_item->>'netWeight')::NUMERIC, 0);
        v_rate := COALESCE((v_item->>'rate')::NUMERIC, 0);
        v_making := COALESCE((v_item->>'making')::NUMERIC, 0);
        v_making_rate := COALESCE((v_item->>'makingRate')::NUMERIC, 0);
        v_stone_amount := COALESCE((v_item->>'stoneAmount')::NUMERIC, 0);
        IF v_making = 0 AND v_making_rate > 0 THEN v_making := v_net_weight * v_making_rate; END IF;
        IF v_stock_id IS NOT NULL THEN
            UPDATE inventory_items SET status = 'SOLD', sold_invoice_id = v_invoice_id, sold_at = NOW(), updated_at = NOW(), updated_by = v_user_id
            WHERE id = v_stock_id AND shop_id = p_shop_id AND status = 'IN_STOCK';
            GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
            IF v_rows_updated = 0 THEN RAISE EXCEPTION 'Item % is already SOLD or not available.', (v_item->>'description'); END IF;
        END IF;
        INSERT INTO invoice_items (invoice_id, description, purity, gross_weight, net_weight, rate, making, making_rate, stone_weight, stone_amount, wastage_percent, metal_type, hsn_code, stock_id, tag_id)
        VALUES (v_invoice_id, v_item->>'description', v_item->>'purity', (v_item->>'grossWeight')::NUMERIC, v_net_weight, v_rate, v_making, v_making_rate, (v_item->>'stoneWeight')::NUMERIC, v_stone_amount, (v_item->>'wastagePercent')::NUMERIC, v_item->>'metalType', v_item->>'hsnCode', v_stock_id, v_item->>'tagId');
        v_item_total := (v_net_weight * v_rate) + v_making + v_stone_amount;
        v_subtotal := v_subtotal + v_item_total;
    END LOOP;
    v_cgst_amount := (v_subtotal - COALESCE(p_discount, 0)) * (v_cgst_rate / 100);
    v_sgst_amount := (v_subtotal - COALESCE(p_discount, 0)) * (v_sgst_rate / 100);
    v_grand_total := (v_subtotal - COALESCE(p_discount, 0)) + v_cgst_amount + v_sgst_amount;
    UPDATE invoices SET subtotal = v_subtotal, cgst_amount = v_cgst_amount, sgst_amount = v_sgst_amount, grand_total = v_grand_total WHERE id = v_invoice_id;
    IF p_status = 'due' AND p_customer_id IS NOT NULL THEN
        INSERT INTO ledger_transactions (shop_id, customer_id, invoice_id, transaction_type, amount, entry_type, description, created_by)
        VALUES (p_shop_id, p_customer_id, v_invoice_id, 'INVOICE', v_grand_total, 'DEBIT', 'Invoice #' || v_invoice_number, v_user_id);
        UPDATE customers SET total_spent = total_spent + v_grand_total WHERE id = p_customer_id;
    ELSIF p_status = 'paid' AND p_customer_id IS NOT NULL THEN
        UPDATE customers SET total_spent = total_spent + v_grand_total WHERE id = p_customer_id;
    END IF;
    IF p_customer_id IS NOT NULL THEN
        IF p_status = 'paid' AND p_loyalty_points_earned > 0 THEN
            PERFORM increment_loyalty_points(p_customer_id, p_loyalty_points_earned);
            INSERT INTO customer_loyalty_logs (customer_id, shop_id, invoice_id, points_change, reason)
            VALUES (p_customer_id, p_shop_id, v_invoice_id, p_loyalty_points_earned, 'Earned from Invoice #' || v_invoice_number);
        END IF;
        IF p_loyalty_points_redeemed > 0 THEN
            PERFORM decrement_loyalty_points(p_customer_id, p_loyalty_points_redeemed);
            INSERT INTO customer_loyalty_logs (customer_id, shop_id, invoice_id, points_change, reason)
            VALUES (p_customer_id, p_shop_id, v_invoice_id, -p_loyalty_points_redeemed, 'Redeemed on Invoice #' || v_invoice_number);
        END IF;
    END IF;
    RETURN jsonb_build_object('invoice_id', v_invoice_id, 'invoice_number', v_invoice_number, 'grand_total', v_grand_total);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION cancel_invoice(p_invoice_id UUID, p_shop_id UUID) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_invoice RECORD; v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id AND shop_id = p_shop_id FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Invoice not found'); END IF;
    IF v_invoice.status = 'cancelled' THEN RETURN jsonb_build_object('success', false, 'error', 'Already cancelled'); END IF;
    UPDATE inventory_items SET status = 'IN_STOCK', sold_invoice_id = NULL, sold_at = NULL WHERE sold_invoice_id = p_invoice_id;
    IF v_invoice.loyalty_points_earned > 0 AND v_invoice.customer_id IS NOT NULL THEN
        PERFORM decrement_loyalty_points(v_invoice.customer_id, v_invoice.loyalty_points_earned);
        INSERT INTO customer_loyalty_logs (customer_id, shop_id, invoice_id, points_change, reason)
        VALUES (v_invoice.customer_id, p_shop_id, p_invoice_id, -v_invoice.loyalty_points_earned, 'Invoice Cancelled - Revert Earned');
    END IF;
    IF v_invoice.loyalty_points_redeemed > 0 AND v_invoice.customer_id IS NOT NULL THEN
        PERFORM increment_loyalty_points(v_invoice.customer_id, v_invoice.loyalty_points_redeemed);
        INSERT INTO customer_loyalty_logs (customer_id, shop_id, invoice_id, points_change, reason)
        VALUES (v_invoice.customer_id, p_shop_id, p_invoice_id, v_invoice.loyalty_points_redeemed, 'Invoice Cancelled - Refund Redeemed');
    END IF;
    IF v_invoice.status = 'due' AND v_invoice.customer_id IS NOT NULL THEN
        INSERT INTO ledger_transactions (shop_id, customer_id, invoice_id, transaction_type, amount, entry_type, description, created_by)
        VALUES (p_shop_id, v_invoice.customer_id, p_invoice_id, 'ADJUSTMENT', v_invoice.grand_total, 'CREDIT', 'Invoice #' || v_invoice.invoice_number || ' Cancelled', v_user_id);
        UPDATE customers SET total_spent = GREATEST(0, total_spent - v_invoice.grand_total) WHERE id = v_invoice.customer_id;
    ELSIF v_invoice.status = 'paid' AND v_invoice.customer_id IS NOT NULL THEN
        UPDATE customers SET total_spent = GREATEST(0, total_spent - v_invoice.grand_total) WHERE id = v_invoice.customer_id;
    END IF;
    UPDATE invoices SET status = 'cancelled', updated_at = NOW() WHERE id = p_invoice_id;
    RETURN jsonb_build_object('success', true);
END;
$$;
ALTER FUNCTION cancel_invoice(UUID, UUID) SET search_path = public, extensions;

-- ==========================================
-- PART 7: LOAN FUNCTIONS
-- ==========================================
CREATE OR REPLACE FUNCTION add_loan_payment(p_loan_id uuid, p_amount numeric, p_payment_type text, p_payment_method text, p_notes text, p_user_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_loan_status text; v_current_paid numeric; v_principal numeric; v_new_total numeric;
  v_payment_id uuid; v_shop_id uuid; v_customer_id uuid; v_loan_number text; v_customer_name text;
BEGIN
  SELECT l.status, l.total_amount_paid, l.principal_amount, l.shop_id, l.customer_id, l.loan_number, c.name
  INTO v_loan_status, v_current_paid, v_principal, v_shop_id, v_customer_id, v_loan_number, v_customer_name
  FROM loans l JOIN loan_customers c ON l.customer_id = c.id WHERE l.id = p_loan_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Loan not found'; END IF;
  IF v_loan_status = 'closed' OR v_loan_status = 'rejected' THEN RAISE EXCEPTION 'Cannot add payment to a closed loan'; END IF;
  INSERT INTO loan_payments (loan_id, amount, payment_type, payment_method, notes)
  VALUES (p_loan_id, p_amount, p_payment_type, p_payment_method, p_notes) RETURNING id INTO v_payment_id;
  v_new_total := v_current_paid + p_amount;
  UPDATE loans SET total_amount_paid = v_new_total, updated_at = now() WHERE id = p_loan_id;
  DECLARE v_main_customer_id uuid;
  BEGIN
    SELECT id INTO v_main_customer_id FROM customers WHERE shop_id = v_shop_id AND phone = (SELECT phone FROM loan_customers WHERE id = v_customer_id) LIMIT 1;
    IF v_main_customer_id IS NOT NULL THEN
      INSERT INTO ledger_transactions (shop_id, customer_id, transaction_type, amount, entry_type, description, created_by)
      VALUES (v_shop_id, v_main_customer_id, 'PAYMENT', p_amount, 'CREDIT', 'Loan Repayment #' || v_loan_number || ' (' || p_payment_type || ')', p_user_id);
    END IF;
  END;
  RETURN json_build_object('payment_id', v_payment_id, 'previous_total', v_current_paid, 'new_total', v_new_total);
END;
$$;
ALTER FUNCTION add_loan_payment(UUID, NUMERIC, TEXT, TEXT, TEXT, UUID) SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION close_loan(p_loan_id uuid, p_settlement_amount numeric, p_settlement_notes text, p_user_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_loan_status text; v_principal numeric; v_total_paid numeric; v_final_settlement numeric;
  v_shop_id uuid; v_customer_id uuid; v_loan_number text;
BEGIN
  SELECT l.status, l.principal_amount, l.total_amount_paid, l.shop_id, l.customer_id, l.loan_number
  INTO v_loan_status, v_principal, v_total_paid, v_shop_id, v_customer_id, v_loan_number
  FROM loans l WHERE l.id = p_loan_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Loan not found'; END IF;
  IF v_loan_status = 'closed' THEN RAISE EXCEPTION 'Loan is already closed'; END IF;
  v_final_settlement := COALESCE(p_settlement_amount, v_total_paid);
  DECLARE v_final_payment_needed numeric;
  BEGIN
    v_final_payment_needed := v_final_settlement - v_total_paid;
    IF v_final_payment_needed > 0 THEN
      INSERT INTO loan_payments (loan_id, amount, payment_type, payment_method, notes)
      VALUES (p_loan_id, v_final_payment_needed, 'full_settlement', 'cash', 'Final Settlement at Closing');
      DECLARE v_main_customer_id uuid;
      BEGIN
        SELECT id INTO v_main_customer_id FROM customers WHERE shop_id = v_shop_id AND phone = (SELECT phone FROM loan_customers WHERE id = v_customer_id) LIMIT 1;
        IF v_main_customer_id IS NOT NULL THEN
          INSERT INTO ledger_transactions (shop_id, customer_id, transaction_type, amount, entry_type, description, created_by)
          VALUES (v_shop_id, v_main_customer_id, 'PAYMENT', v_final_payment_needed, 'CREDIT', 'Loan Final Settlement #' || v_loan_number, p_user_id);
        END IF;
      END;
      v_total_paid := v_final_settlement;
    END IF;
  END;
  UPDATE loans SET status = 'closed', end_date = CURRENT_DATE, total_amount_paid = v_total_paid, settlement_amount = v_final_settlement, settlement_notes = p_settlement_notes, updated_at = now() WHERE id = p_loan_id;
  RETURN json_build_object('loan_id', p_loan_id, 'end_date', CURRENT_DATE, 'settlement_amount', v_final_settlement);
END;
$$;
ALTER FUNCTION close_loan(UUID, NUMERIC, TEXT, UUID) SET search_path = public, extensions;

-- ==========================================
-- PART 8: SECURITY FIXES (RLS handled in consolidated_policies.sql)
-- ==========================================
ALTER TABLE IF EXISTS stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscriptions ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- PART 9: RELATIONSHIP FIXES
-- ==========================================
DO $$
BEGIN
    BEGIN
        ALTER TABLE transaction_documents DROP CONSTRAINT IF EXISTS transaction_documents_transaction_id_fkey;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    ALTER TABLE transaction_documents ADD CONSTRAINT transaction_documents_transaction_id_fkey
    FOREIGN KEY (transaction_id) REFERENCES ledger_transactions(id) ON DELETE CASCADE;
END $$;
COMMENT ON TABLE transaction_documents IS 'Documents attached to ledger transactions';

-- ==========================================
-- PART 10: ENHANCED DASHBOARD STATS RPC
-- ==========================================
DROP FUNCTION IF EXISTS get_dashboard_stats(UUID);
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_shop_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    result JSONB;
    v_customer_count INT;
    v_returning_count INT;
    v_new_customer_count INT;
    v_top_customer JSONB;
    v_customer_sparkline INT[];
    v_low_stock JSONB;
    v_top_loyalty_customer JSONB;
BEGIN
    -- Basic counts
    SELECT count(*) INTO v_customer_count FROM customers WHERE shop_id = p_shop_id;
    
    -- Returning customers: customers with more than 1 invoice
    SELECT count(*) INTO v_returning_count
    FROM customers c
    WHERE c.shop_id = p_shop_id
    AND (SELECT count(*) FROM invoices WHERE customer_id = c.id AND status != 'cancelled') > 1;
    
    v_new_customer_count := v_customer_count - v_returning_count;
    
    -- Top customer by spend
    SELECT jsonb_build_object(
        'name', c.name,
        'total_spent', COALESCE(c.total_spent, 0),
        'order_count', (SELECT count(*) FROM invoices WHERE customer_id = c.id AND status != 'cancelled')
    ) INTO v_top_customer
    FROM customers c
    WHERE c.shop_id = p_shop_id
    ORDER BY COALESCE(c.total_spent, 0) DESC
    LIMIT 1;
    
    -- Customer sparkline (last 7 days new customers)
    SELECT array_agg(daily_count ORDER BY day) INTO v_customer_sparkline
    FROM (
        SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day')::date AS day
    ) dates
    LEFT JOIN LATERAL (
        SELECT COUNT(*)::INT AS daily_count
        FROM customers
        WHERE shop_id = p_shop_id
        AND created_at::date = dates.day
    ) counts ON true;
    
    -- Low stock items (sample up to 5 - lowest weight items as a proxy)
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', id,
        'name', COALESCE(category, '') || ' ' || COALESCE(subcategory, ''),
        'gross_weight', gross_weight,
        'metal_type', metal_type
    )), '[]'::jsonb) INTO v_low_stock
    FROM (
        SELECT id, category, subcategory, gross_weight, metal_type
        FROM inventory_items
        WHERE shop_id = p_shop_id AND status = 'IN_STOCK'
        ORDER BY gross_weight ASC
        LIMIT 5
    ) sub;
    
    -- Top loyalty customer
    SELECT jsonb_build_object(
        'name', c.name,
        'loyalty_points', COALESCE(c.loyalty_points, 0)
    ) INTO v_top_loyalty_customer
    FROM customers c
    WHERE c.shop_id = p_shop_id AND COALESCE(c.loyalty_points, 0) > 0
    ORDER BY c.loyalty_points DESC
    LIMIT 1;

    -- Build final result
    SELECT jsonb_build_object(
        'customer_count', v_customer_count,
        'returning_customer_count', v_returning_count,
        'new_customer_count', v_new_customer_count,
        'product_count', (SELECT count(*) FROM inventory_items WHERE shop_id = p_shop_id AND status = 'IN_STOCK'),
        'invoice_count', (SELECT count(*) FROM invoices WHERE shop_id = p_shop_id),
        'active_loans_count', (SELECT count(*) FROM loans WHERE shop_id = p_shop_id AND status = 'active'),
        'khata_balance', (SELECT COALESCE(SUM(grand_total), 0) FROM invoices WHERE shop_id = p_shop_id AND status NOT IN ('paid', 'cancelled')),
        'total_loyalty_points', (SELECT COALESCE(SUM(loyalty_points), 0) FROM customers WHERE shop_id = p_shop_id),
        'loyalty_members_count', (SELECT count(*) FROM customers WHERE shop_id = p_shop_id AND COALESCE(loyalty_points, 0) > 0),
        'top_customer_by_spend', COALESCE(v_top_customer, '{}'::jsonb),
        'customer_sparkline', COALESCE(v_customer_sparkline, ARRAY[0,0,0,0,0,0,0]),
        'low_stock_items', v_low_stock,
        'top_loyalty_customer', v_top_loyalty_customer,
        -- Scheme stats
        'scheme_count', (SELECT count(*) FROM schemes WHERE shop_id = p_shop_id),
        'active_enrollments_count', (SELECT count(*) FROM customer_schemes WHERE shop_id = p_shop_id AND status = 'active'),
        'total_scheme_collected', (SELECT COALESCE(SUM(amount_paid), 0) FROM scheme_payments sp JOIN customer_schemes cs ON sp.enrollment_id = cs.id WHERE cs.shop_id = p_shop_id)
    ) INTO result;

    RETURN result;
END;
$$;
