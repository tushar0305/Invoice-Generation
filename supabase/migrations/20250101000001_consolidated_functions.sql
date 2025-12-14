-- ==========================================
-- Migration 0002: Consolidated Functions
-- Description: Triggers, RPCs, and Helpers
-- ==========================================

-- 1. SECURITY HELPERS
CREATE OR REPLACE FUNCTION public.is_shop_member(shop_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_shop_roles
        WHERE user_id = auth.uid()
        AND shop_id = shop_uuid
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.is_shop_owner(p_shop_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_shop_roles
        WHERE user_id = auth.uid() AND shop_id = p_shop_id AND role = 'owner' AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION public.is_shop_admin(p_shop_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_shop_roles
        WHERE user_id = auth.uid() AND shop_id = p_shop_id AND role IN ('owner', 'manager') AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, extensions;

-- 2. INVENTORY FUNCTIONS

-- Generate Inventory Tag ID (Legacy Sequence Logic)
CREATE OR REPLACE FUNCTION generate_inventory_tag_id(
  p_shop_id UUID,
  p_metal_type TEXT,
  p_purity TEXT
) RETURNS TEXT AS $$
DECLARE
  v_shop_prefix TEXT;
  v_metal_code TEXT;
  v_purity_code TEXT;
  v_sequence INTEGER;
  v_tag_id TEXT;
BEGIN
  -- Get shop prefix (first 2 chars of shop name, uppercased)
  SELECT UPPER(SUBSTRING(shop_name FROM 1 FOR 2)) INTO v_shop_prefix FROM shops WHERE id = p_shop_id;
  IF v_shop_prefix IS NULL THEN
    v_shop_prefix := 'XX';
  END IF;

  -- Metal code
  v_metal_code := CASE p_metal_type
    WHEN 'GOLD' THEN 'G'
    WHEN 'SILVER' THEN 'S'
    WHEN 'DIAMOND' THEN 'D'
    WHEN 'PLATINUM' THEN 'P'
    ELSE 'X'
  END;

  -- Purity code (first 2 digits)
  v_purity_code := REGEXP_REPLACE(p_purity, '[^0-9]', '', 'g');
  IF LENGTH(v_purity_code) > 2 THEN
    v_purity_code := SUBSTRING(v_purity_code FROM 1 FOR 2);
  END IF;
  IF LENGTH(v_purity_code) < 2 THEN
    v_purity_code := LPAD(v_purity_code, 2, '0');
  END IF;

  -- Get and increment sequence
  INSERT INTO inventory_tag_sequences (shop_id, metal_type, last_sequence)
  VALUES (p_shop_id, p_metal_type, 1)
  ON CONFLICT (shop_id, metal_type)
  DO UPDATE SET last_sequence = inventory_tag_sequences.last_sequence + 1
  RETURNING last_sequence INTO v_sequence;

  -- Build tag: XX-G22-000001
  v_tag_id := v_shop_prefix || '-' || v_metal_code || v_purity_code || '-' || LPAD(v_sequence::TEXT, 6, '0');

  RETURN v_tag_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Set Tag ID
CREATE OR REPLACE FUNCTION set_inventory_tag_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tag_id IS NULL OR NEW.tag_id = '' THEN
    NEW.tag_id := generate_inventory_tag_id(NEW.shop_id, NEW.metal_type, NEW.purity);
  END IF;
  NEW.qr_data := NEW.tag_id;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_inventory_tag_id ON inventory_items;
CREATE TRIGGER trigger_set_inventory_tag_id
  BEFORE INSERT ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION set_inventory_tag_id();

-- Trigger: Track Status
CREATE OR REPLACE FUNCTION track_inventory_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status OR OLD.location IS DISTINCT FROM NEW.location THEN
    INSERT INTO inventory_status_history (item_id, old_status, new_status, old_location, new_location, created_by)
    VALUES (NEW.id, OLD.status, NEW.status, OLD.location, NEW.location, auth.uid());
  END IF;
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_track_inventory_status ON inventory_items;
CREATE TRIGGER trigger_track_inventory_status
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION track_inventory_status_change();

-- Trigger: Revert Inventory on Invoice Item Delete
-- This handles both invoice deletion (cascade) and item removal
CREATE OR REPLACE FUNCTION revert_inventory_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stock_id IS NOT NULL THEN
    UPDATE inventory_items 
    SET status = 'IN_STOCK', 
        sold_invoice_id = NULL, 
        sold_at = NULL,
        location = COALESCE(location, 'SHOWCASE'), -- Optional: Reset location?
        updated_at = NOW()
    WHERE id = OLD.stock_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_revert_inventory_on_delete ON invoice_items;
CREATE TRIGGER trigger_revert_inventory_on_delete
  AFTER DELETE ON invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION revert_inventory_on_delete();

-- 3. INVOICING & UTILS

-- Generate Invoice Number
CREATE OR REPLACE FUNCTION generate_invoice_number(p_shop_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_count INTEGER;
    v_year TEXT;
BEGIN
    v_year := to_char(current_date, 'YYYY');
    SELECT COALESCE(MAX(CAST(substring(invoice_number from 'INV-' || v_year || '-([0-9]+)') AS INTEGER)), 0)
    INTO v_count
    FROM invoices
    WHERE shop_id = p_shop_id AND invoice_number LIKE 'INV-' || v_year || '-%';
    RETURN 'INV-' || v_year || '-' || LPAD((v_count + 1)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SET search_path = public, extensions;

-- Create Invoice v2 (Transactional Inventory Update)
-- Must drop first to allow return type changes or signature updates
DROP FUNCTION IF EXISTS create_invoice_v2(UUID, UUID, JSONB, JSONB, NUMERIC, TEXT, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS create_invoice_with_items(UUID, UUID, JSONB, JSONB, NUMERIC, TEXT, TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION create_invoice_v2(
    p_shop_id UUID,
    p_customer_id UUID,
    p_customer_snapshot JSONB,
    p_items JSONB,
    p_discount NUMERIC,
    p_notes TEXT,
    p_status TEXT DEFAULT 'due',
    p_loyalty_points_earned INTEGER DEFAULT 0,
    p_loyalty_points_redeemed INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    v_invoice_id UUID;
    v_invoice_number TEXT;
    v_item JSONB;
    v_subtotal NUMERIC := 0;
    v_cgst_rate NUMERIC;
    v_sgst_rate NUMERIC;
    v_cgst_amount NUMERIC;
    v_sgst_amount NUMERIC;
    v_grand_total NUMERIC;
    v_user_id UUID;
    v_user_email TEXT;
    v_stock_id UUID;
BEGIN
    v_user_id := auth.uid();
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
    SELECT cgst_rate, sgst_rate INTO v_cgst_rate, v_sgst_rate FROM shops WHERE id = p_shop_id;
    v_invoice_number := generate_invoice_number(p_shop_id);
    
    INSERT INTO invoices (
        shop_id, invoice_number, customer_id, customer_snapshot, status, 
        discount, notes, created_by_name, created_by
    ) VALUES (
        p_shop_id, v_invoice_number, p_customer_id, p_customer_snapshot, p_status,
        p_discount, p_notes, v_user_email, v_user_id
    ) RETURNING id INTO v_invoice_id;
    
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        -- Extract stock/tag info
        v_stock_id := (v_item->>'stockId')::UUID;
        
        -- Get tag_id from inventory if not provided in JSON but stock_id is
        -- (Optional: frontend should pass it, but good to be safe. For now assuming frontend passes it or we just store stock_id)
        
        INSERT INTO invoice_items (
            invoice_id, description, purity, gross_weight, net_weight, rate, making,
            hsn_code, stock_id, tag_id
        ) VALUES (
            v_invoice_id,
            v_item->>'description',
            v_item->>'purity',
            (v_item->>'grossWeight')::NUMERIC,
            (v_item->>'netWeight')::NUMERIC,
            (v_item->>'rate')::NUMERIC,
            (v_item->>'making')::NUMERIC,
            v_item->>'hsnCode',
            v_stock_id,
            v_item->>'tagId' -- Frontend must pass this!
        );
        -- Re-calculate line item amount
        v_subtotal := v_subtotal + 
            ((v_item->>'netWeight')::NUMERIC * (v_item->>'rate')::NUMERIC) + 
            ((v_item->>'netWeight')::NUMERIC * (v_item->>'making')::NUMERIC);

        -- CRITICAL: Transactional Inventory Update
        v_stock_id := (v_item->>'stockId')::UUID;
        IF v_stock_id IS NOT NULL THEN
            UPDATE inventory_items 
            SET status = 'SOLD', 
                sold_invoice_id = v_invoice_id, 
                sold_at = NOW(),
                updated_at = NOW(),
                updated_by = v_user_id
            WHERE id = v_stock_id AND shop_id = p_shop_id;
        END IF;
    END LOOP;
    
    -- Final Calc
    v_subtotal := v_subtotal - COALESCE(p_discount, 0);
    v_cgst_amount := v_subtotal * (v_cgst_rate / 100);
    v_sgst_amount := v_subtotal * (v_sgst_rate / 100);
    v_grand_total := v_subtotal + v_cgst_amount + v_sgst_amount;
    
    UPDATE invoices SET 
        subtotal = v_subtotal + COALESCE(p_discount, 0),
        cgst_amount = v_cgst_amount,
        sgst_amount = v_sgst_amount,
        grand_total = v_grand_total
    WHERE id = v_invoice_id;
    
    -- Ledger Integration
    IF p_status = 'due' AND p_customer_id IS NOT NULL THEN
        INSERT INTO ledger_transactions (
            shop_id, customer_id, invoice_id, transaction_type, amount, entry_type, description, created_by
        ) VALUES (
            p_shop_id, p_customer_id, v_invoice_id, 'INVOICE', v_grand_total, 'DEBIT', 
            'Invoice #' || v_invoice_number, v_user_id
        );
        UPDATE customers SET total_spent = total_spent + v_grand_total WHERE id = p_customer_id;
    END IF;

    -- Loyalty
    IF p_customer_id IS NOT NULL THEN
        IF p_loyalty_points_earned > 0 THEN
             UPDATE customers SET loyalty_points = loyalty_points + p_loyalty_points_earned
             WHERE id = p_customer_id;
             INSERT INTO customer_loyalty_logs (customer_id, shop_id, invoice_id, points_change, reason)
             VALUES (p_customer_id, p_shop_id, v_invoice_id, p_loyalty_points_earned, 'Earned from Invoice #' || v_invoice_number);
        END IF;

        IF p_loyalty_points_redeemed > 0 THEN
             UPDATE customers SET loyalty_points = loyalty_points - p_loyalty_points_redeemed
             WHERE id = p_customer_id;
             INSERT INTO customer_loyalty_logs (customer_id, shop_id, invoice_id, points_change, reason)
             VALUES (p_customer_id, p_shop_id, v_invoice_id, -p_loyalty_points_redeemed, 'Redeemed on Invoice #' || v_invoice_number);
        END IF;
    END IF;

    RETURN jsonb_build_object('invoice_id', v_invoice_id, 'invoice_number', v_invoice_number, 'grand_total', v_grand_total);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- Create New Shop
CREATE OR REPLACE FUNCTION create_new_shop_with_details(
    p_shop_name TEXT,
    p_phone_number TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_state TEXT DEFAULT NULL,
    p_pincode TEXT DEFAULT NULL,
    p_gst_number TEXT DEFAULT NULL,
    p_pan_number TEXT DEFAULT NULL,
    p_logo_url TEXT DEFAULT NULL,
    p_cgst_rate NUMERIC DEFAULT 1.5,
    p_sgst_rate NUMERIC DEFAULT 1.5,
    p_template_id TEXT DEFAULT 'classic'
)
RETURNS UUID AS $$
DECLARE
    v_shop_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    INSERT INTO shops (
        shop_name, phone_number, email, address, state, pincode, 
        gst_number, pan_number, logo_url, cgst_rate, sgst_rate, template_id, created_by
    ) VALUES (
        p_shop_name, p_phone_number, p_email, p_address, p_state, p_pincode,
        p_gst_number, p_pan_number, p_logo_url, p_cgst_rate, p_sgst_rate, p_template_id, v_user_id
    ) RETURNING id INTO v_shop_id;
    
    INSERT INTO user_shop_roles (user_id, shop_id, role)
    VALUES (v_user_id, v_shop_id, 'owner');
    
    INSERT INTO user_preferences (user_id, last_active_shop_id, onboarding_completed)
    VALUES (v_user_id, v_shop_id, true)
    ON CONFLICT (user_id) DO UPDATE SET
        last_active_shop_id = v_shop_id,
        onboarding_completed = true;
        
    RETURN v_shop_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- Create Customer
CREATE OR REPLACE FUNCTION public.create_customer(
    p_shop_id UUID,
    p_name TEXT,
    p_phone TEXT,
    p_email TEXT,
    p_address TEXT,
    p_state TEXT,
    p_pincode TEXT,
    p_gst_number TEXT,
    p_opening_balance NUMERIC DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    v_customer_id UUID;
    v_existing_id UUID;
    v_entry_type TEXT;
    v_amount NUMERIC;
BEGIN
    SELECT id INTO v_existing_id FROM public.customers 
    WHERE shop_id = p_shop_id AND phone = p_phone AND deleted_at IS NULL;

    IF v_existing_id IS NOT NULL THEN
        RAISE EXCEPTION 'Customer with this phone number already exists (ID: %)', v_existing_id
        USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO public.customers (
        shop_id, name, phone, email, address, state, pincode, gst_number
    ) VALUES (
        p_shop_id, p_name, p_phone, p_email, p_address, p_state, p_pincode, p_gst_number
    ) RETURNING id INTO v_customer_id;

    IF p_opening_balance IS NOT NULL AND p_opening_balance <> 0 THEN
        v_amount := ABS(p_opening_balance);
        IF p_opening_balance > 0 THEN v_entry_type := 'DEBIT'; ELSE v_entry_type := 'CREDIT'; END IF;

        INSERT INTO public.ledger_transactions (
            shop_id, customer_id, transaction_type, amount, entry_type, description, transaction_date, created_by
        ) VALUES (
            p_shop_id, v_customer_id, 'ADJUSTMENT', v_amount, v_entry_type, 'Opening Balance', CURRENT_DATE, auth.uid()
        );
    END IF;
    RETURN jsonb_build_object('id', v_customer_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- Dashboard Stats
CREATE OR REPLACE FUNCTION get_dashboard_stats(
    p_shop_id UUID,
    p_month_start TIMESTAMPTZ,
    p_month_end TIMESTAMPTZ,
    p_week_start TIMESTAMPTZ,
    p_today_start TIMESTAMPTZ,
    p_last_month_start TIMESTAMPTZ,
    p_last_month_end TIMESTAMPTZ
)
RETURNS JSONB AS $$
DECLARE
    v_total_paid_this_month NUMERIC;
    v_total_paid_this_week NUMERIC;
    v_total_paid_today NUMERIC;
    v_total_paid_last_month NUMERIC;
    v_revenue_mom NUMERIC;
    v_recent_invoices JSONB;
    v_due_invoices JSONB;
BEGIN
    SELECT COALESCE(SUM(grand_total), 0) INTO v_total_paid_this_month FROM invoices WHERE shop_id = p_shop_id AND status = 'paid' AND invoice_date BETWEEN p_month_start::DATE AND p_month_end::DATE;
    SELECT COALESCE(SUM(grand_total), 0) INTO v_total_paid_this_week FROM invoices WHERE shop_id = p_shop_id AND status = 'paid' AND invoice_date >= p_week_start::DATE;
    SELECT COALESCE(SUM(grand_total), 0) INTO v_total_paid_today FROM invoices WHERE shop_id = p_shop_id AND status = 'paid' AND invoice_date >= p_today_start::DATE;
    SELECT COALESCE(SUM(grand_total), 0) INTO v_total_paid_last_month FROM invoices WHERE shop_id = p_shop_id AND status = 'paid' AND invoice_date BETWEEN p_last_month_start::DATE AND p_last_month_end::DATE;

    IF v_total_paid_last_month = 0 THEN
        v_revenue_mom := CASE WHEN v_total_paid_this_month > 0 THEN 100 ELSE 0 END;
    ELSE
        v_revenue_mom := ((v_total_paid_this_month - v_total_paid_last_month) / v_total_paid_last_month) * 100;
    END IF;

    SELECT jsonb_agg(t) INTO v_recent_invoices FROM (
        SELECT i.id, i.invoice_number, i.grand_total, i.status, i.invoice_date, i.created_at, c.name as customer_name, c.phone as customer_phone
        FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id
        WHERE i.shop_id = p_shop_id ORDER BY i.created_at DESC LIMIT 10
    ) t;

    SELECT jsonb_agg(t) INTO v_due_invoices FROM (
        SELECT i.id, i.invoice_number, i.grand_total, i.status, i.invoice_date as due_date, c.name as customer_name, c.phone as customer_phone
        FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id
        WHERE i.shop_id = p_shop_id AND i.status = 'due' ORDER BY i.invoice_date ASC
    ) t;

    RETURN jsonb_build_object(
        'totalPaidThisMonth', v_total_paid_this_month, 'totalPaidThisWeek', v_total_paid_this_week,
        'totalPaidToday', v_total_paid_today, 'revenueMoM', v_revenue_mom,
        'recentInvoices', COALESCE(v_recent_invoices, '[]'::jsonb), 'dueInvoices', COALESCE(v_due_invoices, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- Search Customers
CREATE OR REPLACE FUNCTION public.search_customers(p_shop_id uuid, p_query text, p_limit int default 10, p_offset int default 0) 
returns table (id uuid, shop_id uuid, name text, email text, phone text, address text, state text, pincode text, loyalty_points int, rank real, name_highlight text, email_highlight text, phone_highlight text) 
language sql stable as $$
    select c.id, c.shop_id, c.name, c.email, c.phone, c.address, c.state, c.pincode, c.loyalty_points,
        ts_rank(c.search_vector, websearch_to_tsquery('simple', unaccent(coalesce(p_query, '')))) as rank,
        ts_headline('simple', coalesce(c.name, ''),  websearch_to_tsquery('simple', unaccent(coalesce(p_query, ''))), 'StartSel=<mark>,StopSel=</mark>,MaxWords=20,MinWords=1,MaxFragments=1') as name_highlight,
        ts_headline('simple', coalesce(c.email, ''), websearch_to_tsquery('simple', unaccent(coalesce(p_query, ''))), 'StartSel=<mark>,StopSel=</mark>,MaxWords=20,MinWords=1,MaxFragments=1') as email_highlight,
        ts_headline('simple', coalesce(c.phone, ''), websearch_to_tsquery('simple', unaccent(coalesce(p_query, ''))), 'StartSel=<mark>,StopSel=</mark>,MaxWords=20,MinWords=1,MaxFragments=1') as phone_highlight
    from public.customers c
    where c.shop_id = p_shop_id
      and (coalesce(p_query, '') = '' or c.search_vector @@ websearch_to_tsquery('simple', unaccent(coalesce(p_query, ''))))
    order by rank desc nulls last, c.created_at desc limit greatest(p_limit, 1) offset greatest(p_offset, 0);
$$;

-- Trigger: Search Vector
CREATE OR REPLACE FUNCTION public.update_customers_search_vector() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.search_vector := to_tsvector('simple', unaccent(coalesce(NEW.name, '')) || ' ' || unaccent(coalesce(NEW.email, '')) || ' ' || unaccent(coalesce(NEW.phone, '')));
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_customers_search_vector ON public.customers;
CREATE TRIGGER trg_customers_search_vector BEFORE INSERT OR UPDATE OF name, email, phone ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_customers_search_vector();

-- Trigger: Whatsapp timestamp
CREATE OR REPLACE FUNCTION update_whatsapp_config_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public, extensions;

DROP TRIGGER IF EXISTS whatsapp_config_updated_at ON whatsapp_configs;
CREATE TRIGGER whatsapp_config_updated_at BEFORE UPDATE ON whatsapp_configs FOR EACH ROW EXECUTE FUNCTION update_whatsapp_config_updated_at();

-- Full Text Search Grants
GRANT EXECUTE ON FUNCTION public.search_customers(uuid, text, int, int) TO authenticated;
