-- Migration: Fix create_invoice_v2 RPC to include missing item fields (stone_weight, etc.)

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
        
        INSERT INTO invoice_items (
            invoice_id, 
            description, 
            purity, 
            gross_weight, 
            net_weight, 
            rate, 
            making, 
            making_rate,
            stone_weight,
            stone_amount,
            wastage_percent,
            metal_type,
            hsn_code, 
            stock_id, 
            tag_id
        ) VALUES (
            v_invoice_id,
            v_item->>'description',
            v_item->>'purity',
            (v_item->>'grossWeight')::NUMERIC,
            (v_item->>'netWeight')::NUMERIC,
            (v_item->>'rate')::NUMERIC,
            (v_item->>'making')::NUMERIC,
            (v_item->>'makingRate')::NUMERIC,
            (v_item->>'stoneWeight')::NUMERIC,
            (v_item->>'stoneAmount')::NUMERIC,
            (v_item->>'wastagePercent')::NUMERIC,
            v_item->>'metalType',
            v_item->>'hsnCode',
            v_stock_id,
            v_item->>'tagId' -- Frontend must pass this!
        );
        -- Re-calculate line item amount (Logic: (NetWt * Rate) + Making)
        -- Note: Making in JSON is usually the TOTAL making amount calculated by frontend
        v_subtotal := v_subtotal + 
            ((v_item->>'netWeight')::NUMERIC * (v_item->>'rate')::NUMERIC) + 
            (v_item->>'making')::NUMERIC + 
            COALESCE((v_item->>'stoneAmount')::NUMERIC, 0);

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
        subtotal = v_subtotal + COALESCE(p_discount, 0), -- Reset to actual subtotal if we want consistent, but variable reuse here is tricky
        -- Actually v_subtotal was already deducted. Let's fix logic:
        -- v_subtotal (accumulated) is gross.
        -- We want stored subtotal to be gross? Or gross - discount? Usually Subtotal is Gross. Discount is separate.
        -- Database schema: subtotal, discount, grand_total.
        -- Let's recalculate cleanly:
        
        subtotal = (SELECT SUM(
            (net_weight * rate) + making + COALESCE(stone_amount, 0)
        ) FROM invoice_items WHERE invoice_id = v_invoice_id),
        
        cgst_amount = v_cgst_amount,
        sgst_amount = v_sgst_amount,
        grand_total = v_grand_total
    WHERE id = v_invoice_id;
    
    -- Recalculate grand total based on new subtotal query to be 100% sure? 
    -- For now trust flow but ensure subtotal column is Gross.
    -- The previous logic v_subtotal := v_subtotal - discount was doing (Gross - Discount) -> Tax Base.
    -- But 'subtotal' column typically stores Gross.
    -- Let's keep it consistent with previous logic for now, but ensure stoneAmount is included in totals.
    
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
