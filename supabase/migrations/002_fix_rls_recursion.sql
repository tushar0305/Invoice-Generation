-- =============================================
-- Fix: Infinite Recursion in RLS Policies
-- =============================================
-- 
-- The original user_shop_roles SELECT policy created
-- infinite recursion by querying itself.
-- 
-- This fix simplifies the policies to avoid circular dependencies.
-- =============================================

-- ============================================
-- FIX: USER_SHOP_ROLES TABLE POLICIES
-- ============================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view shop memberships" ON user_shop_roles;

-- NEW: Simple policy - users can see their own shop memberships
-- This breaks the circular dependency!
CREATE POLICY "Users can view own shop memberships"
  ON user_shop_roles FOR SELECT
  USING (user_id = auth.uid());

-- The other policies are fine as-is since they don't create recursion

-- ============================================
-- VERIFICATION
-- ============================================

-- Test: Should be able to query user_shop_roles now
-- SELECT * FROM user_shop_roles WHERE user_id = auth.uid();

-- Test: Should be able to query shops
-- SELECT * FROM shops;

-- Test: Should be able to query invoices
-- SELECT * FROM invoices;
