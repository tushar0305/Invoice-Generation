-- =============================================
-- COMPLETE DATABASE SETUP - FIXED VERSION
-- =============================================
-- This migration sets up the entire database schema from scratch
-- FIXES: Infinite recursion in RLS policies using helper functions
-- =============================================

-- =============================================
-- CLEANUP: Drop existing objects
-- =============================================

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
DROP POLICY IF EXISTS "Users can view shop stock" ON stock_items;
DROP POLICY IF EXISTS "Owners and managers can create stock" ON stock_items;
DROP POLICY IF EXISTS "Owners and managers can update stock" ON stock_items;
DROP POLICY IF EXISTS "Owners and managers can delete stock" ON stock_items;

DROP FUNCTION IF EXISTS get_user_shops();
DROP FUNCTION IF EXISTS user_has_shop_access(UUID);
DROP FUNCTION IF EXISTS user_is_shop_owner(UUID);

DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS user_shop_roles CASCADE;
DROP TABLE IF EXISTS shops CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS stock_items CASCADE;

-- =============================================
-- PHASE 1: Create Core Tables
-- =============================================

-- Table: shops
CREATE TABLE shops (
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

CREATE INDEX idx_shops_created_by ON shops(created_by);
CREATE INDEX idx_shops_is_active ON shops(is_active);

-- Table: user_shop_roles
CREATE TABLE user_shop_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
  invited_by UUID REFERENCES auth.users(id),
  accepted_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, shop_id)
);

CREATE INDEX idx_user_shop_roles_user ON user_shop_roles(user_id);
CREATE INDEX idx_user_shop_roles_shop ON user_shop_roles(shop_id);
CREATE INDEX idx_user_shop_roles_active ON user_shop_roles(is_active);

-- Table: user_preferences
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_active_shop_id UUID REFERENCES shops(id),
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  customer_state TEXT,
  customer_pincode TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  cgst NUMERIC DEFAULT 1.5,
  sgst NUMERIC DEFAULT 1.5,
  cgst_amount NUMERIC NOT NULL DEFAULT 0,
  sgst_amount NUMERIC NOT NULL DEFAULT 0,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'Unpaid',
  invoice_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(shop_id, invoice_number)
);

CREATE INDEX idx_invoices_shop ON invoices(shop_id);
CREATE INDEX idx_invoices_created_by ON invoices(created_by);
CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);

-- Table: stock_items
CREATE TABLE IF NOT EXISTS stock_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_stock_items_shop ON stock_items(shop_id);
CREATE INDEX idx_stock_items_created_by ON stock_items(created_by);
CREATE INDEX idx_stock_items_user ON stock_items(user_id);

-- Table: invoice_items
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT,
  purity TEXT,
  gross_weight NUMERIC DEFAULT 0,
  net_weight NUMERIC DEFAULT 0,
  rate NUMERIC DEFAULT 0,
  making NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

-- =============================================
-- PHASE 2: Helper Functions (BEFORE RLS)
-- =============================================

-- Function to get user's shop IDs (SECURITY DEFINER to avoid recursion)
CREATE OR REPLACE FUNCTION get_user_shops()
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY
  SELECT shop_id FROM user_shop_roles
  WHERE user_id = auth.uid() AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user has access to a shop
CREATE OR REPLACE FUNCTION user_has_shop_access(p_shop_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_shop_roles
    WHERE user_id = auth.uid() 
      AND shop_id = p_shop_id 
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is owner of a shop
CREATE OR REPLACE FUNCTION user_is_shop_owner(p_shop_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_shop_roles
    WHERE user_id = auth.uid() 
      AND shop_id = p_shop_id 
      AND role = 'owner'
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
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

-- Function to create a new shop and assign the creator as owner
CREATE OR REPLACE FUNCTION create_new_shop(p_shop_name TEXT)
RETURNS UUID AS $$
DECLARE
  v_shop_id UUID;
BEGIN
  INSERT INTO shops (shop_name, created_by)
  VALUES (p_shop_name, auth.uid())
  RETURNING id INTO v_shop_id;

  INSERT INTO user_shop_roles (user_id, shop_id, role, invited_by, accepted_at)
  VALUES (auth.uid(), v_shop_id, 'owner', auth.uid(), now());

  INSERT INTO user_preferences (user_id, last_active_shop_id)
  VALUES (auth.uid(), v_shop_id)
  ON CONFLICT (user_id) 
  DO UPDATE SET last_active_shop_id = v_shop_id;

  RETURN v_shop_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- PHASE 3: Row-Level Security Policies
-- =============================================

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_shop_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;

-- SHOPS POLICIES
CREATE POLICY "Users can view their shops"
  ON shops FOR SELECT
  USING (id IN (SELECT get_user_shops()));

CREATE POLICY "Owners can update shop settings"
  ON shops FOR UPDATE
  USING (user_is_shop_owner(id));

CREATE POLICY "Users can create shops"
  ON shops FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Owners can delete shops"
  ON shops FOR DELETE
  USING (user_is_shop_owner(id));

-- USER_SHOP_ROLES POLICIES
CREATE POLICY "Users can view shop memberships"
  ON user_shop_roles FOR SELECT
  USING (user_id = auth.uid() OR user_has_shop_access(shop_id));

CREATE POLICY "Owners can invite staff"
  ON user_shop_roles FOR INSERT
  WITH CHECK (invited_by = auth.uid() AND user_is_shop_owner(shop_id));

CREATE POLICY "Owners can update roles"
  ON user_shop_roles FOR UPDATE
  USING (user_is_shop_owner(shop_id));

CREATE POLICY "Owners can remove staff"
  ON user_shop_roles FOR DELETE
  USING (user_is_shop_owner(shop_id));

-- USER_PREFERENCES POLICIES
CREATE POLICY "Users manage own preferences"
  ON user_preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- INVOICES POLICIES
CREATE POLICY "Users can view shop invoices"
  ON invoices FOR SELECT
  USING (user_has_shop_access(shop_id));

CREATE POLICY "Staff can create invoices"
  ON invoices FOR INSERT
  WITH CHECK (user_has_shop_access(shop_id) AND created_by = auth.uid());

CREATE POLICY "Users can update invoices"
  ON invoices FOR UPDATE
  USING (user_has_shop_access(shop_id));

CREATE POLICY "Owners and managers can delete invoices"
  ON invoices FOR DELETE
  USING (user_has_shop_access(shop_id));

-- STOCK_ITEMS POLICIES
CREATE POLICY "Users can view shop stock"
  ON stock_items FOR SELECT
  USING (user_has_shop_access(shop_id));

CREATE POLICY "Owners and managers can create stock"
  ON stock_items FOR INSERT
  WITH CHECK (user_has_shop_access(shop_id) AND created_by = auth.uid());

CREATE POLICY "Owners and managers can update stock"
  ON stock_items FOR UPDATE
  USING (user_has_shop_access(shop_id));

CREATE POLICY "Owners and managers can delete stock"
  ON stock_items FOR DELETE
  USING (user_has_shop_access(shop_id));

-- INVOICE_ITEMS POLICIES
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invoice items"
  ON invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_items.invoice_id
      AND user_has_shop_access(i.shop_id)
    )
  );

CREATE POLICY "Staff can create invoice items"
  ON invoice_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_items.invoice_id
      AND user_has_shop_access(i.shop_id)
    )
  );

CREATE POLICY "Users can update invoice items"
  ON invoice_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_items.invoice_id
      AND user_has_shop_access(i.shop_id)
    )
  );

CREATE POLICY "Owners and managers can delete invoice items"
  ON invoice_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_items.invoice_id
      AND user_has_shop_access(i.shop_id)
    )
  );

-- =============================================
-- PHASE 4: Triggers
-- =============================================

CREATE TRIGGER update_shops_updated_at
  BEFORE UPDATE ON shops
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_shop_roles_updated_at
  BEFORE UPDATE ON user_shop_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_items_updated_at
  BEFORE UPDATE ON stock_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- PHASE 5: Backward Compatibility View
-- =============================================

-- Create a view for backward compatibility with code that references user_settings
-- This view shows the active shop for each user
CREATE OR REPLACE VIEW user_settings AS
SELECT 
  s.created_by as user_id,
  s.id as shop_id,
  s.shop_name,
  s.gst_number,
  s.pan_number,
  s.address,
  s.state,
  s.pincode,
  s.phone_number,
  s.email,
  s.logo_url,
  s.template_id,
  s.cgst_rate,
  s.sgst_rate,
  s.created_at,
  s.updated_at,
  s.id as migrated_to_shop_id
FROM shops s
INNER JOIN user_shop_roles usr ON usr.shop_id = s.id
WHERE usr.user_id = auth.uid() 
  AND usr.is_active = true
  AND s.is_active = true
LIMIT 1;

-- Grant permissions on the view
GRANT SELECT ON user_settings TO authenticated;

-- Create INSTEAD OF triggers to make the view writable
CREATE OR REPLACE FUNCTION user_settings_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_shop_id UUID;
BEGIN
  -- Check if user already has a shop
  SELECT shop_id INTO v_shop_id
  FROM user_shop_roles
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1;
  
  IF v_shop_id IS NOT NULL THEN
    -- User has a shop, update it
    UPDATE shops SET
      shop_name = COALESCE(NEW.shop_name, shop_name),
      gst_number = NEW.gst_number,
      pan_number = NEW.pan_number,
      address = NEW.address,
      state = NEW.state,
      pincode = NEW.pincode,
      phone_number = NEW.phone_number,
      email = NEW.email,
      logo_url = NEW.logo_url,
      template_id = NEW.template_id,
      cgst_rate = NEW.cgst_rate,
      sgst_rate = NEW.sgst_rate,
      updated_at = now()
    WHERE id = v_shop_id;
  ELSE
    -- User doesn't have a shop, create one
    v_shop_id := create_new_shop(COALESCE(NEW.shop_name, 'My Shop'));
    
    -- Update the newly created shop with all the details
    UPDATE shops SET
      gst_number = NEW.gst_number,
      pan_number = NEW.pan_number,
      address = NEW.address,
      state = NEW.state,
      pincode = NEW.pincode,
      phone_number = NEW.phone_number,
      email = NEW.email,
      logo_url = NEW.logo_url,
      template_id = NEW.template_id,
      cgst_rate = NEW.cgst_rate,
      sgst_rate = NEW.sgst_rate
    WHERE id = v_shop_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION user_settings_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the user's active shop
  UPDATE shops SET
    shop_name = NEW.shop_name,
    gst_number = NEW.gst_number,
    pan_number = NEW.pan_number,
    address = NEW.address,
    state = NEW.state,
    pincode = NEW.pincode,
    phone_number = NEW.phone_number,
    email = NEW.email,
    logo_url = NEW.logo_url,
    template_id = NEW.template_id,
    cgst_rate = NEW.cgst_rate,
    sgst_rate = NEW.sgst_rate,
    updated_at = now()
  WHERE id IN (
    SELECT shop_id FROM user_shop_roles
    WHERE user_id = auth.uid() AND is_active = true
    LIMIT 1
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER user_settings_insert_trigger
  INSTEAD OF INSERT ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION user_settings_insert();

CREATE TRIGGER user_settings_update_trigger
  INSTEAD OF UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION user_settings_update();

-- =============================================
-- Migration Complete!
-- =============================================
