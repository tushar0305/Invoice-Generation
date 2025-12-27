-- Migration: audit_reporting_rpc
-- Description: Adds RPC to fetch missing items for a specific audit session.

CREATE OR REPLACE FUNCTION public.get_audit_missing_items(p_audit_id UUID)
RETURNS SETOF public.inventory_items
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_audit_shop_id UUID;
BEGIN
    SELECT shop_id INTO v_audit_shop_id FROM public.inventory_audits WHERE id = p_audit_id;

    RETURN QUERY
    SELECT i.*
    FROM public.inventory_items i
    WHERE i.shop_id = v_audit_shop_id
      AND i.status = 'IN_STOCK'
      AND i.deleted_at IS NULL
      AND NOT EXISTS (
          SELECT 1 FROM public.inventory_audit_items ai 
          WHERE ai.audit_id = p_audit_id AND ai.inventory_item_id = i.id
      );
END;
$$;
