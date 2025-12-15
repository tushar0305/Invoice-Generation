-- ==========================================
-- Migration: Implement Soft Delete for Invoices
-- Description: UX-002 - Soft delete instead of hard delete
-- Date: 2025-12-15
-- ==========================================

-- 1. SOFT DELETE FUNCTION
-- Instead of actually deleting, set deleted_at timestamp
CREATE OR REPLACE FUNCTION soft_delete_invoice(p_invoice_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_shop_id UUID;
    v_invoice_number TEXT;
BEGIN
    -- Get invoice details and verify it exists
    SELECT shop_id, invoice_number INTO v_shop_id, v_invoice_number
    FROM invoices 
    WHERE id = p_invoice_id AND deleted_at IS NULL;
    
    IF v_shop_id IS NULL THEN
        RAISE EXCEPTION 'Invoice not found or already deleted'
        USING ERRCODE = 'P0001';
    END IF;
    
    -- Perform soft delete
    UPDATE invoices 
    SET deleted_at = NOW(),
        deleted_by = auth.uid()
    WHERE id = p_invoice_id;
    
    -- Revert inventory items to IN_STOCK (same as hard delete trigger does)
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


-- 2. RESTORE INVOICE FUNCTION
CREATE OR REPLACE FUNCTION restore_invoice(p_invoice_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_shop_id UUID;
    v_invoice_number TEXT;
    v_item RECORD;
    v_unavailable_items TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Get invoice details
    SELECT shop_id, invoice_number INTO v_shop_id, v_invoice_number
    FROM invoices 
    WHERE id = p_invoice_id AND deleted_at IS NOT NULL;
    
    IF v_shop_id IS NULL THEN
        RAISE EXCEPTION 'Invoice not found or not deleted'
        USING ERRCODE = 'P0001';
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
    
    -- Log to audit
    INSERT INTO audit_logs (shop_id, user_id, action, entity_type, entity_id, metadata)
    VALUES (v_shop_id, auth.uid(), 'RESTORE', 'INVOICE', p_invoice_id::TEXT, 
        jsonb_build_object('invoice_number', v_invoice_number));
    
    RETURN jsonb_build_object('success', true, 'invoice_id', p_invoice_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;


-- 3. GET DELETED INVOICES FUNCTION (for trash view)
CREATE OR REPLACE FUNCTION get_deleted_invoices(p_shop_id UUID)
RETURNS TABLE (
    id UUID,
    invoice_number TEXT,
    grand_total NUMERIC,
    customer_name TEXT,
    deleted_at TIMESTAMPTZ,
    deleted_by_email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.invoice_number,
        i.grand_total,
        (i.customer_snapshot->>'name')::TEXT as customer_name,
        i.deleted_at,
        u.email as deleted_by_email
    FROM invoices i
    LEFT JOIN auth.users u ON i.deleted_by = u.id
    WHERE i.shop_id = p_shop_id 
      AND i.deleted_at IS NOT NULL
    ORDER BY i.deleted_at DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, extensions;


-- 4. AUTO-PURGE OLD DELETED INVOICES (optional cron - 90 days)
-- This can be called via pg_cron if desired
CREATE OR REPLACE FUNCTION purge_old_deleted_invoices()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Only purge invoices deleted more than 90 days ago
    DELETE FROM invoices 
    WHERE deleted_at IS NOT NULL 
      AND deleted_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;


-- Grant execute permissions
GRANT EXECUTE ON FUNCTION soft_delete_invoice(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_invoice(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_deleted_invoices(UUID) TO authenticated;

-- Add comments
COMMENT ON FUNCTION soft_delete_invoice IS 'UX-002: Soft deletes an invoice by setting deleted_at. Reverts inventory items to IN_STOCK.';
COMMENT ON FUNCTION restore_invoice IS 'UX-002: Restores a soft-deleted invoice. Verifies inventory items are still available.';
COMMENT ON FUNCTION get_deleted_invoices IS 'UX-002: Returns recently deleted invoices for the trash view.';
