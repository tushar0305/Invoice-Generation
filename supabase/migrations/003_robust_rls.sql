-- =============================================
-- Fix: Robust RLS and Missing Permissions
-- =============================================
-- 
-- Issue: Users might be unable to see their shops if the 
-- user_shop_roles table is inaccessible or empty, leading
-- to "null shop_id" errors.
-- 
-- Fix: Add a direct policy for shop creators to view their shops.
-- =============================================

-- 1. Allow creators to ALWAYS view their own shops
-- (This acts as a fallback if user_shop_roles lookup fails)
DROP POLICY IF EXISTS "Creators can view own shops" ON shops;
CREATE POLICY "Creators can view own shops"
  ON shops FOR SELECT
  USING (created_by = auth.uid());

-- 2. Ensure user_settings is readable (just in case)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (user_id = auth.uid());

-- 3. Ensure user_shop_roles is readable (re-applying fix from 002 just in case)
DROP POLICY IF EXISTS "Users can view own shop memberships" ON user_shop_roles;
CREATE POLICY "Users can view own shop memberships"
  ON user_shop_roles FOR SELECT
  USING (user_id = auth.uid());

-- 4. Grant necessary permissions (if using custom roles, usually not needed for authenticated)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
