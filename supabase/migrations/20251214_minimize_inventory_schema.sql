-- Migration: Minimize inventory_items schema to match minimal design
-- Remove all deprecated/unused columns to fix Supabase relation errors

DO $$
BEGIN
    -- Drop columns that are not part of the minimal schema
    
    -- Drop reserved_for_customer_id (causing schema cache error)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'reserved_for_customer_id') THEN
        ALTER TABLE inventory_items DROP COLUMN reserved_for_customer_id;
    END IF;
    
    -- Drop other deprecated pricing columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'purchase_cost') THEN
        ALTER TABLE inventory_items DROP COLUMN purchase_cost;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'selling_price') THEN
        ALTER TABLE inventory_items DROP COLUMN selling_price;
    END IF;
    
    -- Drop deprecated classification
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'subcategory') THEN
        ALTER TABLE inventory_items DROP COLUMN subcategory;
    END IF;
    
    -- Drop source tracking columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'source_type') THEN
        ALTER TABLE inventory_items DROP COLUMN source_type;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'source_notes') THEN
        ALTER TABLE inventory_items DROP COLUMN source_notes;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'vendor_name') THEN
        ALTER TABLE inventory_items DROP COLUMN vendor_name;
    END IF;
    
    -- Drop description columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'description') THEN
        ALTER TABLE inventory_items DROP COLUMN description;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'internal_notes') THEN
        ALTER TABLE inventory_items DROP COLUMN internal_notes;
    END IF;
    
    -- Drop image/certification columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'images') THEN
        ALTER TABLE inventory_items DROP COLUMN images;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'certification_info') THEN
        ALTER TABLE inventory_items DROP COLUMN certification_info;
    END IF;
    
    -- Drop reserved_until (related to removed customer reference)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'reserved_until') THEN
        ALTER TABLE inventory_items DROP COLUMN reserved_until;
    END IF;
    
    -- Drop sold tracking columns (not in minimal schema)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'sold_invoice_id') THEN
        ALTER TABLE inventory_items DROP COLUMN sold_invoice_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'sold_at') THEN
        ALTER TABLE inventory_items DROP COLUMN sold_at;
    END IF;
    
END $$;

-- Final minimal schema columns that should exist:
-- id, tag_id, qr_data, shop_id
-- metal_type, purity, category, hsn_code
-- gross_weight, net_weight, stone_weight, wastage_percent
-- making_charge_type, making_charge_value, stone_value
-- status, location
-- name, created_at, updated_at, created_by, updated_by
