-- Migration: Fix inventory_items schema
-- 1. Make name nullable (auto-generated in trigger)
-- 2. Add location if missing

DO $$
BEGIN
    -- Make name nullable
    ALTER TABLE inventory_items ALTER COLUMN name DROP NOT NULL;
    
    -- Add location if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'location') THEN
        ALTER TABLE inventory_items ADD COLUMN location TEXT DEFAULT 'SHOWCASE';
    END IF;

END $$;
