-- =============================================
-- COMPLETE RLS POLICIES
-- =============================================
-- This file contains all Row Level Security policies
-- Run this after schema.sql to set up access control
-- =============================================

-- =============================================
-- CLEANUP (if recreating)
-- =============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view shop memberships" ON user_shop_roles;
DROP POLICY IF EXISTS "Owners can invite staff" ON user_shop_roles;
DROP POLICY IF EXISTS "Owners can update roles" ON user_shop_roles;
DROP POLICY IF EXISTS "Owners can remove staff" ON user_shop_roles;
DROP POLICY IF EXISTS "Users can view their shops" ON shops;
DROP POLICY IF EXISTS "Owners can update shop settings" ON shops;
DROP POLICY IF EXISTS "Users can create shops" ON shops;
DROP POLICY IF EXISTS "Owners can delete shops" ON shops;
DROP POLICY IF EXISTS "Users manage own preferences" ON user_preferences;

DROP POLICY IF EXISTS "Users can view shop invoices" ON invoices;
DROP POLICY IF EXISTS "Staff can create invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update invoices" ON invoices;
DROP POLICY IF EXISTS "Owners and managers can delete invoices" ON invoices;

DROP POLICY IF EXISTS "Owners can manage shop stock items" ON stock_items;
DROP POLICY IF EXISTS "Managers can view and edit shop stock items" ON stock_items;
DROP POLICY IF EXISTS "Managers can insert stock items" ON stock_items;
DROP POLICY IF EXISTS "Managers can update stock items" ON stock_items;
DROP POLICY IF EXISTS "Staff can view shop stock items" ON stock_items;
DROP POLICY IF EXISTS "Users can manage their own stock items" ON stock_items;

DROP POLICY IF EXISTS "Users can view shop customers" ON customers;
DROP POLICY IF EXISTS "Staff can create customers" ON customers;
DROP POLICY IF EXISTS "Owners and managers can update customers" ON customers;
DROP POLICY IF EXISTS "Owners can delete customers" ON customers;

DROP POLICY IF EXISTS "Users manage own settings" ON user_settings;

-- =============================================
-- SHOPS POLICIES
-- =============================================

CREATE POLICY "Users can view their shops"
  ON shops FOR SELECT
  USING (
    id IN (
      SELECT shop_id FROM user_shop_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update shop settings"
  ON shops FOR UPDATE
  USING (
    id IN (
      SELECT shop_id FROM user_shop_roles
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Users can create shops"
  ON shops FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Owners can delete shops"
  ON shops FOR DELETE
  USING (
    id IN (
      SELECT shop_id FROM user_shop_roles
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- =============================================
-- USER_SHOP_ROLES POLICIES
-- =============================================

CREATE POLICY "Users can view shop memberships"
  ON user_shop_roles FOR SELECT
  USING (
    user_id = auth.uid()
    OR shop_id IN (
      SELECT shop_id FROM user_shop_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can invite staff"
  ON user_shop_roles FOR INSERT
  WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM user_shop_roles
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Owners can update roles"
  ON user_shop_roles FOR UPDATE
  USING (
    shop_id IN (
      SELECT shop_id FROM user_shop_roles
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Owners can remove staff"
  ON user_shop_roles FOR DELETE
  USING (
    shop_id IN (
      SELECT shop_id FROM user_shop_roles usr
      WHERE usr.user_id = auth.uid() AND usr.role = 'owner'
    )
    AND role != 'owner'
  );

-- =============================================
-- USER_PREFERENCES POLICIES
-- =============================================

CREATE POLICY "Users manage own preferences"  
  ON user_preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================
-- CUSTOMERS POLICIES
-- =============================================

CREATE POLICY "Users can view shop customers"
  ON customers FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM user_shop_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can create customers"
  ON customers FOR INSERT
  WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM user_shop_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and managers can update customers"
  ON customers FOR UPDATE
  USING (
    shop_id IN (
      SELECT shop_id FROM user_shop_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Owners can delete customers"
  ON customers FOR DELETE
  USING (
    shop_id IN (
      SELECT shop_id FROM user_shop_roles
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- =============================================
-- STOCK_ITEMS POLICIES
-- =============================================

CREATE POLICY "Owners can manage shop stock items"
  ON stock_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_shop_roles
      WHERE user_shop_roles.user_id = auth.uid()
        AND user_shop_roles.shop_id = stock_items.shop_id
        AND user_shop_roles.role = 'owner'
    )
  );

CREATE POLICY "Managers can view and edit shop stock items"
  ON stock_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_shop_roles
      WHERE user_shop_roles.user_id = auth.uid()
        AND user_shop_roles.shop_id = stock_items.shop_id
        AND user_shop_roles.role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Managers can insert stock items"
  ON stock_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_shop_roles
      WHERE user_shop_roles.user_id = auth.uid()
        AND user_shop_roles.shop_id = stock_items.shop_id
        AND user_shop_roles.role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Managers can update stock items"
  ON stock_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_shop_roles
      WHERE user_shop_roles.user_id = auth.uid()
        AND user_shop_roles.shop_id = stock_items.shop_id
        AND user_shop_roles.role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Staff can view shop stock items"
  ON stock_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_shop_roles
      WHERE user_shop_roles.user_id = auth.uid()
        AND user_shop_roles.shop_id = stock_items.shop_id
    )
  );

CREATE POLICY "Users can manage their own stock items"
  ON stock_items FOR ALL
  USING (user_id = auth.uid());

-- =============================================
-- INVOICES POLICIES
-- =============================================

CREATE POLICY "Users can view shop invoices"
  ON invoices FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM user_shop_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can create invoices"
  ON invoices FOR INSERT
  WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM user_shop_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update invoices"
  ON invoices FOR UPDATE
  USING (
    shop_id IN (
      SELECT shop_id FROM user_shop_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Owners and managers can delete invoices"
  ON invoices FOR DELETE
  USING (
    shop_id IN (
      SELECT shop_id FROM user_shop_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

-- =============================================
-- USER_SETTINGS POLICIES (Legacy)
-- =============================================

CREATE POLICY "Users manage own settings"
  ON user_settings FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================
-- COMPLETE - All Policies Created Successfully
-- =============================================
