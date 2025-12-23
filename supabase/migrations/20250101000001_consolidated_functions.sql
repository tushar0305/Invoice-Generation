-- FUNCTIONS & RPCs
-- 1. UTILITY FUNCTIONS
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_customers_search_vector()
RETURNS trigger AS $$
BEGIN
    NEW.search_vector = to_tsvector('english', 
        coalesce(NEW.name, '') || ' ' || 
        coalesce(NEW.phone, '') || ' ' || 
        coalesce(NEW.email, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. DASHBOARD & STATS
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_shop_id uuid)
RETURNS jsonb AS $$
DECLARE
    v_customer_count integer;
    v_product_count integer;
    v_invoice_count integer;
    v_returning_customer_count integer;
    v_new_customer_count integer;
    v_active_loans_count integer;
    v_khata_balance numeric;
    v_total_loyalty_points integer;
    v_low_stock_items jsonb;
    v_loyalty_members_count integer;
    v_start_date timestamp;
    v_end_date timestamp;
    v_customer_sparkline jsonb;
    v_scheme_count integer;
    v_active_enrollments_count integer;
    v_total_scheme_collected numeric;
    v_total_gold_accumulated numeric;
    v_top_customer_by_spend jsonb;
    v_top_loyalty_customer jsonb;
BEGIN
    -- Set Time Window (Last 30 Days)
    v_end_date := now();
    v_start_date := v_end_date - interval '30 days';

    -- Count Customers
    SELECT count(*) INTO v_customer_count FROM public.customers WHERE shop_id = p_shop_id AND deleted_at IS NULL;
    
    -- Count Products
    SELECT count(*) INTO v_product_count FROM public.inventory_items WHERE shop_id = p_shop_id;
    
    -- Count Invoices (Total)
    SELECT count(*) INTO v_invoice_count FROM public.invoices WHERE shop_id = p_shop_id AND deleted_at IS NULL;

    -- Count Returning Customers (More than 1 invoice)
    SELECT count(*) INTO v_returning_customer_count 
    FROM (
        SELECT customer_id FROM public.invoices 
        WHERE shop_id = p_shop_id AND customer_id IS NOT NULL AND status='paid' 
        GROUP BY customer_id HAVING count(*) > 1
    ) sub;

    -- New Customers (Created in last 30 days)
    SELECT count(*) INTO v_new_customer_count 
    FROM public.customers 
    WHERE shop_id = p_shop_id AND created_at >= v_start_date;

    -- Active Loans
    SELECT count(*) INTO v_active_loans_count FROM public.loans WHERE shop_id = p_shop_id AND status = 'active';

    -- Khata Balance (Total Receivables from Ledger)
    SELECT coalesce(sum(amount), 0) INTO v_khata_balance 
    FROM public.ledger_transactions 
    WHERE shop_id = p_shop_id AND entry_type = 'DEBIT'; -- Simplified; real ledger is Debit - Credit

    -- Total Loyalty Points (Outstanding)
    SELECT coalesce(sum(loyalty_points), 0) INTO v_total_loyalty_points 
    FROM public.customers 
    WHERE shop_id = p_shop_id;

    -- Loyalty Members
    SELECT count(*) INTO v_loyalty_members_count 
    FROM public.customers 
    WHERE shop_id = p_shop_id AND loyalty_points > 0;

    -- Low Stock Items (Top 5 by weight or explicit status)
    SELECT jsonb_agg(sub) INTO v_low_stock_items
    FROM (
        SELECT id, name, gross_weight, metal_type 
        FROM public.inventory_items 
        WHERE shop_id = p_shop_id AND status = 'IN_STOCK' AND gross_weight < 50 
        LIMIT 5
    ) sub;

    -- Customer Sparkline (Last 30 days daily count)
    SELECT jsonb_agg(coalesce(daily_counts.cnt, 0) ORDER BY days.day) INTO v_customer_sparkline
    FROM generate_series(v_start_date::date, v_end_date::date, '1 day'::interval) as days(day)
    LEFT JOIN (
        SELECT date_trunc('day', created_at)::date as day, count(*) as cnt 
        FROM public.customers 
        WHERE shop_id = p_shop_id AND created_at >= v_start_date
        GROUP BY 1
    ) daily_counts ON days.day = daily_counts.day;

    -- Top Customer by Spend
    SELECT jsonb_build_object('name', c.name, 'totalSpent', sum(i.grand_total), 'orders', count(i.id))
    INTO v_top_customer_by_spend
    FROM public.invoices i
    JOIN public.customers c ON i.customer_id = c.id
    WHERE i.shop_id = p_shop_id AND i.status = 'paid'
    GROUP BY c.id, c.name
    ORDER BY sum(i.grand_total) DESC
    LIMIT 1;

    -- Top Loyalty Customer
    SELECT jsonb_build_object('name', name, 'points', loyalty_points, 'phone', phone)
    INTO v_top_loyalty_customer
    FROM public.customers
    WHERE shop_id = p_shop_id AND loyalty_points > 0
    ORDER BY loyalty_points DESC
    LIMIT 1;

    -- Scheme Stats
    SELECT count(*) INTO v_scheme_count FROM public.schemes WHERE shop_id = p_shop_id;
    
    SELECT count(*), coalesce(sum(total_paid), 0), coalesce(sum(total_gold_weight_accumulated), 0)
    INTO v_active_enrollments_count, v_total_scheme_collected, v_total_gold_accumulated
    FROM public.scheme_enrollments 
    WHERE shop_id = p_shop_id AND status = 'ACTIVE';

    RETURN jsonb_build_object(
        'customer_count', v_customer_count,
        'product_count', v_product_count,
        'invoice_count', v_invoice_count,
        'returning_customer_count', v_returning_customer_count,
        'new_customer_count', v_new_customer_count,
        'active_loans_count', v_active_loans_count,
        'khata_balance', v_khata_balance,
        'total_loyalty_points', v_total_loyalty_points,
        'loyalty_members_count', v_loyalty_members_count,
        'low_stock_items', coalesce(v_low_stock_items, '[]'::jsonb),
        'customer_sparkline', coalesce(v_customer_sparkline, '[]'::jsonb),
        'scheme_count', v_scheme_count,
        'active_enrollments_count', v_active_enrollments_count,
        'total_scheme_collected', v_total_scheme_collected,
        'total_gold_accumulated', v_total_gold_accumulated,
        'top_customer_by_spend', v_top_customer_by_spend,
        'top_loyalty_customer', v_top_loyalty_customer
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. INVOICING & INVENTORY LOGIC
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

        -- Update Inventory Status
        IF v_stock_id IS NOT NULL THEN
            UPDATE public.inventory_items 
            SET status = 'SOLD', sold_invoice_id = v_invoice_id, sold_at = now()
            WHERE id = v_stock_id;
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

-- 4. KHATA / LEDGER LOGIC
CREATE OR REPLACE FUNCTION public.add_ledger_entry_v2(
    p_shop_id uuid,
    p_khatabook_contact_id uuid,
    p_amount numeric,
    p_transaction_type text,
    p_entry_type text,
    p_description text DEFAULT NULL,
    p_transaction_date timestamp with time zone DEFAULT now()
)
RETURNS jsonb AS $$
DECLARE
    v_id uuid;
BEGIN
    INSERT INTO public.ledger_transactions (
        shop_id, khatabook_contact_id, amount, transaction_type, entry_type, description, transaction_date
    ) VALUES (
        p_shop_id, p_khatabook_contact_id, p_amount, p_transaction_type, p_entry_type, p_description, p_transaction_date
    ) RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- TRIGGERS
CREATE TRIGGER set_updated_at_shops BEFORE UPDATE ON public.shops FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_customers BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER update_customer_search_vector BEFORE INSERT OR UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_customers_search_vector();
