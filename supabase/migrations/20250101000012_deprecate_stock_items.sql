-- ==========================================
-- Migration: Deprecate stock_items table (DEBT-001)
-- Description: Renaming stock_items to stock_items_deprecated to prevent usage.
--              All logic should now use inventory_items.
-- Date: 2025-12-15
-- ==========================================

-- 1. Rename the table
ALTER TABLE IF EXISTS public.stock_items RENAME TO stock_items_deprecated;

-- 2. Drop policies if they exist (they will be renamed with table, but good to be clean)
-- Note: Policies are attached to the table, so they move with it.

-- 3. Create a view for backward compatibility (optional, but safer for raw SQL queries)
-- We map inventory_items to look somewhat like stock_items if needed, 
-- but since the schema is different (SKU vs Serialized), a direct view is hard.
-- Instead, we'll just leave it renamed so any usage fails loudly during dev.

-- 4. Add comment
COMMENT ON TABLE public.stock_items_deprecated IS 'DEPRECATED: Do not use. Use inventory_items instead.';
