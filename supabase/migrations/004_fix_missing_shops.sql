-- =============================================
-- Fix: Manual Shop Creation for Users Missing Shops
-- =============================================
-- 
-- Run this if your migration completed but you don't have a shop
-- in the shops table, causing "Key is not present in table shops" errors.
-- 
-- This script will:
-- 1. Create a shop from your user_settings
-- 2. Assign you as owner in user_shop_roles
-- 3. Update user_settings.migrated_to_shop_id
-- 4. Backfill existing invoices and stock_items with the new shop_id
-- =============================================

-- STEP 1: Create shops for users who have user_settings but no shop
INSERT INTO shops (
  shop_name, gst_number, pan_number, address, state, pincode,
  phone_number, email, logo_url, template_id, cgst_rate, sgst_rate,
  created_by, created_at
)
SELECT 
  COALESCE(us.shop_name, 'My Jewelry Shop') as shop_name,
  us.gst_number,
  us.pan_number,
  us.address,
  us.state,
  us.pincode,
  us.phone_number,
  us.email,
  us.logo_url,
  COALESCE(us.template_id, 'classic') as template_id,
  COALESCE(us.cgst_rate, 1.5) as cgst_rate,
  COALESCE(us.sgst_rate, 1.5) as sgst_rate,
  us.user_id as created_by,
  now() as created_at
FROM user_settings us
WHERE NOT EXISTS (
  -- Only create if user doesn't already have a shop
  SELECT 1 FROM shops s WHERE s.created_by = us.user_id
);

-- STEP 2: Create user_shop_roles entries for all users who own shops
INSERT INTO user_shop_roles (user_id, shop_id, role, invited_by, accepted_at, is_active)
SELECT 
  s.created_by as user_id,
  s.id as shop_id,
  'owner' as role,
  s.created_by as invited_by,
  now() as accepted_at,
  true as is_active
FROM shops s
WHERE NOT EXISTS (
  -- Only create if role doesn't already exist
  SELECT 1 FROM user_shop_roles usr 
  WHERE usr.user_id = s.created_by AND usr.shop_id = s.id
);

-- STEP 3: Update user_settings.migrated_to_shop_id
UPDATE user_settings us
SET migrated_to_shop_id = s.id
FROM shops s
WHERE s.created_by = us.user_id
  AND us.migrated_to_shop_id IS NULL;

-- STEP 4: Backfill invoices with shop_id (if they're missing it)
UPDATE invoices i
SET 
  shop_id = s.id,
  created_by = COALESCE(i.created_by, i.user_id),
  updated_by = i.user_id
FROM shops s
WHERE s.created_by = i.user_id
  AND i.shop_id IS NULL;

-- STEP 5: Backfill stock_items with shop_id (if they're missing it)
UPDATE stock_items si
SET 
  shop_id = s.id,
  created_by = COALESCE(si.created_by, si.user_id),
  updated_by = si.user_id
FROM shops s
WHERE s.created_by = si.user_id
  AND si.shop_id IS NULL;

-- STEP 6: Create user_preferences for all users (if missing)
INSERT INTO user_preferences (user_id, last_active_shop_id)
SELECT 
  usr.user_id,
  usr.shop_id as last_active_shop_id
FROM user_shop_roles usr
WHERE usr.role = 'owner'
  AND NOT EXISTS (
    SELECT 1 FROM user_preferences up WHERE up.user_id = usr.user_id
  );

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Run these after the fix to verify everything is correct:

-- 1. Check if you have a shop
-- SELECT u.id, u.email, s.id as shop_id, s.shop_name 
-- FROM auth.users u
-- LEFT JOIN shops s ON s.created_by = u.id
-- WHERE u.id = auth.uid();
-- Expected: Should show your shop

-- 2. Check if you're an owner
-- SELECT * FROM user_shop_roles 
-- WHERE user_id = auth.uid();
-- Expected: Should show role = 'owner'

-- 3. Check if invoices have shop_id
-- SELECT COUNT(*) as invoices_without_shop 
-- FROM invoices 
-- WHERE shop_id IS NULL;
-- Expected: 0

-- 4. Check if stock_items have shop_id
-- SELECT COUNT(*) as stock_items_without_shop 
-- FROM stock_items 
-- WHERE shop_id IS NULL;
-- Expected: 0

-- =============================================
-- SUCCESS!
-- =============================================
-- After running this script, refresh your app and try creating an invoice.
-- It should work without any "Key is not present" errors!
