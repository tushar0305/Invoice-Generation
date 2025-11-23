-- =============================================
-- COMPLETE DATABASE SCHEMA
-- =============================================
-- This file contains the complete database schema
-- Run this to recreate the entire database from scratch
-- =============================================

-- =============================================
-- CLEANUP (if recreating)
-- =============================================

DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS user_shop_roles CASCADE;
DROP TABLE IF EXISTS shops CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS stock_items CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;

-- =============================================
-- CORE TABLES
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
  cgst_rate DECIMAL(5,2) DEFAULT 1.5,
  sgst_rate DECIMAL(5,2) DEFAULT 1.5,
  template_id TEXT DEFAULT 'classic',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: user_shop_roles
CREATE TABLE user_shop_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
  invited_by UUID,
  accepted_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, shop_id)
);

CREATE INDEX idx_user_shop_roles_user_id ON user_shop_roles(user_id);
CREATE INDEX idx_user_shop_roles_shop_id ON user_shop_roles(shop_id);
CREATE INDEX idx_user_shop_roles_role ON user_shop_roles(role);

-- Table: user_preferences
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY,
  last_active_shop_id UUID REFERENCES shops(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  created_by UUID,
  updated_by UUID,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  gst_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_shop_id ON customers(shop_id);

-- Table: stock_items
CREATE TABLE stock_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  created_by UUID,
  updated_by UUID,
  
  -- Item details
  name TEXT NOT NULL,
  description TEXT,
  purity TEXT NOT NULL,
  
  -- Pricing
  base_price DECIMAL(10,2) DEFAULT 0,
  making_charge_per_gram DECIMAL(10,2) DEFAULT 0,
  
  -- Weight
  base_weight DECIMAL(10,3),
  
  -- Inventory
  quantity DECIMAL(10,3) DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'grams',
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_items_user_id ON stock_items(user_id);
CREATE INDEX idx_stock_items_shop_id ON stock_items(shop_id);
CREATE INDEX idx_stock_items_is_active ON stock_items(is_active);

-- Table: invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  created_by UUID,
  updated_by UUID,
  
  invoice_number TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_address TEXT,
  customer_phone TEXT,
  customer_state TEXT,
  customer_gst_number TEXT,
  
  items JSONB NOT NULL DEFAULT '[]',
  
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  cgst_amount DECIMAL(10,2) DEFAULT 0,
  sgst_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  is_paid BOOLEAN DEFAULT FALSE,
  payment_method TEXT,
  payment_date TIMESTAMPTZ,
  
  notes TEXT,
  created_by_name TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_shop_id ON invoices(shop_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_created_at ON invoices(created_at DESC);

-- Table: user_settings (legacy, kept for backward compatibility)
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY,
  cgst_rate DECIMAL(5,2) DEFAULT 1.5,
  sgst_rate DECIMAL(5,2) DEFAULT 1.5,
  shop_name TEXT DEFAULT 'Jewellers Store',
  gst_number TEXT,
  pan_number TEXT,
  address TEXT,
  state TEXT,
  pincode TEXT,
  phone_number TEXT,
  email TEXT,
  logo_url TEXT,
  template_id TEXT DEFAULT 'classic',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function: create_new_shop
CREATE OR REPLACE FUNCTION create_new_shop(p_shop_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_shop_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Create shop
  INSERT INTO shops (shop_name)
  VALUES (p_shop_name)
  RETURNING id INTO v_shop_id;

  -- Assign owner role
  INSERT INTO user_shop_roles (user_id, shop_id, role, accepted_at)
  VALUES (v_user_id, v_shop_id, 'owner', NOW());

  -- Set as active shop
  INSERT INTO user_preferences (user_id, last_active_shop_id)
  VALUES (v_user_id, v_shop_id)
  ON CONFLICT (user_id) DO UPDATE
  SET last_active_shop_id = v_shop_id;

  RETURN v_shop_id;
END;
$$;

-- =============================================
-- ENABLE RLS
-- =============================================

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_shop_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- COMPLETE - Schema Created Successfully
-- =============================================
-- Next step: Run policies.sql to set up RLS policies
-- =============================================
