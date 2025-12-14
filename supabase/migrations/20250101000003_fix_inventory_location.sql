-- Fix missing location column in inventory_items
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'location') THEN
        ALTER TABLE inventory_items ADD COLUMN location TEXT DEFAULT 'SHOWCASE';
    END IF;
END $$;
