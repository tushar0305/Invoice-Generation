-- ==========================================
-- Migration: Add get_dashboard_stats RPC (PERF-001)
-- Description: Consolidates multiple dashboard queries into a single RPC for performance.
-- Date: 2025-12-15
-- ==========================================

CREATE OR REPLACE FUNCTION get_dashboard_stats(p_shop_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
    v_today TIMESTAMPTZ := date_trunc('day', now());
    v_week TIMESTAMPTZ := date_trunc('week', now());
    v_month TIMESTAMPTZ := date_trunc('month', now());
    v_last_month TIMESTAMPTZ := date_trunc('month', now() - interval '1 month');
BEGIN
    SELECT jsonb_build_object(
        -- Counts
        'customer_count', (SELECT count(*) FROM customers WHERE shop_id = p_shop_id),
        'product_count', (SELECT count(*) FROM inventory_items WHERE shop_id = p_shop_id AND status = 'IN_STOCK'),
        'invoice_count', (SELECT count(*) FROM invoices WHERE shop_id = p_shop_id),
        'active_loans_count', (SELECT count(*) FROM loans WHERE shop_id = p_shop_id AND status = 'active'),
        'scheme_count', (SELECT count(*) FROM schemes WHERE shop_id = p_shop_id AND is_active = true),
        'active_enrollments_count', (SELECT count(*) FROM customer_schemes WHERE shop_id = p_shop_id AND status = 'ACTIVE'),
        
        -- Financials
        'total_scheme_collected', (SELECT COALESCE(SUM(total_amount_collected), 0) FROM customer_schemes WHERE shop_id = p_shop_id AND status = 'ACTIVE'),
        'khata_balance', (SELECT COALESCE(SUM(grand_total), 0) FROM invoices WHERE shop_id = p_shop_id AND status NOT IN ('paid', 'cancelled')),
        
        -- Loyalty
        'total_loyalty_points', (SELECT COALESCE(SUM(loyalty_points), 0) FROM customers WHERE shop_id = p_shop_id),
        'loyalty_members_count', (SELECT count(*) FROM customers WHERE shop_id = p_shop_id AND loyalty_points > 0),
        'top_customer_by_spend', (SELECT jsonb_build_object('name', name, 'total_spent', total_spent, 'phone', phone) FROM customers WHERE shop_id = p_shop_id ORDER BY total_spent DESC LIMIT 1),
        'top_loyalty_customer', (SELECT jsonb_build_object('name', name, 'points', loyalty_points) FROM customers WHERE shop_id = p_shop_id AND loyalty_points > 0 ORDER BY loyalty_points DESC LIMIT 1),
        
        -- Inventory
        'low_stock_items', (
            SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) 
            FROM (
                SELECT id, name, gross_weight, metal_type 
                FROM inventory_items 
                WHERE shop_id = p_shop_id AND status = 'IN_STOCK' 
                ORDER BY created_at DESC LIMIT 5
            ) t
        ),
        
        -- Revenue Stats
        'revenue_stats', (
            SELECT jsonb_build_object(
                'today', (SELECT COALESCE(SUM(grand_total), 0) FROM invoices WHERE shop_id = p_shop_id AND status = 'paid' AND created_at >= v_today),
                'week', (SELECT COALESCE(SUM(grand_total), 0) FROM invoices WHERE shop_id = p_shop_id AND status = 'paid' AND created_at >= v_week),
                'month', (SELECT COALESCE(SUM(grand_total), 0) FROM invoices WHERE shop_id = p_shop_id AND status = 'paid' AND created_at >= v_month),
                'last_month', (SELECT COALESCE(SUM(grand_total), 0) FROM invoices WHERE shop_id = p_shop_id AND status = 'paid' AND created_at >= v_last_month AND created_at < v_month),
                'orders_this_month', (SELECT count(*) FROM invoices WHERE shop_id = p_shop_id AND status = 'paid' AND created_at >= v_month)
            )
        ),

        -- Customer Sparkline (Last 7 days cumulative count)
        'customer_sparkline', (
            SELECT jsonb_agg(cnt)
            FROM (
                SELECT (
                    SELECT count(*) 
                    FROM customers c 
                    WHERE c.shop_id = p_shop_id AND c.created_at <= d.day + interval '1 day' - interval '1 millisecond'
                ) as cnt
                FROM generate_series(v_today - interval '6 days', v_today, '1 day') as d(day)
            ) s
        )
    ) INTO result;

    RETURN result;
END;
$$;
