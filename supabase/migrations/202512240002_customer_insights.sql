-- Customer insights RPC to power dashboard trendline and insight cards
-- Date: 2025-12-24

DROP FUNCTION IF EXISTS public.get_customer_insights_json(jsonb);

CREATE OR REPLACE FUNCTION public.get_customer_insights_json(params jsonb)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  v_shop_id uuid := (params->>'p_shop_id')::uuid;
  v_days int := COALESCE((params->>'p_days')::int, 30);
  result jsonb;
BEGIN
  IF v_shop_id IS NULL THEN
    RETURN jsonb_build_object(
      'customer_count', 0,
      'new_customer_count', 0,
      'returning_customer_count', 0,
      'customer_sparkline', json_build_array(),
      'top_customer_by_spend', NULL
    );
  END IF;

  WITH 
  -- Series for sparkline days
  series AS (
    SELECT generate_series::date AS day
    FROM generate_series(
      (date_trunc('day', now())::date - (v_days - 1)),
      date_trunc('day', now())::date,
      interval '1 day'
    )
  ),
  -- Daily active customers (distinct with invoices)
  daily AS (
    SELECT date_trunc('day', i.created_at)::date AS day,
           COUNT(DISTINCT i.customer_id) AS active_customers
    FROM public.invoices i
    WHERE i.shop_id = v_shop_id
      AND i.customer_id IS NOT NULL
      AND i.created_at >= (now() - (v_days || ' days')::interval)
    GROUP BY 1
  ),
  active_sparkline AS (
    SELECT json_agg(COALESCE(d.active_customers, 0) ORDER BY s.day) AS arr
    FROM series s
    LEFT JOIN daily d ON d.day = s.day
  ),
  -- First invoice per customer
  first_invoice AS (
    SELECT customer_id, MIN(created_at) AS first_at
    FROM public.invoices
    WHERE shop_id = v_shop_id
      AND customer_id IS NOT NULL
    GROUP BY customer_id
  ),
  recent_customers AS (
    SELECT DISTINCT i.customer_id
    FROM public.invoices i
    WHERE i.shop_id = v_shop_id
      AND i.customer_id IS NOT NULL
      AND i.created_at >= (now() - (v_days || ' days')::interval)
  ),
  counts AS (
    SELECT
      (SELECT COUNT(*) FROM public.customers c WHERE c.shop_id = v_shop_id) AS customer_count,
      (SELECT COUNT(*) FROM recent_customers r JOIN first_invoice f ON f.customer_id = r.customer_id WHERE f.first_at < (now() - (v_days || ' days')::interval)) AS returning_customer_count,
      (SELECT COUNT(*) FROM recent_customers r JOIN first_invoice f ON f.customer_id = r.customer_id WHERE f.first_at >= (now() - (v_days || ' days')::interval)) AS new_customer_count
  ),
  top_customer AS (
    SELECT c.id, c.name, SUM(i.grand_total)::numeric AS total_spent, COUNT(*) AS invoice_count
    FROM public.invoices i
    JOIN public.customers c ON c.id = i.customer_id
    WHERE i.shop_id = v_shop_id AND i.customer_id IS NOT NULL
    GROUP BY c.id, c.name
    ORDER BY total_spent DESC NULLS LAST
    LIMIT 1
  )
  SELECT jsonb_build_object(
    'customer_count', counts.customer_count,
    'new_customer_count', counts.new_customer_count,
    'returning_customer_count', counts.returning_customer_count,
    'customer_sparkline', (SELECT arr FROM active_sparkline),
    'top_customer_by_spend', (
      SELECT CASE WHEN EXISTS (SELECT 1 FROM top_customer)
                  THEN to_jsonb(top_customer.*)
                  ELSE NULL END
    )
  )
  INTO result
  FROM counts;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_customer_insights_json(jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.get_customer_insights_json(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_insights_json(jsonb) TO service_role;

SELECT pg_notify('pgrst', 'reload schema');