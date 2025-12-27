-- Fix update_invoice_v2 RPC to use correct column names (amount vs total_amount)
CREATE OR REPLACE FUNCTION public.update_invoice_v2(
    p_invoice_id uuid,
    p_shop_id uuid,
    p_update_data jsonb,
    p_items jsonb
)
RETURNS jsonb AS $$
DECLARE
    v_subtotal numeric;
    v_cgst_amount numeric;
    v_sgst_amount numeric;
    v_grand_total numeric;
    item jsonb;
    v_stock_id uuid;
    v_item_total numeric;
    v_shop_cgst numeric;
    v_shop_sgst numeric;
    v_current_snapshot jsonb;
    v_discount numeric;
BEGIN
    -- 1. Update Invoice Header
    UPDATE public.invoices
    SET 
        invoice_date = COALESCE((p_update_data->>'invoice_date')::date, invoice_date),
        status = COALESCE(p_update_data->>'status', status),
        notes = COALESCE(p_update_data->>'notes', notes),
        discount = COALESCE((p_update_data->>'discount')::numeric, discount),
        customer_snapshot = COALESCE(p_update_data->'customer_snapshot', customer_snapshot)
    WHERE id = p_invoice_id AND shop_id = p_shop_id
    RETURNING discount, customer_snapshot INTO v_discount, v_current_snapshot;
    
    -- Get Shop Tax Rates
    SELECT cgst_rate, sgst_rate INTO v_shop_cgst, v_shop_sgst FROM public.shops WHERE id = p_shop_id;

    -- 2. Restore Inventory for OLD items (mark as IN_STOCK)
    -- Find items currently linked to this invoice
    UPDATE public.inventory_items
    SET status = 'IN_STOCK', sold_invoice_id = NULL, sold_at = NULL
    WHERE sold_invoice_id = p_invoice_id;

    -- 3. Delete OLD Invoice Items
    DELETE FROM public.invoice_items WHERE invoice_id = p_invoice_id;

    -- 4. Insert NEW Items
    v_subtotal := 0;
    
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_stock_id := (item->>'stockId')::uuid;
        -- MAP total -> amount correctly here
        v_item_total := (item->>'total')::numeric;
        v_subtotal := v_subtotal + v_item_total;

        INSERT INTO public.invoice_items (
            invoice_id, stock_id, description, purity, 
            gross_weight, net_weight, stone_weight, stone_amount,
            wastage_percent, rate, making, amount,
            metal_type, category, hsn_code
        ) VALUES (
            p_invoice_id, v_stock_id, item->>'description', item->>'purity',
            (item->>'grossWeight')::numeric, (item->>'netWeight')::numeric, 
            COALESCE((item->>'stoneWeight')::numeric, 0), COALESCE((item->>'stoneAmount')::numeric, 0),
            (item->>'wastage')::numeric, (item->>'rate')::numeric, (item->>'making')::numeric, v_item_total,
            item->>'metalType', item->>'category', item->>'hsnCode'
        );

        -- Update Inventory Status for NEW items
        IF v_stock_id IS NOT NULL THEN
            UPDATE public.inventory_items 
            SET status = 'SOLD', sold_invoice_id = p_invoice_id, sold_at = now()
            WHERE id = v_stock_id;
        END IF;
    END LOOP;

    -- 5. Recalculate Totals
    v_cgst_amount := v_subtotal * (v_shop_cgst / 100.0);
    v_sgst_amount := v_subtotal * (v_shop_sgst / 100.0);
    v_grand_total := v_subtotal + v_cgst_amount + v_sgst_amount - COALESCE((p_update_data->>'discount')::numeric, v_discount, 0);

    UPDATE public.invoices 
    SET subtotal = v_subtotal, 
        cgst_amount = v_cgst_amount, 
        sgst_amount = v_sgst_amount, 
        grand_total = v_grand_total
    WHERE id = p_invoice_id;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
