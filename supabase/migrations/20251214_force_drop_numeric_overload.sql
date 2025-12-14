-- Force drop the ambiguous numeric-overload of create_invoice_v2
-- Date: 2025-12-14

-- This will remove the version whose last two params are numeric,
-- keeping the integer-based version to avoid RPC ambiguity.

DROP FUNCTION IF EXISTS public.create_invoice_v2(
  uuid, uuid, jsonb, jsonb, numeric, text, text, numeric, numeric
);
