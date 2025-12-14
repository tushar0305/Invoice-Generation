-- Hotfix: Ensure inventory_items has a non-null name column
-- Reason: API inserts into inventory_items.name; some envs missing column

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'name'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN name TEXT;
    -- Backfill safe default to satisfy NOT NULL constraint
    UPDATE inventory_items SET name = COALESCE(name, 'Unnamed Item');
    ALTER TABLE inventory_items ALTER COLUMN name SET NOT NULL;
  END IF;
END $$;
