-- ==========================================
-- Migration: Add Role Checks to RPC Functions
-- Description: RISK-003 - Enforce RBAC at database level
-- Date: 2025-12-15
-- ==========================================

-- 1. UPDATE create_invoice_v2 to check user has invoice creation permission
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
    
    -- RISK-003: Verify user is a shop member (any role can create invoices)
    IF NOT is_shop_member(p_shop_id) THEN
        RAISE EXCEPTION 'Access denied: You are not a member of this shop'
        USING ERRCODE = 'P0403';
    END IF;
    
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
    SELECT cgst_rate, sgst_rate INTO v_cgst_rate, v_sgst_rate FROM shops WHERE id = p_shop_id;
    
    -- Use safe invoice number generation (BUG-001 fix)
    v_invoice_number := generate_invoice_number_safe(p_shop_id);
    
    -- PHASE 1: Pre-validate all inventory items are available (BUG-004 fix)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_stock_id := (v_item->>'stockId')::UUID;
        IF v_stock_id IS NOT NULL THEN
            IF NOT EXISTS (
                SELECT 1 FROM inventory_items 
                WHERE id = v_stock_id 
                  AND shop_id = p_shop_id 
                  AND status = 'IN_STOCK'
                FOR UPDATE
            ) THEN
                v_unavailable_items := array_append(v_unavailable_items, COALESCE(v_item->>'tagId', v_stock_id::TEXT));
            END IF;
        END IF;
    END LOOP;
    
    IF array_length(v_unavailable_items, 1) > 0 THEN
        RAISE EXCEPTION 'Items not available for sale: %. They may already be sold or reserved.', 
            array_to_string(v_unavailable_items, ', ')
        USING ERRCODE = 'P0002';
    END IF;
    
    -- PHASE 2: Create invoice
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
        
        v_subtotal := v_subtotal + 
            ((v_item->>'netWeight')::NUMERIC * (v_item->>'rate')::NUMERIC) + 
            ((v_item->>'netWeight')::NUMERIC * (v_item->>'making')::NUMERIC);

        IF v_stock_id IS NOT NULL THEN
            UPDATE inventory_items 
            SET status = 'SOLD', 
                sold_invoice_id = v_invoice_id, 
                sold_at = NOW(),
                updated_at = NOW(),
                updated_by = v_user_id
            WHERE id = v_stock_id 
              AND shop_id = p_shop_id
              AND status = 'IN_STOCK';
            
            GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
            
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


-- 2. UPDATE soft_delete_invoice to require admin role
CREATE OR REPLACE FUNCTION soft_delete_invoice(p_invoice_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_shop_id UUID;
    v_invoice_number TEXT;
BEGIN
    -- Get invoice details
    SELECT shop_id, invoice_number INTO v_shop_id, v_invoice_number
    FROM invoices 
    WHERE id = p_invoice_id AND deleted_at IS NULL;
    
    IF v_shop_id IS NULL THEN
        RAISE EXCEPTION 'Invoice not found or already deleted'
        USING ERRCODE = 'P0001';
    END IF;
    
    -- RISK-003: Only admins (owner/manager) can delete invoices
    IF NOT is_shop_admin(v_shop_id) THEN
        RAISE EXCEPTION 'Access denied: Only shop owner or manager can delete invoices'
        USING ERRCODE = 'P0403';
    END IF;
    
    -- Perform soft delete
    UPDATE invoices 
    SET deleted_at = NOW(),
        deleted_by = auth.uid()
    WHERE id = p_invoice_id;
    
    -- Revert inventory items to IN_STOCK
    UPDATE inventory_items 
    SET status = 'IN_STOCK', 
        sold_invoice_id = NULL, 
        sold_at = NULL,
        updated_at = NOW()
    WHERE sold_invoice_id = p_invoice_id;
    
    -- Log to audit
    INSERT INTO audit_logs (shop_id, user_id, action, entity_type, entity_id, metadata)
    VALUES (v_shop_id, auth.uid(), 'SOFT_DELETE', 'INVOICE', p_invoice_id::TEXT, 
        jsonb_build_object('invoice_number', v_invoice_number));
    
    RETURN jsonb_build_object('success', true, 'invoice_id', p_invoice_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;


-- 3. UPDATE restore_invoice to require admin role
CREATE OR REPLACE FUNCTION restore_invoice(p_invoice_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_shop_id UUID;
    v_invoice_number TEXT;
    v_item RECORD;
    v_unavailable_items TEXT[] := ARRAY[]::TEXT[];
BEGIN
    SELECT shop_id, invoice_number INTO v_shop_id, v_invoice_number
    FROM invoices 
    WHERE id = p_invoice_id AND deleted_at IS NOT NULL;
    
    IF v_shop_id IS NULL THEN
        RAISE EXCEPTION 'Invoice not found or not deleted'
        USING ERRCODE = 'P0001';
    END IF;
    
    -- RISK-003: Only admins (owner/manager) can restore invoices
    IF NOT is_shop_admin(v_shop_id) THEN
        RAISE EXCEPTION 'Access denied: Only shop owner or manager can restore invoices'
        USING ERRCODE = 'P0403';
    END IF;
    
    -- Check if inventory items are still available
    FOR v_item IN 
        SELECT ii.stock_id, ii.tag_id, inv.status as item_status
        FROM invoice_items ii
        LEFT JOIN inventory_items inv ON ii.stock_id = inv.id
        WHERE ii.invoice_id = p_invoice_id AND ii.stock_id IS NOT NULL
    LOOP
        IF v_item.item_status IS NOT NULL AND v_item.item_status != 'IN_STOCK' THEN
            v_unavailable_items := array_append(v_unavailable_items, COALESCE(v_item.tag_id, v_item.stock_id::TEXT));
        END IF;
    END LOOP;
    
    IF array_length(v_unavailable_items, 1) > 0 THEN
        RAISE EXCEPTION 'Cannot restore: Some items have been sold on other invoices: %', 
            array_to_string(v_unavailable_items, ', ')
        USING ERRCODE = 'P0002';
    END IF;
    
    -- Restore the invoice
    UPDATE invoices 
    SET deleted_at = NULL,
        deleted_by = NULL
    WHERE id = p_invoice_id;
    
    -- Re-mark inventory items as SOLD
    UPDATE inventory_items 
    SET status = 'SOLD', 
        sold_invoice_id = p_invoice_id, 
        sold_at = NOW(),
        updated_at = NOW()
    WHERE id IN (
        SELECT stock_id FROM invoice_items 
        WHERE invoice_id = p_invoice_id AND stock_id IS NOT NULL
    );
    
    INSERT INTO audit_logs (shop_id, user_id, action, entity_type, entity_id, metadata)
    VALUES (v_shop_id, auth.uid(), 'RESTORE', 'INVOICE', p_invoice_id::TEXT, 
        jsonb_build_object('invoice_number', v_invoice_number));
    
    RETURN jsonb_build_object('success', true, 'invoice_id', p_invoice_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;


-- 4. UPDATE create_customer to check shop membership
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
    -- RISK-003: Verify user is a shop member
    IF NOT is_shop_member(p_shop_id) THEN
        RAISE EXCEPTION 'Access denied: You are not a member of this shop'
        USING ERRCODE = 'P0403';
    END IF;

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


-- Add comments
COMMENT ON FUNCTION create_invoice_v2 IS 'Creates invoice with items atomically. Includes RBAC check (RISK-003), race condition fix (BUG-001), and double-sell prevention (BUG-004).';
COMMENT ON FUNCTION soft_delete_invoice IS 'Soft deletes invoice. Requires admin role (owner/manager). RISK-003 compliant.';
COMMENT ON FUNCTION restore_invoice IS 'Restores soft-deleted invoice. Requires admin role. RISK-003 compliant.';
COMMENT ON FUNCTION create_customer IS 'Creates customer with optional opening balance. Requires shop membership. RISK-003 compliant.';
