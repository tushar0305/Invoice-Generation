-- Migration: Fix Khata Book
-- 1. Create customer_balances_view (Optimized for performance and filtering)
-- 2. Create RPCs for Customer/Ledger Management (Missing in audit)
-- 3. Add Indexes for Ledger performance

-- ==========================================
-- 1. VIEW: Customer Balances
-- ==========================================
DROP VIEW IF EXISTS customer_balances_view CASCADE;

CREATE OR REPLACE VIEW customer_balances_view AS
SELECT 
    c.id,
    c.shop_id,
    c.name,
    c.phone,
    c.email,
    c.address,
    COALESCE(c.total_spent, 0) as total_debit,
    COALESCE(SUM(CASE WHEN lt.entry_type = 'CREDIT' THEN lt.amount ELSE 0 END), 0) as total_credit,
    COALESCE(SUM(CASE WHEN lt.entry_type = 'DEBIT' THEN lt.amount ELSE -lt.amount END), 0) as current_balance,
    COUNT(lt.id) as transaction_count,
    MAX(lt.transaction_date) as last_activity_date,
    MAX(lt.created_at) as last_activity_timestamp
FROM customers c
LEFT JOIN ledger_transactions lt ON c.id = lt.customer_id
GROUP BY c.id;

-- ==========================================
-- 2. RPC: Create Customer
-- ==========================================
-- Drop old versions with potentially different return types
DROP FUNCTION IF EXISTS create_customer(uuid, text, text, text, text, text, text, text, numeric);
DROP FUNCTION IF EXISTS create_customer(uuid, text, text, text, text, text, text, text); -- Legacy signature check

CREATE OR REPLACE FUNCTION create_customer(
    p_shop_id UUID,
    p_name TEXT,
    p_phone TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_state TEXT DEFAULT NULL,
    p_pincode TEXT DEFAULT NULL,
    p_gst_number TEXT DEFAULT NULL,
    p_opening_balance NUMERIC DEFAULT 0
) RETURNS UUID AS $$
DECLARE
    v_customer_id UUID;
BEGIN
    INSERT INTO customers (
        shop_id, name, phone, email, address, state, pincode, gst_number
    ) VALUES (
        p_shop_id, p_name, p_phone, p_email, p_address, p_state, p_pincode, p_gst_number
    ) RETURNING id INTO v_customer_id;

    -- If there's an opening balance, record it as a transaction
    IF p_opening_balance <> 0 THEN
        INSERT INTO ledger_transactions (
            shop_id, customer_id, transaction_type, amount, entry_type, description, transaction_date, created_by
        ) VALUES (
            p_shop_id, 
            v_customer_id, 
            'ADJUSTMENT', 
            ABS(p_opening_balance), 
            CASE WHEN p_opening_balance > 0 THEN 'DEBIT' ELSE 'CREDIT' END, -- >0 means they owe us (Debit)
            'Opening Balance',
            CURRENT_DATE,
            auth.uid()
        );
        
        -- Update stats
        IF p_opening_balance > 0 THEN
             UPDATE customers SET total_spent = total_spent + ABS(p_opening_balance) WHERE id = v_customer_id;
        END IF;
    END IF;

    RETURN v_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- 3. RPC: Update Customer
-- ==========================================
DROP FUNCTION IF EXISTS update_customer(uuid, uuid, text, text, text, text, text, text, text);

CREATE OR REPLACE FUNCTION update_customer(
    p_customer_id UUID,
    p_shop_id UUID,
    p_name TEXT,
    p_phone TEXT,
    p_email TEXT,
    p_address TEXT,
    p_state TEXT,
    p_pincode TEXT,
    p_gst_number TEXT
) RETURNS VOID AS $$
BEGIN
    UPDATE customers
    SET name = p_name,
        phone = p_phone,
        email = p_email,
        address = p_address,
        state = p_state,
        pincode = p_pincode,
        gst_number = p_gst_number,
        updated_at = NOW()
    WHERE id = p_customer_id AND shop_id = p_shop_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- 4. RPC: Add Ledger Transaction
-- ==========================================
DROP FUNCTION IF EXISTS add_ledger_transaction(uuid, uuid, numeric, text, text, text, date);

CREATE OR REPLACE FUNCTION add_ledger_transaction(
    p_shop_id UUID,
    p_customer_id UUID,
    p_amount NUMERIC,
    p_transaction_type TEXT, 
    p_entry_type TEXT, 
    p_description TEXT,
    p_date DATE
) RETURNS UUID AS $$
DECLARE
    v_trans_id UUID;
BEGIN
    INSERT INTO ledger_transactions (
        shop_id, customer_id, transaction_type, amount, entry_type, description, transaction_date, created_by
    ) VALUES (
        p_shop_id, p_customer_id, p_transaction_type, p_amount, p_entry_type, p_description, p_date, auth.uid()
    ) RETURNING id INTO v_trans_id;

    -- Update Customer total_spent if it's a DEBIT (Money given / Invoice)
    IF p_entry_type = 'DEBIT' THEN
        UPDATE customers SET total_spent = total_spent + p_amount WHERE id = p_customer_id;
    END IF;

    RETURN v_trans_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- 5. RPC: Delete Ledger Transaction
-- ==========================================
DROP FUNCTION IF EXISTS delete_ledger_transaction(uuid, uuid);

CREATE OR REPLACE FUNCTION delete_ledger_transaction(
    p_transaction_id UUID,
    p_shop_id UUID
) RETURNS VOID AS $$
DECLARE
    v_amount NUMERIC;
    v_entry_type TEXT;
    v_customer_id UUID;
BEGIN
    SELECT amount, entry_type, customer_id INTO v_amount, v_entry_type, v_customer_id
    FROM ledger_transactions 
    WHERE id = p_transaction_id AND shop_id = p_shop_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transaction not found';
    END IF;

    DELETE FROM ledger_transactions WHERE id = p_transaction_id;

    -- Revert stats
    IF v_entry_type = 'DEBIT' THEN
        UPDATE customers SET total_spent = total_spent - v_amount WHERE id = v_customer_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- 6. Indexes for Performance
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_ledger_customer_date ON ledger_transactions (customer_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_shop_date ON ledger_transactions (shop_id, transaction_date DESC);
