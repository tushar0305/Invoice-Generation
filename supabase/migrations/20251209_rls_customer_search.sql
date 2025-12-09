-- Add RLS policies for customer search (apply this after 20251209_fts_customers.sql)
-- This ensures proper access control for the search_customers RPC function

-- Ensure customers table has RLS enabled
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;

-- Allow users to search customers only in their authorized shops
-- Uses user_shop_roles table to verify user has access to the shop

-- Policy for selecting customers via search (drop first for idempotency)
DROP POLICY IF EXISTS "Users can search their shop customers" ON public.customers;
CREATE POLICY "Users can search their shop customers"
ON public.customers FOR SELECT
USING (
  shop_id IN (
    SELECT shop_id 
    FROM public.user_shop_roles 
    WHERE user_id = auth.uid() 
      AND is_active = true
  )
);

-- Grant execute permission on search functions to authenticated users
GRANT EXECUTE ON FUNCTION public.search_customers(uuid, text, int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_customers_count(uuid, text) TO authenticated;

-- Revoke from public (if you want to restrict to authenticated users only)
REVOKE EXECUTE ON FUNCTION public.search_customers(uuid, text, int, int) FROM anon;
REVOKE EXECUTE ON FUNCTION public.search_customers_count(uuid, text) FROM anon;
