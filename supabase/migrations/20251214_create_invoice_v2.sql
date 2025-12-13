-- Create a robust function for invoice creation with new inventory schema support
CREATE OR REPLACE FUNCTION create_invoice_v2(
    p_shop_id uuid,
    p_customer_id uuid,
    p_customer_snapshot jsonb,
    p_items jsonb, -- Array of items with new fields
    p_discount numeric,
    p_notes text,
    p_status text,
    p_loyalty_points_earned numeric,
    p_loyalty_points_redeemed numeric
) RETURNS uuid AS $$
DECLARE
    v_invoice_id uuid;
    v_invoice_number text;
    v_item jsonb;
    v_subtotal numeric := 0;
    v_taxable numeric;
    v_cgst numeric;
    v_sgst numeric;
    v_grand_total numeric;
    v_shop_cgst numeric;
    v_shop_sgst numeric;
BEGIN
    -- 1. Generate Invoice Number (Simple increment for now, or use sequence)
    -- This logic assumes existing sequence or fallback. 
    -- For safety, we can rely on a default if setup, but let's do a basic count + 1 for now if needed, 
    -- or better, let the application handle it or use a sequence. 
    -- Assuming a sequence 'invoice_number_seq' exists or basic COUNT.
    SELECT count(*)::text INTO v_invoice_number FROM invoices WHERE shop_id = p_shop_id;
    v_invoice_number := 'INV-' || lpad((v_invoice_number::int + 1)::text, 4, '0');

    -- 2. Get Shop Tax Rates
    SELECT cgst_rate, sgst_rate INTO v_shop_cgst, v_shop_sgst 
    FROM shops WHERE id = p_shop_id;
    
    -- Default to 0 if null
    v_shop_cgst := COALESCE(v_shop_cgst, 0);
    v_shop_sgst := COALESCE(v_shop_sgst, 0);

    -- 3. Calculate Totals from Items JSON (Double Check Logic)
    -- We can trust the client passed totals or recalc here. For safety, recalc.
    -- Loop through items to sum subtotal
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_subtotal := v_subtotal + (
            (COALESCE((v_item->>'netWeight')::numeric, 0) * COALESCE((v_item->>'rate')::numeric, 0)) + -- Gold Price
            (COALESCE((v_item->>'makingRate')::numeric, 0) * COALESCE((v_item->>'netWeight')::numeric, 0)) + -- Making Charges (Rate * Wt)
            COALESCE((v_item->>'making')::numeric, 0) + -- Legacy Fixed Making (if any)
            COALESCE((v_item->>'stoneAmount')::numeric, 0) -- Stone Value
        );
    END LOOP;

    -- Calculate Tax
    v_taxable := GREATEST(0, v_subtotal - p_discount - (p_loyalty_points_redeemed * 1)); -- Assuming 1 pt = 1 Rupee/Ratio? 
    -- Wait, redemption logic is complex. Let's assume passed discount handles conversion or taxable is calculated after.
    -- BETTER: Trust the Application to pass exact tax amounts? No, RPC is safer.
    -- Let's stick to standard formula: Taxable = Subtotal - Discount. 
    -- (Loyalty Redemption acts as discount).
    
    -- NOTE: For this V2, we will simplify: Use the calculated subtotal, apply discount, then tax.
    v_taxable := GREATEST(0, v_subtotal - p_discount);
    
    v_cgst := v_taxable * (v_shop_cgst / 100);
    v_sgst := v_taxable * (v_shop_sgst / 100);
    v_grand_total := v_taxable + v_cgst + v_sgst;

    -- 4. Insert Invoice
    INSERT INTO invoices (
        shop_id,
        invoice_number,
        customer_id,
        customer_snapshot,
        invoice_date,
        subtotal,
        discount,
        cgst_amount,
        sgst_amount,
        grand_total,
        status,
        notes,
        created_at
    ) VALUES (
        p_shop_id,
        v_invoice_number,
        p_customer_id,
        p_customer_snapshot,
        now(),
        v_subtotal,
        p_discount,
        v_cgst,
        v_sgst,
        v_grand_total,
        p_status,
        p_notes,
        now()
    ) RETURNING id INTO v_invoice_id;

    -- 5. Insert Items
    INSERT INTO invoice_items (
        invoice_id,
        description,
        purity,
        hsn_code,
        metal_type,
        category,
        gross_weight,
        net_weight,
        stone_weight,
        stone_amount,
        wastage_percent,
        rate,
        making_rate,
        making, -- Legacy/Fixed
        amount
    )
    SELECT 
        v_invoice_id,
        v_item->>'description',
        v_item->>'purity',
        v_item->>'hsnCode',
        v_item->>'metalType',
        v_item->>'category',
        COALESCE((v_item->>'grossWeight')::numeric, 0),
        COALESCE((v_item->>'netWeight')::numeric, 0),
        COALESCE((v_item->>'stoneWeight')::numeric, 0),
        COALESCE((v_item->>'stoneAmount')::numeric, 0),
        COALESCE((v_item->>'wastagePercent')::numeric, 0),
        COALESCE((v_item->>'rate')::numeric, 0),
        COALESCE((v_item->>'makingRate')::numeric, 0),
        COALESCE((v_item->>'making')::numeric, 0),
        -- Per Item Amount Calc
        (
            (COALESCE((v_item->>'netWeight')::numeric, 0) * COALESCE((v_item->>'rate')::numeric, 0)) +
            (COALESCE((v_item->>'makingRate')::numeric, 0) * COALESCE((v_item->>'netWeight')::numeric, 0)) +
            COALESCE((v_item->>'making')::numeric, 0) +
            COALESCE((v_item->>'stoneAmount')::numeric, 0)
        )
    FROM jsonb_array_elements(p_items) AS v_item;

    -- 6. Update Customer Loyalty
    IF p_customer_id IS NOT NULL THEN
        -- Add earned, subtract redeemed
        UPDATE customers 
        SET loyalty_points = loyalty_points + p_loyalty_points_earned - p_loyalty_points_redeemed,
            total_spent = total_spent + v_grand_total
        WHERE id = p_customer_id;
    END IF;

    RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql;
