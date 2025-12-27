-- Migration: 20251227000002_fix_inventory_concurrency.sql
-- Description: Fix Double-Sell Concurrency bug in create_invoice_v2 and add audit logging.

CREATE OR REPLACE FUNCTION public.create_invoice_v2(
    p_shop_id uuid,
    p_customer_id uuid,
    p_customer_snapshot jsonb,
    p_items jsonb, -- Array of items
    p_discount numeric,
    p_notes text,
    p_status text DEFAULT 'due',
    p_loyalty_points_earned integer DEFAULT 0,
    p_loyalty_points_redeemed integer DEFAULT 0
)
RETURNS jsonb AS $$
DECLARE
    v_invoice_id uuid;
    v_invoice_number text;
    v_subtotal numeric := 0;
    v_grand_total numeric := 0;
    v_cgst_amount numeric := 0;
    v_sgst_amount numeric := 0;
    v_shop_cgst numeric;
    v_shop_sgst numeric;
    item jsonb;
    v_item_total numeric;
    v_stock_id uuid;
    v_rows_updated integer;
BEGIN
    -- Get Shop Tax Rates
    SELECT cgst_rate, sgst_rate INTO v_shop_cgst, v_shop_sgst FROM public.shops WHERE id = p_shop_id;

    -- Generate Invoice Number
    -- NOTE: Ideally use a sequence or dedicated function
    SELECT count(*)::text INTO v_invoice_number FROM public.invoices WHERE shop_id = p_shop_id; 
    v_invoice_number := 'INV-' || (v_invoice_number::int + 1);

    -- Insert Invoice Header
    INSERT INTO public.invoices (
        shop_id, invoice_number, customer_id, customer_snapshot, status, notes, 
        discount, loyalty_points_earned, loyalty_points_redeemed
    ) VALUES (
        p_shop_id, v_invoice_number, p_customer_id, p_customer_snapshot, p_status, p_notes, 
        p_discount, p_loyalty_points_earned, p_loyalty_points_redeemed
    ) RETURNING id INTO v_invoice_id;

    -- Process Items
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_stock_id := (item->>'stockId')::uuid;
        v_item_total := (item->>'total')::numeric;
        v_subtotal := v_subtotal + v_item_total;

        INSERT INTO public.invoice_items (
            invoice_id, stock_id, description, purity, gross_weight, net_weight, 
            rate, making, amount
        ) VALUES (
            v_invoice_id, v_stock_id, item->>'description', item->>'purity', 
            (item->>'grossWeight')::numeric, (item->>'netWeight')::numeric,
            (item->>'rate')::numeric, (item->>'making')::numeric, v_item_total
        );

        -- Update Inventory Status with OPTIMISTIC LOCKING
        IF v_stock_id IS NOT NULL THEN
            UPDATE public.inventory_items 
            SET status = 'SOLD', sold_invoice_id = v_invoice_id, sold_at = now()
            WHERE id = v_stock_id AND status = 'IN_STOCK'; -- Critical Check
            
            GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

            IF v_rows_updated = 0 THEN
                -- Rollback everything if item is not available
                RAISE EXCEPTION 'Item is no longer available (Stock ID: %)', v_stock_id;
            END IF;

            -- Create Audit Log Entry
            INSERT INTO public.inventory_status_history (
                item_id, old_status, new_status, reason, reference_id, reference_type
            ) VALUES (
                v_stock_id, 'IN_STOCK', 'SOLD', 'Sold via Invoice', v_invoice_id, 'INVOICE'
            );
        END IF;
    END LOOP;

    -- Calculate Tax & Totals
    -- Simple Tax Logic: Tax on Subtotal (Customize if tax inclusive/exclusive)
    v_cgst_amount := v_subtotal * (v_shop_cgst / 100.0);
    v_sgst_amount := v_subtotal * (v_shop_sgst / 100.0);
    v_grand_total := v_subtotal + v_cgst_amount + v_sgst_amount - p_discount;

    -- Update Invoice Header with Totals
    UPDATE public.invoices 
    SET subtotal = v_subtotal, 
        cgst_amount = v_cgst_amount, 
        sgst_amount = v_sgst_amount, 
        grand_total = v_grand_total
    WHERE id = v_invoice_id;
    
    -- Handle Loyalty Logic
    IF p_status = 'paid' AND p_customer_id IS NOT NULL THEN
        -- Earn Points
        IF p_loyalty_points_earned > 0 THEN
            UPDATE public.customers SET loyalty_points = loyalty_points + p_loyalty_points_earned 
            WHERE id = p_customer_id;
        END IF;
        -- Redeem Points
        IF p_loyalty_points_redeemed > 0 THEN
            UPDATE public.customers SET loyalty_points = loyalty_points - p_loyalty_points_redeemed 
            WHERE id = p_customer_id;
        END IF;
    END IF;

    RETURN jsonb_build_object('success', true, 'invoice_id', v_invoice_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
