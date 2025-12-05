-- Function: get_sales_insights
-- Description: Aggregates sales data on the server side to avoid fetching all invoices to the client.
-- Returns: JSON object with metrics, chart data, and top products.

CREATE OR REPLACE FUNCTION public.get_sales_insights(
    p_shop_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_today_start TIMESTAMPTZ := date_trunc('day', now());
    v_week_start TIMESTAMPTZ := date_trunc('week', now());
    v_month_start TIMESTAMPTZ := date_trunc('month', now());
    v_year_start TIMESTAMPTZ := date_trunc('year', now());
    
    v_total_revenue NUMERIC;
    v_total_orders INTEGER;
    v_avg_order_value NUMERIC;
    
    v_chart_data JSONB;
    v_top_products JSONB;
BEGIN
    -- 1. Calculate Overall Metrics (All Time? Or relevant period? Usually insights defaults to "Week" or "Month" view, 
    -- but let's return totals for the current view or just general stats. 
    -- The UI shows "Total Revenue" (implied all time or filtered). 
    -- Let's calculate for "This Month" as a default baseline for the "Key Metrics" cards if they are static,
    -- OR we can return just the raw aggregates allowed for the UI to toggle.
    -- Actually, the UI toggles between Today/Week/Month/Year. 
    -- For maximum performance, we should pre-calculate ALL these buckets in one go.
    
    -- Let's stick to the structure the UI expects:
    -- Revenue, Orders, Avg Value (Filtered by selected range).
    -- Since the UI toggle is client-side, we should send back the data for ALL ranges 
    -- so the client can switch instantly without refetching, 
    -- BUT purely aggregated, not raw rows.
    
    RETURN jsonb_build_object(
        'ranges', jsonb_build_object(
            'today', (SELECT jsonb_build_object('revenue', COALESCE(SUM(grand_total), 0), 'orders', COUNT(*)) FROM invoices WHERE shop_id = p_shop_id AND invoice_date >= v_today_start),
            'week', (SELECT jsonb_build_object('revenue', COALESCE(SUM(grand_total), 0), 'orders', COUNT(*)) FROM invoices WHERE shop_id = p_shop_id AND invoice_date >= v_week_start),
            'month', (SELECT jsonb_build_object('revenue', COALESCE(SUM(grand_total), 0), 'orders', COUNT(*)) FROM invoices WHERE shop_id = p_shop_id AND invoice_date >= v_month_start),
            'year', (SELECT jsonb_build_object('revenue', COALESCE(SUM(grand_total), 0), 'orders', COUNT(*)) FROM invoices WHERE shop_id = p_shop_id AND invoice_date >= v_year_start)
        ),
        'chart_data', (
            -- Last 30 Days Daily Revenue
            SELECT jsonb_agg(daily)
            FROM (
                SELECT 
                    to_char(invoice_date, 'YYYY-MM-DD') as date,
                    SUM(grand_total) as value
                FROM invoices 
                WHERE shop_id = p_shop_id 
                AND invoice_date >= (now() - interval '30 days')
                GROUP BY 1
                ORDER BY 1 ASC
            ) daily
        ),
        'top_products', (
            -- Top 5 Products (All Time? Or Last 30 Days? Let's do Last 30 Days for relevance)
            SELECT jsonb_agg(products)
            FROM (
                SELECT 
                    ii.description as name, 
                    SUM(ii.net_weight * ii.rate + ii.net_weight * ii.making) as revenue,
                    COUNT(*) as quantity
                FROM invoice_items ii
                JOIN invoices i ON i.id = ii.invoice_id
                WHERE i.shop_id = p_shop_id
                AND i.invoice_date >= (now() - interval '30 days')
                GROUP BY 1
                ORDER BY 2 DESC
                LIMIT 5
            ) products
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
