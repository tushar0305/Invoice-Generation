-- Add missing columns to shop_loyalty_settings table

ALTER TABLE shop_loyalty_settings 
ADD COLUMN IF NOT EXISTS min_points_required INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS earn_on_discounted_items BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS earn_on_full_payment_only BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS points_validity_days INTEGER DEFAULT 365,
ADD COLUMN IF NOT EXISTS max_redemption_percentage INTEGER DEFAULT 100;

-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'shop_loyalty_settings';
