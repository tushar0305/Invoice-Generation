-- ==========================================
-- Migration: Fix Customer Duplication (BUG-005)
-- Description: Prevent duplicate customers with NULL phone (Walk-ins). Reuse existing if found.
-- Date: 2025-12-15
-- ==========================================

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

    -- BUG-005: Handle duplicate checks properly
    IF p_phone IS NOT NULL AND p_phone <> '' THEN
        -- Standard check for phone number uniqueness
        SELECT id INTO v_existing_id FROM public.customers 
        WHERE shop_id = p_shop_id AND phone = p_phone AND deleted_at IS NULL;

        IF v_existing_id IS NOT NULL THEN
            RAISE EXCEPTION 'Customer with this phone number already exists (ID: %)', v_existing_id
            USING ERRCODE = 'P0001';
        END IF;
    ELSE
        -- If phone is NULL or empty (Walk-in), try to find existing walk-in to reuse
        -- We treat empty string same as NULL for uniqueness purposes here
        SELECT id INTO v_existing_id FROM public.customers 
        WHERE shop_id = p_shop_id 
          AND (phone IS NULL OR phone = '') 
          AND deleted_at IS NULL 
        LIMIT 1;
        
        IF v_existing_id IS NOT NULL THEN
            -- Reuse existing walk-in customer
            -- We optionally update the name if provided, but for now just return ID
            RETURN jsonb_build_object('id', v_existing_id, 'reused', true);
        END IF;
    END IF;

    INSERT INTO public.customers (
        shop_id, name, phone, email, address, state, pincode, gst_number
    ) VALUES (
        p_shop_id, p_name, NULLIF(p_phone, ''), p_email, p_address, p_state, p_pincode, p_gst_number
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

COMMENT ON FUNCTION create_customer IS 'Creates customer. Reuses existing record for walk-ins (empty phone). RISK-003 compliant.';
