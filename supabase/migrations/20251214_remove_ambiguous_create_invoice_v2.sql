-- Migration: Remove ambiguous overloaded create_invoice_v2
-- Date: 2025-12-14

-- Drop the version that uses numeric for loyalty points to avoid overload ambiguity
-- Keep the integer version defined in 20251214_fix_create_invoice_v2.sql

DO $$
BEGIN
  -- Attempt to drop the overloaded function signature (numeric loyalty params)
  -- Signature: (uuid, uuid, jsonb, jsonb, numeric, text, text, numeric, numeric)
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'create_invoice_v2'
      AND pg_get_function_identity_arguments(p.oid) = 'uuid, uuid, jsonb, jsonb, numeric, text, text, numeric, numeric'
  ) THEN
    EXECUTE 'DROP FUNCTION public.create_invoice_v2(uuid, uuid, jsonb, jsonb, numeric, text, text, numeric, numeric)';
  END IF;
END
$$;