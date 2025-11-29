-- =============================================
-- SWARNAVYAPAR COMPLETE DATABASE SCHEMA
-- =============================================

-- 1. CORE TABLES

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
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID,
  cgst_rate DECIMAL(5,2) DEFAULT 1.5,
  sgst_rate DECIMAL(5,2) DEFAULT 1.5,
  template_id TEXT DEFAULT 'classic',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_shop_roles (
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

CREATE INDEX IF NOT EXISTS idx_user_shop_roles_user_id ON user_shop_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_shop_roles_shop_id ON user_shop_roles(shop_id);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY,
  last_active_shop_id UUID REFERENCES shops(id) ON DELETE SET NULL,
  language TEXT DEFAULT 'en',
  theme TEXT DEFAULT 'system',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  currency TEXT DEFAULT 'INR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CUSTOMER MANAGEMENT

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  gst_number TEXT,
  loyalty_points INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  last_visit_at TIMESTAMPTZ,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_shop_id ON customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

CREATE TABLE IF NOT EXISTS customer_loyalty_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  invoice_id UUID,
  points_change INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gold_24k NUMERIC NOT NULL,
  gold_22k NUMERIC NOT NULL,
  silver NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INVENTORY & INVOICING

CREATE TABLE IF NOT EXISTS stock_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  purity TEXT NOT NULL,
  base_price DECIMAL(10,2) DEFAULT 0,
  making_charge_per_gram DECIMAL(10,2) DEFAULT 0,
  quantity DECIMAL(10,3) DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'grams',
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_items_shop_id ON stock_items(shop_id);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_snapshot JSONB,
  customer_name TEXT,
  customer_address TEXT,
  customer_phone TEXT,
  status TEXT CHECK (status IN ('paid', 'due')),
  invoice_date DATE,
  discount DECIMAL(10,2) DEFAULT 0,
  customer_state TEXT,
  customer_pincode TEXT,
  grand_total DECIMAL(10,2),
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

CREATE INDEX IF NOT EXISTS idx_invoices_shop_id ON invoices(shop_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT,
  purity TEXT,
  gross_weight NUMERIC DEFAULT 0,
  net_weight NUMERIC DEFAULT 0,
  rate NUMERIC DEFAULT 0,
  making NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- 4. KHATA BOOK (LEDGER)

CREATE TABLE IF NOT EXISTS customer_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  is_cleared BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_customer_pending ON customer_ledger(customer_id) WHERE is_cleared = FALSE;

-- 5. STAFF MANAGEMENT

CREATE TABLE IF NOT EXISTS staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  designation TEXT,
  phone_number TEXT,
  joining_date DATE,
  salary_type TEXT CHECK (salary_type IN ('monthly', 'daily', 'commission')),
  base_salary DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff_profiles(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  staff_user_id UUID REFERENCES auth.users(id), -- Added for direct auth link
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('present', 'absent', 'half_day', 'leave')),
  check_in_time TIME,
  check_out_time TIME,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, staff_user_id, date)
);

CREATE TABLE IF NOT EXISTS staff_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff_profiles(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  staff_user_id UUID REFERENCES auth.users(id), -- Added for direct auth link
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_type TEXT CHECK (payment_type IN ('salary', 'advance', 'bonus', 'commission', 'reimbursement')),
  description TEXT,
  notes TEXT,
  status TEXT DEFAULT 'paid',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shop_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
    invited_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    token TEXT DEFAULT encode(gen_random_bytes(32), 'hex'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    UNIQUE(shop_id, email)
);

-- 6. FUNCTIONS & TRIGGERS

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

-- Function: get_dashboard_stats
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_shop_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_sales DECIMAL(12,2);
  v_total_invoices INTEGER;
  v_pending_payments DECIMAL(12,2);
  v_low_stock_count INTEGER;
  v_monthly_sales DECIMAL(12,2);
BEGIN
  -- Check permissions
  IF NOT EXISTS (
    SELECT 1 FROM user_shop_roles 
    WHERE user_id = auth.uid() 
    AND shop_id = p_shop_id
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Calculate Total Sales
  SELECT COALESCE(SUM(total_amount), 0) INTO v_total_sales
  FROM invoices
  WHERE shop_id = p_shop_id;

  -- Calculate Total Invoices
  SELECT COUNT(*) INTO v_total_invoices
  FROM invoices
  WHERE shop_id = p_shop_id;

  -- Calculate Pending Payments (Due invoices)
  SELECT COALESCE(SUM(total_amount), 0) INTO v_pending_payments
  FROM invoices
  WHERE shop_id = p_shop_id AND status = 'due';

  -- Calculate Low Stock Items (e.g., less than 10 units)
  SELECT COUNT(*) INTO v_low_stock_count
  FROM stock_items
  WHERE shop_id = p_shop_id AND quantity < 10;

  -- Calculate Monthly Sales (Current Month)
  SELECT COALESCE(SUM(total_amount), 0) INTO v_monthly_sales
  FROM invoices
  WHERE shop_id = p_shop_id 
  AND created_at >= date_trunc('month', CURRENT_DATE);

  RETURN json_build_object(
    'totalSales', v_total_sales,
    'totalInvoices', v_total_invoices,
    'pendingPayments', v_pending_payments,
    'lowStockCount', v_low_stock_count,
    'monthlySales', v_monthly_sales
  );
END;
$$;

-- Function: update_invoice_totals
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE invoices
  SET 
    subtotal = (
      SELECT COALESCE(SUM(net_weight * rate + making), 0)
      FROM invoice_items
      WHERE invoice_id = NEW.invoice_id
    ),
    updated_at = NOW()
  WHERE id = NEW.invoice_id;
  
  -- Recalculate tax and grand total
  UPDATE invoices
  SET
    cgst_amount = (subtotal - COALESCE(discount, 0)) * (COALESCE(cgst, 1.5) / 100),
    sgst_amount = (subtotal - COALESCE(discount, 0)) * (COALESCE(sgst, 1.5) / 100),
    total_amount = (subtotal - COALESCE(discount, 0)) * (1 + (COALESCE(cgst, 1.5) + COALESCE(sgst, 1.5)) / 100),
    grand_total = (subtotal - COALESCE(discount, 0)) * (1 + (COALESCE(cgst, 1.5) + COALESCE(sgst, 1.5)) / 100)
  WHERE id = NEW.invoice_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: update_invoice_totals_trigger
DROP TRIGGER IF EXISTS update_invoice_totals_trigger ON invoice_items;
CREATE TRIGGER update_invoice_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON invoice_items
FOR EACH ROW
EXECUTE FUNCTION update_invoice_totals();
