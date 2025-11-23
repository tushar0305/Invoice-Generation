-- =============================================
-- RBAC and Multi-Shop Support Migration
-- =============================================
-- 
-- This migration adds:
-- 1. Multi-shop support (shops table)
-- 2. Role-based access control (user_shop_roles junction table)
-- 3. Invitation system with 6-digit codes
-- 4. Audit trail (created_by, updated_by fields)
-- 5. Updated RLS policies for shop-based access
--
-- IMPORTANT: Run this on a backup/staging environment first!
-- =============================================

-- =============================================
-- PHASE 1: Create New Tables
-- =============================================

-- Table: shops
-- Stores jewelry shop/business information (previously in user_settings)
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name TEXT NOT NULL,
  gst_number TEXT,
  pan_number TEXT,
  address TEXT,
  state TEXT,
  pincode TEXT,
  phone_number TEXT,
  email TEXT,
  logo_url TEXT,
  template_id TEXT DEFAULT 'classic',
  cgst_rate NUMERIC DEFAULT 1.5,
  sgst_rate NUMERIC DEFAULT 1.5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes for shops
CREATE INDEX IF NOT EXISTS idx_shops_created_by ON shops(created_by);
CREATE INDEX IF NOT EXISTS idx_shops_is_active ON shops(is_active);

-- Table: user_shop_roles
-- Junction table mapping users to shops with their role
CREATE TABLE IF NOT EXISTS user_shop_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
  
  -- Invitation tracking (in-app code based)
  invite_code TEXT UNIQUE, -- 6-digit code (e.g., "ABC123")
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ, -- NULL means invitation pending
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure one role per user per shop
  UNIQUE(user_id, shop_id)
);

-- Indexes for user_shop_roles
CREATE INDEX IF NOT EXISTS idx_user_shop_roles_user ON user_shop_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_shop_roles_shop ON user_shop_roles(shop_id);
CREATE INDEX IF NOT EXISTS idx_user_shop_roles_active ON user_shop_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_shop_roles_invite_code ON user_shop_roles(invite_code) WHERE invite_code IS NOT NULL;

-- Table: user_preferences
-- User-level app preferences (not shop-specific)
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_active_shop_id UUID REFERENCES shops(id),
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- PHASE 2: Modify Existing Tables
-- =============================================

-- Add shop_id to invoices (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='invoices' AND column_name='shop_id') THEN
    ALTER TABLE invoices ADD COLUMN shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add audit fields to invoices
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='invoices' AND column_name='created_by') THEN
    ALTER TABLE invoices ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='invoices' AND column_name='updated_by') THEN
    ALTER TABLE invoices ADD COLUMN updated_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Add shop_id to stock_items (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='stock_items' AND column_name='shop_id') THEN
    ALTER TABLE stock_items ADD COLUMN shop_id UUID REFERENCES shops(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add audit fields to stock_items
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='stock_items' AND column_name='created_by') THEN
    ALTER TABLE stock_items ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='stock_items' AND column_name='updated_by') THEN
    ALTER TABLE stock_items ADD COLUMN updated_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Mark user_settings as migrated (keep for backward compatibility)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='user_settings' AND column_name='migrated_to_shop_id') THEN
    ALTER TABLE user_settings ADD COLUMN migrated_to_shop_id UUID REFERENCES shops(id);
  END IF;
END $$;

-- Create indexes after adding columns
CREATE INDEX IF NOT EXISTS idx_invoices_shop ON invoices(shop_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by);
CREATE INDEX IF NOT EXISTS idx_stock_items_shop ON stock_items(shop_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_created_by ON stock_items(created_by);

-- =============================================
-- PHASE 3: Data Migration
-- =============================================

-- Step 1: Create default shop for each existing user from user_settings
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
  SELECT 1 FROM shops s WHERE s.created_by = us.user_id
);

-- Step 2: Assign all existing users as 'owner' of their default shop
INSERT INTO user_shop_roles (user_id, shop_id, role, invited_by, accepted_at)
SELECT 
  us.user_id,
  s.id as shop_id,
  'owner' as role,
  us.user_id as invited_by,
  now() as accepted_at
FROM user_settings us
JOIN shops s ON s.created_by = us.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM user_shop_roles usr 
  WHERE usr.user_id = us.user_id AND usr.shop_id = s.id
);

-- Step 3: Backfill shop_id in invoices
UPDATE invoices i
SET 
  shop_id = s.id,
  created_by = COALESCE(i.created_by, i.user_id),
  updated_by = i.user_id
FROM shops s
WHERE s.created_by = i.user_id
  AND i.shop_id IS NULL;

-- Step 4: Backfill shop_id in stock_items
UPDATE stock_items si
SET 
  shop_id = s.id,
  created_by = COALESCE(si.created_by, si.user_id),
  updated_by = si.user_id
FROM shops s
WHERE s.created_by = si.user_id
  AND si.shop_id IS NULL;

-- Step 5: Mark user_settings as migrated
UPDATE user_settings us
SET migrated_to_shop_id = s.id
FROM shops s
WHERE s.created_by = us.user_id
  AND us.migrated_to_shop_id IS NULL;

-- Step 6: Create initial user_preferences for all users
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
-- PHASE 4: Add Constraints
-- =============================================

-- Make shop_id NOT NULL after backfill (only if all data migrated)
DO $$
BEGIN
  -- Check if all invoices have shop_id
  IF NOT EXISTS (SELECT 1 FROM invoices WHERE shop_id IS NULL) THEN
    ALTER TABLE invoices ALTER COLUMN shop_id SET NOT NULL;
  ELSE
    RAISE NOTICE 'WARNING: Some invoices still have NULL shop_id. Fix before making NOT NULL.';
  END IF;
  
  -- Check if all stock_items have shop_id
  IF NOT EXISTS (SELECT 1 FROM stock_items WHERE shop_id IS NULL) THEN
    ALTER TABLE stock_items ALTER COLUMN shop_id SET NOT NULL;
  ELSE
    RAISE NOTICE 'WARNING: Some stock_items still have NULL shop_id. Fix before making NOT NULL.';
  END IF;
END $$;

-- =============================================
-- PHASE 5: Row-Level Security Policies
-- =============================================

-- Enable RLS on new tables
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_shop_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SHOPS TABLE POLICIES
-- ============================================

-- Policy: Users can view shops they have access to
DROP POLICY IF EXISTS "Users can view their shops" ON shops;
CREATE POLICY "Users can view their shops"
  ON shops FOR SELECT
  USING (
    id IN (
      SELECT shop_id FROM user_shop_roles 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Policy: Only owners can update shop settings
DROP POLICY IF EXISTS "Owners can update shop settings" ON shops;
CREATE POLICY "Owners can update shop settings"
  ON shops FOR UPDATE
  USING (
    id IN (
      SELECT shop_id FROM user_shop_roles 
      WHERE user_id = auth.uid() AND role = 'owner' AND is_active = true
    )
  );

-- Policy: Owners can create shops
DROP POLICY IF EXISTS "Users can create shops" ON shops;
CREATE POLICY "Users can create shops"
  ON shops FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Policy: Owners can delete shops (soft delete by setting is_active=false)
DROP POLICY IF EXISTS "Owners can delete shops" ON shops;
CREATE POLICY "Owners can delete shops"
  ON shops FOR DELETE
  USING (
    id IN (
      SELECT shop_id FROM user_shop_roles 
      WHERE user_id = auth.uid() AND role = 'owner' AND is_active = true
    )
  );

-- ============================================
-- USER_SHOP_ROLES TABLE POLICIES
-- ============================================

-- View: Users can see roles for shops they belong to
DROP POLICY IF EXISTS "Users can view shop memberships" ON user_shop_roles;
CREATE POLICY "Users can view shop memberships"
  ON user_shop_roles FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM user_shop_roles 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Insert: Only owners can invite others
DROP POLICY IF EXISTS "Owners can invite staff" ON user_shop_roles;
CREATE POLICY "Owners can invite staff"
  ON user_shop_roles FOR INSERT
  WITH CHECK (
    invited_by = auth.uid() 
    AND shop_id IN (
      SELECT shop_id FROM user_shop_roles 
      WHERE user_id = auth.uid() AND role = 'owner' AND is_active = true
    )
  );

-- Update: Only owners can change roles or accept invitations
DROP POLICY IF EXISTS "Owners can update roles" ON user_shop_roles;
CREATE POLICY "Owners can update roles"
  ON user_shop_roles FOR UPDATE
  USING (
    -- Owners can update any role in their shop
    (shop_id IN (
      SELECT shop_id FROM user_shop_roles 
      WHERE user_id = auth.uid() AND role = 'owner' AND is_active = true
    ))
    OR
    -- Users can accept their own invitations
    (user_id = auth.uid() AND accepted_at IS NULL)
  );

-- Delete: Only owners can remove staff
DROP POLICY IF EXISTS "Owners can remove staff" ON user_shop_roles;
CREATE POLICY "Owners can remove staff"
  ON user_shop_roles FOR DELETE
  USING (
    shop_id IN (
      SELECT shop_id FROM user_shop_roles 
      WHERE user_id = auth.uid() AND role = 'owner' AND is_active = true
    )
  );

-- ============================================
-- USER_PREFERENCES TABLE POLICIES
-- ============================================

-- Users can view/edit only their own preferences
DROP POLICY IF EXISTS "Users manage own preferences" ON user_preferences;
CREATE POLICY "Users manage own preferences"
  ON user_preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- INVOICES TABLE POLICIES (UPDATED)
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can create invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete own invoices" ON invoices;

-- View: Can see invoices from shops you have access to
DROP POLICY IF EXISTS "Users can view shop invoices" ON invoices;
CREATE POLICY "Users can view shop invoices"
  ON invoices FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM user_shop_roles 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Create: Any role can create invoices
DROP POLICY IF EXISTS "Staff can create invoices" ON invoices;
CREATE POLICY "Staff can create invoices"
  ON invoices FOR INSERT
  WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM user_shop_roles 
      WHERE user_id = auth.uid() AND is_active = true
    )
    AND created_by = auth.uid()
  );

-- Update: Owner/Manager can edit all, Staff can edit own
DROP POLICY IF EXISTS "Users can update invoices" ON invoices;
CREATE POLICY "Users can update invoices"
  ON invoices FOR UPDATE
  USING (
    shop_id IN (
      SELECT shop_id FROM user_shop_roles usr
      WHERE usr.user_id = auth.uid() 
        AND usr.is_active = true
        AND (
          usr.role IN ('owner', 'manager')
          OR (usr.role = 'staff' AND invoices.created_by = auth.uid())
        )
    )
  )
  WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM user_shop_roles usr
      WHERE usr.user_id = auth.uid() 
        AND usr.is_active = true
        AND (
          usr.role IN ('owner', 'manager')
          OR (usr.role = 'staff' AND invoices.created_by = auth.uid())
        )
    )
  );

-- Delete: Only Owner/Manager
DROP POLICY IF EXISTS "Owners and managers can delete invoices" ON invoices;
CREATE POLICY "Owners and managers can delete invoices"
  ON invoices FOR DELETE
  USING (
    shop_id IN (
      SELECT shop_id FROM user_shop_roles 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'manager') 
        AND is_active = true
    )
  );

-- ============================================
-- STOCK_ITEMS TABLE POLICIES (UPDATED)
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own stock" ON stock_items;
DROP POLICY IF EXISTS "Users can create stock" ON stock_items;
DROP POLICY IF EXISTS "Users can update own stock" ON stock_items;
DROP POLICY IF EXISTS "Users can delete own stock" ON stock_items;

-- View: All roles can view stock
DROP POLICY IF EXISTS "Users can view shop stock" ON stock_items;
CREATE POLICY "Users can view shop stock"
  ON stock_items FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM user_shop_roles 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Create: Only Owner and Manager
DROP POLICY IF EXISTS "Owners and managers can create stock" ON stock_items;
CREATE POLICY "Owners and managers can create stock"
  ON stock_items FOR INSERT
  WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM user_shop_roles 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'manager') 
        AND is_active = true
    )
    AND created_by = auth.uid()
  );

-- Update: Only Owner and Manager
DROP POLICY IF EXISTS "Owners and managers can update stock" ON stock_items;
CREATE POLICY "Owners and managers can update stock"
  ON stock_items FOR UPDATE
  USING (
    shop_id IN (
      SELECT shop_id FROM user_shop_roles 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'manager') 
        AND is_active = true
    )
  );

-- Delete: Only Owner and Manager
DROP POLICY IF EXISTS "Owners and managers can delete stock" ON stock_items;
CREATE POLICY "Owners and managers can delete stock"
  ON stock_items FOR DELETE
  USING (
    shop_id IN (
      SELECT shop_id FROM user_shop_roles 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'manager') 
        AND is_active = true
    )
  );

-- =============================================
-- PHASE 6: Helper Functions
-- =============================================

-- Function to generate 6-character alphanumeric invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to check user's role in a shop
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID, p_shop_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM user_shop_roles
  WHERE user_id = p_user_id 
    AND shop_id = p_shop_id 
    AND is_active = true;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- PHASE 7: Triggers for Audit Trail
-- =============================================

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to shops
DROP TRIGGER IF EXISTS update_shops_updated_at ON shops;
CREATE TRIGGER update_shops_updated_at
  BEFORE UPDATE ON shops
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to user_shop_roles
DROP TRIGGER IF EXISTS update_user_shop_roles_updated_at ON user_shop_roles;
CREATE TRIGGER update_user_shop_roles_updated_at
  BEFORE UPDATE ON user_shop_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to user_preferences
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to invoices
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to stock_items
DROP TRIGGER IF EXISTS update_stock_items_updated_at ON stock_items;
CREATE TRIGGER update_stock_items_updated_at
  BEFORE UPDATE ON stock_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Run these to verify migration success:

-- 1. Check if all users have a default shop
-- SELECT u.id, u.email, s.shop_name 
-- FROM auth.users u
-- LEFT JOIN shops s ON s.created_by = u.id
-- WHERE s.id IS NULL;
-- -- Should return 0 rows

-- 2. Check if all users are assigned owner role
-- SELECT u.id, u.email, usr.role, s.shop_name
-- FROM auth.users u
-- LEFT JOIN user_shop_roles usr ON usr.user_id = u.id
-- LEFT JOIN shops s ON s.id = usr.shop_id
-- WHERE usr.role IS NULL;
-- -- Should return 0 rows

-- 3. Check if all invoices have shop_id
-- SELECT COUNT(*) FROM invoices WHERE shop_id IS NULL;
-- -- Should return 0

-- 4. Check if all stock_items have shop_id
-- SELECT COUNT(*) FROM stock_items WHERE shop_id IS NULL;
-- -- Should return 0

-- =============================================
-- Migration Complete!
-- =============================================
