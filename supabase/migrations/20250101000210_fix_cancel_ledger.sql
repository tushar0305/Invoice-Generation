-- Migration: Fix cancel_invoice to revert Ledger
-- Description: When an invoice is cancelled, we must credit the user's account to negate the original debit.

CREATE OR REPLACE FUNCTION cancel_invoice(
    p_invoice_id UUID,
    p_shop_id UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_invoice RECORD;
    v_grand_total NUMERIC;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();

    SELECT * INTO v_invoice FROM invoices 
    WHERE id = p_invoice_id AND shop_id = p_shop_id 
    FOR UPDATE;

    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Invoice not found'); END IF;
    IF v_invoice.status = 'cancelled' THEN RETURN jsonb_build_object('success', false, 'error', 'Already cancelled'); END IF;

    -- 1. Revert Inventory
    UPDATE inventory_items
    SET status = 'IN_STOCK', sold_invoice_id = NULL, sold_at = NULL
    WHERE sold_invoice_id = p_invoice_id;

    -- 2. Revert Loyalty
    IF v_invoice.loyalty_points_earned > 0 AND v_invoice.customer_id IS NOT NULL THEN
        PERFORM decrement_loyalty_points(v_invoice.customer_id, v_invoice.loyalty_points_earned);
        -- Log the reversion
        INSERT INTO customer_loyalty_logs (customer_id, shop_id, invoice_id, points_change, reason)
        VALUES (v_invoice.customer_id, p_shop_id, p_invoice_id, -v_invoice.loyalty_points_earned, 'Invoice Cancelled - Revert Earned');
    END IF;

    IF v_invoice.loyalty_points_redeemed > 0 AND v_invoice.customer_id IS NOT NULL THEN
        PERFORM increment_loyalty_points(v_invoice.customer_id, v_invoice.loyalty_points_redeemed);
         -- Log the restoration
        INSERT INTO customer_loyalty_logs (customer_id, shop_id, invoice_id, points_change, reason)
        VALUES (v_invoice.customer_id, p_shop_id, p_invoice_id, v_invoice.loyalty_points_redeemed, 'Invoice Cancelled - Refund Redeemed');
    END IF;

    -- 3. Revert Ledger (Khata)
    -- Only if it wasn't already a paid invoice that was fully settled? 
    -- Actually, even if 'due', we debited them. If 'cancelled', we must credit them back.
    -- If 'paid', we likely debited AND credited (or just didn't debit? check create_invoice logic).
    -- create_invoice_v2 only adds to ledger if status='due'.
    -- Logic: "IF p_status = 'due' ... INSERT INTO ledger ... DEBIT"
    
    -- So if status was 'due' (or part paid), we need to reverse the DEBIT.
    -- If status was 'paid', create_invoice_v2 did NOT add a DEBIT ledger entry (it assumes cash & carry).
    -- WAIT! Let's re-verify create_invoice_v2 logic from migration 20250101000100.
    
    -- create_invoice_v2: 
    -- "IF p_status = 'due' ... INSERT ledger (DEBIT)"
    -- "ELSIF p_status = 'paid' ... UPDATE customers total_spent" (NO LEDGER ENTRY)
    
    -- So, we only need to reverse ledger if the invoice status was 'due' (or basically not 'paid').
    -- However, an invoice might be 'partially paid' later? The schema only has 'due', 'paid', 'cancelled'.
    -- If it was 'due', there is a DEBIT entry. We should add a CREDIT entry to zero it out.
    
    IF v_invoice.status = 'due' AND v_invoice.customer_id IS NOT NULL THEN
         INSERT INTO ledger_transactions (
            shop_id, customer_id, invoice_id, transaction_type, amount, entry_type, description, created_by
        ) VALUES (
            p_shop_id, v_invoice.customer_id, p_invoice_id, 'ADJUSTMENT', v_invoice.grand_total, 'CREDIT', 
            'Invoice #' || v_invoice.invoice_number || ' Cancelled', v_user_id
        );
        -- Also reduce the total_spent (since they didn't actually spend it)
        -- Wait, total_spent tracks "Sales volume". If cancelled, it's not a sale.
        -- But ledger logic updates total_spent on DEBIT. So we must reverse it.
        UPDATE customers SET total_spent = GREATEST(0, total_spent - v_invoice.grand_total) WHERE id = v_invoice.customer_id;
    ELSIF v_invoice.status = 'paid' AND v_invoice.customer_id IS NOT NULL THEN
        -- It was cash & carry. Just reduce total_spent. No ledger entry to reverse because none was made.
        UPDATE customers SET total_spent = GREATEST(0, total_spent - v_invoice.grand_total) WHERE id = v_invoice.customer_id;
    END IF;

    -- 4. Update Invoice Status
    UPDATE invoices SET status = 'cancelled', updated_at = NOW() WHERE id = p_invoice_id;
    
    RETURN jsonb_build_object('success', true);
END;
$$;
