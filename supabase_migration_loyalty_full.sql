-- Comprehensive Loyalty Settings Schema Fix
-- Ensure all columns required by the application exist

ALTER TABLE shop_loyalty_settings 
ADD COLUMN IF NOT EXISTS redemption_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS min_points_required INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS earn_on_discounted_items BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS earn_on_full_payment_only BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS points_validity_days INTEGER DEFAULT 365,
ADD COLUMN IF NOT EXISTS max_redemption_percentage INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS flat_points_ratio NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS percentage_back NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS earning_type TEXT DEFAULT 'flat';

-- Force a schema cache reload (sometimes helpful)
NOTIFY pgrst, 'reload schema';
