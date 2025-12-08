-- Dashboard Statistics RPC
-- Optimizes dashboard loading by aggregating data on the server side

CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_shop_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_of_month TIMESTAMPTZ := date_trunc('month', now());
    v_start_of_last_month TIMESTAMPTZ := date_trunc('month', now() - interval '1 month');
    v_end_of_last_month TIMESTAMPTZ := date_trunc('month', now());
    v_start_of_today TIMESTAMPTZ := date_trunc('day', now());
    v_start_of_week TIMESTAMPTZ := date_trunc('week', now());
    
    v_recent_invoices JSONB;
    v_current_month_invoices JSONB;
    v_last_month_revenue NUMERIC;
    v_due_invoices JSONB;
    v_today_revenue NUMERIC;
    v_week_revenue NUMERIC;
    v_catalogue_views INTEGER;
    v_catalogue_products INTEGER;
BEGIN
    -- 1. Recent Invoices (Limit 30)
    SELECT jsonb_agg(t) INTO v_recent_invoices
    FROM (
        SELECT 
            i.*,
            jsonb_build_object('name', c.name, 'phone', c.phone) as customer
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        WHERE i.shop_id = p_shop_id
        ORDER BY i.created_at DESC
        LIMIT 30
    ) t;

    -- 2. Current Month Invoices (for revenue and sparkline)
    SELECT jsonb_agg(t) INTO v_current_month_invoices
    FROM (
        SELECT grand_total, created_at
        FROM invoices
        WHERE shop_id = p_shop_id
        AND status = 'paid'
        AND created_at >= v_start_of_month
    ) t;

    -- 3. Last Month Revenue
    SELECT COALESCE(SUM(grand_total), 0) INTO v_last_month_revenue
    FROM invoices
    WHERE shop_id = p_shop_id
    AND status = 'paid'
    AND created_at >= v_start_of_last_month
    AND created_at < v_end_of_last_month;

    -- 4. Due Invoices
    SELECT jsonb_agg(t) INTO v_due_invoices
    FROM (
        SELECT 
            i.id, i.invoice_number, i.grand_total, i.due_date, i.created_at,
            jsonb_build_object('name', c.name, 'phone', c.phone) as customer
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        WHERE i.shop_id = p_shop_id
        AND i.status = 'due'
    ) t;

    -- 5. Today Revenue
    SELECT COALESCE(SUM(grand_total), 0) INTO v_today_revenue
    FROM invoices
    WHERE shop_id = p_shop_id
    AND status = 'paid'
    AND created_at >= v_start_of_today;

    -- 6. Week Revenue
    SELECT COALESCE(SUM(grand_total), 0) INTO v_week_revenue
    FROM invoices
    WHERE shop_id = p_shop_id
    AND status = 'paid'
    AND created_at >= v_start_of_week;

    -- 7. Catalogue Stats
    SELECT COUNT(*) INTO v_catalogue_views
    FROM catalogue_analytics
    WHERE shop_id = p_shop_id
    AND view_type = 'page_view'
    AND created_at >= v_start_of_month;

    SELECT COUNT(*) INTO v_catalogue_products
    FROM stock_items
    WHERE shop_id = p_shop_id
    AND is_active = true;

    -- Return aggregated JSON
    RETURN jsonb_build_object(
        'recentInvoices', COALESCE(v_recent_invoices, '[]'::jsonb),
        'currentMonthInvoices', COALESCE(v_current_month_invoices, '[]'::jsonb),
        'lastMonthRevenue', v_last_month_revenue,
        'dueInvoices', COALESCE(v_due_invoices, '[]'::jsonb),
        'todayRevenue', v_today_revenue,
        'weekRevenue', v_week_revenue,
        'catalogueStats', jsonb_build_object(
            'views', v_catalogue_views,
            'products', v_catalogue_products
        )
    );
END;
$$;
