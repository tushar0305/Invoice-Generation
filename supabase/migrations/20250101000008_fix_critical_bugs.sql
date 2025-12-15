-- ==========================================
-- Migration: Fix Invoice Race Condition & Double-Sell
-- Description: BUG-001 and BUG-004 from improvement backlog
-- Date: 2025-12-15
-- ==========================================

-- 1. FIX INVOICE NUMBER GENERATION (Race Condition)
-- Use FOR UPDATE to lock during number generation

CREATE OR REPLACE FUNCTION generate_invoice_number_safe(p_shop_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_count INTEGER;
    v_year TEXT;
    v_invoice_number TEXT;
    v_attempts INTEGER := 0;
    v_max_attempts CONSTANT INTEGER := 5;
BEGIN
    v_year := to_char(current_date, 'YYYY');
    
    -- Retry loop for race condition handling
    LOOP
        v_attempts := v_attempts + 1;
        
        -- Lock the shop row (or a specific lock table) to serialize invoice generation
        -- We can't lock the aggregation query directly.
        -- Instead, we lock the shop record itself to ensure only one invoice is generated at a time for this shop.
        PERFORM 1 FROM shops WHERE id = p_shop_id FOR UPDATE;
        
        -- Get max invoice number for this year
        SELECT COALESCE(MAX(CAST(substring(invoice_number from 'INV-' || v_year || '-([0-9]+)') AS INTEGER)), 0)
        INTO v_count
        FROM invoices
        WHERE shop_id = p_shop_id 
          AND invoice_number LIKE 'INV-' || v_year || '-%';
        
        v_invoice_number := 'INV-' || v_year || '-' || LPAD((v_count + 1)::TEXT, 4, '0');
        
        -- Attempt to "reserve" this number by checking it doesn't exist
        -- The actual INSERT happens in the calling function which will catch duplicates
        IF NOT EXISTS (SELECT 1 FROM invoices WHERE shop_id = p_shop_id AND invoice_number = v_invoice_number) THEN
            RETURN v_invoice_number;
        END IF;
        
        -- If we've exceeded max attempts, raise an error
        IF v_attempts >= v_max_attempts THEN
            RAISE EXCEPTION 'Could not generate unique invoice number after % attempts', v_max_attempts;
        END IF;
        
        -- Small wait before retry (rare case)
        PERFORM pg_sleep(0.05);
    END LOOP;
END;
$$ LANGUAGE plpgsql SET search_path = public, extensions;


-- 2. FIX CREATE_INVOICE_V2 (Double-Sell Prevention)
-- Add status check before updating inventory

DROP FUNCTION IF EXISTS create_invoice_v2(UUID, UUID, JSONB, JSONB, NUMERIC, TEXT, TEXT, INTEGER, INTEGER);

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
    v_rows_updated INTEGER;
    v_unavailable_items TEXT[] := ARRAY[]::TEXT[];
BEGIN
    v_user_id := auth.uid();
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
    SELECT cgst_rate, sgst_rate INTO v_cgst_rate, v_sgst_rate FROM shops WHERE id = p_shop_id;
    
    -- Use safe invoice number generation (BUG-001 fix)
    v_invoice_number := generate_invoice_number_safe(p_shop_id);
    
    -- PHASE 1: Pre-validate all inventory items are available (BUG-004 fix)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_stock_id := (v_item->>'stockId')::UUID;
        IF v_stock_id IS NOT NULL THEN
            -- Check if item is available
            IF NOT EXISTS (
                SELECT 1 FROM inventory_items 
                WHERE id = v_stock_id 
                  AND shop_id = p_shop_id 
                  AND status = 'IN_STOCK'
                FOR UPDATE -- Lock the row to prevent concurrent sales
            ) THEN
                v_unavailable_items := array_append(v_unavailable_items, COALESCE(v_item->>'tagId', v_stock_id::TEXT));
            END IF;
        END IF;
    END LOOP;
    
    -- If any items are unavailable, fail the entire transaction
    IF array_length(v_unavailable_items, 1) > 0 THEN
        RAISE EXCEPTION 'Items not available for sale: %. They may already be sold or reserved.', 
            array_to_string(v_unavailable_items, ', ')
        USING ERRCODE = 'P0002';
    END IF;
    
    -- PHASE 2: Create invoice (items are now locked)
    INSERT INTO invoices (
        shop_id, invoice_number, customer_id, customer_snapshot, status, 
        discount, notes, created_by_name, created_by
    ) VALUES (
        p_shop_id, v_invoice_number, p_customer_id, p_customer_snapshot, p_status,
        p_discount, p_notes, v_user_email, v_user_id
    ) RETURNING id INTO v_invoice_id;
    
    -- PHASE 3: Process items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_stock_id := (v_item->>'stockId')::UUID;
        
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
            v_item->>'tagId'
        );
        
        -- Calculate line item amount
        v_subtotal := v_subtotal + 
            ((v_item->>'netWeight')::NUMERIC * (v_item->>'rate')::NUMERIC) + 
            ((v_item->>'netWeight')::NUMERIC * (v_item->>'making')::NUMERIC);

        -- Update inventory status (items already locked above)
        IF v_stock_id IS NOT NULL THEN
            UPDATE inventory_items 
            SET status = 'SOLD', 
                sold_invoice_id = v_invoice_id, 
                sold_at = NOW(),
                updated_at = NOW(),
                updated_by = v_user_id
            WHERE id = v_stock_id 
              AND shop_id = p_shop_id
              AND status = 'IN_STOCK'; -- Extra safety check
            
            GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
            
            -- This should never happen due to pre-validation, but as safety
            IF v_rows_updated = 0 THEN
                RAISE EXCEPTION 'Failed to update inventory item %. It may have been sold by another user.',
                    COALESCE(v_item->>'tagId', v_stock_id::TEXT)
                USING ERRCODE = 'P0002';
            END IF;
        END IF;
    END LOOP;
    
    -- PHASE 4: Final calculations
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
    
    -- PHASE 5: Ledger integration
    IF p_status = 'due' AND p_customer_id IS NOT NULL THEN
        INSERT INTO ledger_transactions (
            shop_id, customer_id, invoice_id, transaction_type, amount, entry_type, description, created_by
        ) VALUES (
            p_shop_id, p_customer_id, v_invoice_id, 'INVOICE', v_grand_total, 'DEBIT', 
            'Invoice #' || v_invoice_number, v_user_id
        );
        UPDATE customers SET total_spent = total_spent + v_grand_total WHERE id = p_customer_id;
    END IF;

    -- PHASE 6: Loyalty points
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


-- 3. ADD AUDIT TRIGGER FOR INVOICES (RISK-001)
-- Log invoice changes for compliance

CREATE OR REPLACE FUNCTION audit_invoice_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (shop_id, user_id, action, entity_type, entity_id, metadata)
        VALUES (NEW.shop_id, auth.uid(), 'CREATE', 'INVOICE', NEW.id::TEXT, 
            jsonb_build_object('invoice_number', NEW.invoice_number, 'grand_total', NEW.grand_total));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Only log significant changes
        IF OLD.status IS DISTINCT FROM NEW.status OR OLD.grand_total IS DISTINCT FROM NEW.grand_total THEN
            INSERT INTO audit_logs (shop_id, user_id, action, entity_type, entity_id, metadata)
            VALUES (NEW.shop_id, auth.uid(), 'UPDATE', 'INVOICE', NEW.id::TEXT, 
                jsonb_build_object(
                    'invoice_number', NEW.invoice_number,
                    'old_status', OLD.status, 
                    'new_status', NEW.status,
                    'old_total', OLD.grand_total,
                    'new_total', NEW.grand_total
                ));
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (shop_id, user_id, action, entity_type, entity_id, metadata)
        VALUES (OLD.shop_id, auth.uid(), 'DELETE', 'INVOICE', OLD.id::TEXT, 
            jsonb_build_object('invoice_number', OLD.invoice_number, 'grand_total', OLD.grand_total));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

DROP TRIGGER IF EXISTS trigger_audit_invoice ON invoices;
CREATE TRIGGER trigger_audit_invoice
    AFTER INSERT OR UPDATE OR DELETE ON invoices
    FOR EACH ROW EXECUTE FUNCTION audit_invoice_changes();

-- Add comment for documentation
COMMENT ON FUNCTION create_invoice_v2 IS 'Creates invoice with items atomically. Includes race condition fix (BUG-001) and double-sell prevention (BUG-004). Items are locked using SELECT FOR UPDATE before invoice creation.';
