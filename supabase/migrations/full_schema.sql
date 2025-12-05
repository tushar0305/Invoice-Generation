-- ==========================================
-- Invoice Generation Full Schema
-- Consolidated Database Schema (v2.0)
-- Last Updated: 2025-12-05
-- ==========================================

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ==========================================
-- 1. Core Tables (Tenancy & Auth)
-- ==========================================

CREATE TABLE public.shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_name TEXT NOT NULL,
    gst_number TEXT,
    pan_number TEXT,
    address TEXT,
    state TEXT,
    pincode TEXT,
    phone_number TEXT,
    email TEXT,
    logo_url TEXT,
    cgst_rate NUMERIC DEFAULT 1.5,
    sgst_rate NUMERIC DEFAULT 1.5,
    template_id TEXT DEFAULT 'classic',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.user_shop_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, shop_id)
);

CREATE TABLE public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    last_active_shop_id UUID REFERENCES public.shops(id),
    language TEXT DEFAULT 'en',
    theme TEXT DEFAULT 'system',
    notifications_enabled BOOLEAN DEFAULT true,
    currency TEXT DEFAULT 'INR',
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_step INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 2. Customer Management
-- ==========================================

CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    state TEXT,
    pincode TEXT,
    gst_number TEXT,
    loyalty_points INTEGER DEFAULT 0,
    total_spent NUMERIC DEFAULT 0,
    notes TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id),
    UNIQUE(shop_id, phone)
);

-- ==========================================
-- 3. Inventory / Stock
-- ==========================================

CREATE TABLE public.stock_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    name TEXT NOT NULL,
    description TEXT,
    purity TEXT NOT NULL,
    base_price NUMERIC DEFAULT 0,
    making_charge_per_gram NUMERIC DEFAULT 0,
    quantity NUMERIC DEFAULT 0,
    unit TEXT DEFAULT 'grams',
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id)
);

-- ==========================================
-- 4. Invoicing
-- ==========================================

CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    invoice_number TEXT NOT NULL,
    customer_id UUID REFERENCES public.customers(id),
    customer_snapshot JSONB NOT NULL,
    status TEXT CHECK (status IN ('paid', 'due', 'cancelled')) DEFAULT 'due',
    invoice_date DATE DEFAULT CURRENT_DATE,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    cgst_amount NUMERIC DEFAULT 0,
    sgst_amount NUMERIC DEFAULT 0,
    grand_total NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    created_by_name TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id),
    UNIQUE(shop_id, invoice_number)
);

CREATE TABLE public.invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id),
    description TEXT NOT NULL,
    purity TEXT,
    gross_weight NUMERIC DEFAULT 0,
    net_weight NUMERIC DEFAULT 0,
    rate NUMERIC DEFAULT 0,
    making NUMERIC DEFAULT 0,
    amount NUMERIC GENERATED ALWAYS AS ((net_weight * rate) + (net_weight * making)) STORED,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 5. Ledger / Khata
-- ==========================================

CREATE TABLE public.ledger_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    invoice_id UUID REFERENCES public.invoices(id),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('INVOICE', 'PAYMENT', 'ADJUSTMENT')),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    entry_type TEXT NOT NULL CHECK (entry_type IN ('DEBIT', 'CREDIT')),
    description TEXT,
    transaction_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- ==========================================
-- 6. Staff Management
-- ==========================================

CREATE TABLE IF NOT EXISTS public.staff_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    joined_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(shop_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.shop_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('manager', 'staff')),
    invited_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'declined')),
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
    UNIQUE(shop_id, email)
);

CREATE TABLE IF NOT EXISTS public.staff_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    staff_id UUID NOT NULL REFERENCES public.staff_profiles(id),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    payment_type TEXT NOT NULL CHECK (payment_type IN ('salary', 'bonus', 'advance', 'commission')),
    description TEXT,
    payment_date DATE DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    staff_id UUID NOT NULL REFERENCES public.staff_profiles(id),
    date DATE DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'half_day', 'leave')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(staff_id, date)
);

-- ==========================================
-- 7. Market Rates
-- ==========================================

CREATE TABLE IF NOT EXISTS public.market_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gold_24k NUMERIC NOT NULL DEFAULT 0,
    gold_22k NUMERIC NOT NULL DEFAULT 0,
    silver NUMERIC NOT NULL DEFAULT 0,
    source TEXT DEFAULT 'Manual',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 8. Loyalty System
-- ==========================================

CREATE TABLE IF NOT EXISTS public.shop_loyalty_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) UNIQUE,
    is_enabled BOOLEAN DEFAULT false,
    earning_type TEXT CHECK (earning_type IN ('flat', 'percentage')) DEFAULT 'flat',
    flat_points_ratio NUMERIC DEFAULT 0.01,
    percentage_back NUMERIC DEFAULT 1,
    redemption_conversion_rate NUMERIC DEFAULT 1,
    min_redemption_points INTEGER DEFAULT 100,
    max_redemption_percentage NUMERIC DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_loyalty_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    invoice_id UUID REFERENCES public.invoices(id),
    points_change INTEGER NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 9. Row Level Security (RLS)
-- ==========================================

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_shop_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_loyalty_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_loyalty_logs ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 10. Helper Functions
-- ==========================================

CREATE OR REPLACE FUNCTION public.is_shop_member(shop_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_shop_roles
    WHERE user_id = auth.uid()
    AND shop_id = shop_uuid
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_shop_owner(p_shop_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_shop_roles
        WHERE user_id = auth.uid() AND shop_id = p_shop_id AND role = 'owner' AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_shop_admin(p_shop_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_shop_roles
        WHERE user_id = auth.uid() AND shop_id = p_shop_id AND role IN ('owner', 'manager') AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 11. RLS Policies
-- ==========================================

-- Shops
CREATE POLICY "Users can view their shops" ON shops
    FOR SELECT USING (created_by = auth.uid() OR is_shop_member(id));

CREATE POLICY "Users can create shops" ON shops
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- User Shop Roles
CREATE POLICY "View shop roles" ON user_shop_roles
    FOR SELECT USING (user_id = auth.uid() OR is_shop_member(shop_id));

-- Customers
CREATE POLICY "View shop customers" ON customers
    FOR SELECT USING (is_shop_member(shop_id));

CREATE POLICY "Manage shop customers" ON customers
    FOR ALL USING (is_shop_member(shop_id));

-- Stock Items
CREATE POLICY "View shop stock" ON stock_items
    FOR SELECT USING (is_shop_member(shop_id));

CREATE POLICY "Manage shop stock" ON stock_items
    FOR ALL USING (is_shop_member(shop_id));

-- Invoices
CREATE POLICY "View shop invoices" ON invoices
    FOR SELECT USING (is_shop_member(shop_id));

CREATE POLICY "Manage shop invoices" ON invoices
    FOR ALL USING (is_shop_member(shop_id));

-- Invoice Items
CREATE POLICY "View invoice items" ON invoice_items
    FOR SELECT USING (EXISTS (SELECT 1 FROM invoices WHERE id = invoice_items.invoice_id AND is_shop_member(shop_id)));

CREATE POLICY "Manage invoice items" ON invoice_items
    FOR ALL USING (EXISTS (SELECT 1 FROM invoices WHERE id = invoice_items.invoice_id AND is_shop_member(shop_id)));

-- Ledger
CREATE POLICY "View shop ledger" ON ledger_transactions
    FOR SELECT USING (is_shop_member(shop_id));

CREATE POLICY "Manage shop ledger" ON ledger_transactions
    FOR ALL USING (is_shop_member(shop_id));

-- Staff
CREATE POLICY "View shop staff profiles" ON staff_profiles
    FOR SELECT USING (is_shop_member(shop_id));

CREATE POLICY "Manage shop staff profiles" ON staff_profiles
    FOR ALL USING (is_shop_owner(shop_id) OR is_shop_admin(shop_id));

CREATE POLICY "View shop invitations" ON shop_invitations
    FOR SELECT USING (is_shop_member(shop_id));

CREATE POLICY "Manage shop invitations" ON shop_invitations
    FOR ALL USING (is_shop_owner(shop_id));

CREATE POLICY "View shop staff payments" ON staff_payments
    FOR SELECT USING (is_shop_member(shop_id));

CREATE POLICY "Manage shop staff payments" ON staff_payments
    FOR ALL USING (is_shop_owner(shop_id) OR is_shop_admin(shop_id));

CREATE POLICY "View shop staff attendance" ON staff_attendance
    FOR SELECT USING (is_shop_member(shop_id));

CREATE POLICY "Manage shop staff attendance" ON staff_attendance
    FOR ALL USING (is_shop_member(shop_id));

-- Market Rates
CREATE POLICY "Everyone can view market rates" ON market_rates
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can update market rates" ON market_rates
    FOR ALL USING (auth.role() = 'authenticated');

-- Loyalty
CREATE POLICY "View shop loyalty settings" ON shop_loyalty_settings
    FOR SELECT USING (is_shop_member(shop_id));

CREATE POLICY "Manage shop loyalty settings" ON shop_loyalty_settings
    FOR ALL USING (is_shop_admin(shop_id));

CREATE POLICY "View loyalty logs" ON customer_loyalty_logs
    FOR SELECT USING (is_shop_member(shop_id));

CREATE POLICY "Create loyalty logs" ON customer_loyalty_logs
    FOR INSERT WITH CHECK (is_shop_member(shop_id));

-- ==========================================
-- 12. Core Functions
-- ==========================================

-- Generate Invoice Number
CREATE OR REPLACE FUNCTION generate_invoice_number(p_shop_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_count INTEGER;
    v_year TEXT;
BEGIN
    v_year := to_char(current_date, 'YYYY');
    SELECT COALESCE(MAX(CAST(substring(invoice_number from 'INV-' || v_year || '-([0-9]+)') AS INTEGER)), 0)
    INTO v_count
    FROM invoices
    WHERE shop_id = p_shop_id AND invoice_number LIKE 'INV-' || v_year || '-%';
    RETURN 'INV-' || v_year || '-' || LPAD((v_count + 1)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Create Invoice with Items
CREATE OR REPLACE FUNCTION create_invoice_with_items(
    p_shop_id UUID,
    p_customer_id UUID,
    p_customer_snapshot JSONB,
    p_items JSONB,
    p_discount NUMERIC,
    p_notes TEXT,
    p_status TEXT DEFAULT 'due'
)
RETURNS JSONB AS $$
DECLARE
    v_invoice_id UUID;
    v_invoice_number TEXT;
    v_item JSONB;
    v_subtotal NUMERIC := 0;
    v_cgst_rate NUMERIC;
    v_sgst_rate NUMERIC;
    v_cgst_amount NUMERIC;
    v_sgst_amount NUMERIC;
    v_grand_total NUMERIC;
    v_user_id UUID;
    v_user_email TEXT;
BEGIN
    v_user_id := auth.uid();
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
    SELECT cgst_rate, sgst_rate INTO v_cgst_rate, v_sgst_rate FROM shops WHERE id = p_shop_id;
    v_invoice_number := generate_invoice_number(p_shop_id);
    
    INSERT INTO invoices (
        shop_id, invoice_number, customer_id, customer_snapshot, status, 
        discount, notes, created_by_name, created_by
    ) VALUES (
        p_shop_id, v_invoice_number, p_customer_id, p_customer_snapshot, p_status,
        p_discount, p_notes, v_user_email, v_user_id
    ) RETURNING id INTO v_invoice_id;
    
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        INSERT INTO invoice_items (
            invoice_id, description, purity, gross_weight, net_weight, rate, making
        ) VALUES (
            v_invoice_id,
            v_item->>'description',
            v_item->>'purity',
            (v_item->>'grossWeight')::NUMERIC,
            (v_item->>'netWeight')::NUMERIC,
            (v_item->>'rate')::NUMERIC,
            (v_item->>'making')::NUMERIC
        );
        v_subtotal := v_subtotal + 
            ((v_item->>'netWeight')::NUMERIC * (v_item->>'rate')::NUMERIC) + 
            ((v_item->>'netWeight')::NUMERIC * (v_item->>'making')::NUMERIC);
    END LOOP;
    
    v_subtotal := v_subtotal - COALESCE(p_discount, 0);
    v_cgst_amount := v_subtotal * (v_cgst_rate / 100);
    v_sgst_amount := v_subtotal * (v_sgst_rate / 100);
    v_grand_total := v_subtotal + v_cgst_amount + v_sgst_amount;
    
    UPDATE invoices SET 
        subtotal = v_subtotal + COALESCE(p_discount, 0),
        cgst_amount = v_cgst_amount,
        sgst_amount = v_sgst_amount,
        grand_total = v_grand_total
    WHERE id = v_invoice_id;
    
    IF p_status = 'due' AND p_customer_id IS NOT NULL THEN
        INSERT INTO ledger_transactions (
            shop_id, customer_id, invoice_id, transaction_type, amount, entry_type, description, created_by
        ) VALUES (
            p_shop_id, p_customer_id, v_invoice_id, 'INVOICE', v_grand_total, 'DEBIT', 
            'Invoice #' || v_invoice_number, v_user_id
        );
        
        UPDATE customers SET total_spent = total_spent + v_grand_total
        WHERE id = p_customer_id;
    END IF;

    RETURN jsonb_build_object('invoice_id', v_invoice_id, 'invoice_number', v_invoice_number, 'grand_total', v_grand_total);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create New Shop
CREATE OR REPLACE FUNCTION create_new_shop_with_details(
    p_shop_name TEXT,
    p_phone_number TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_state TEXT DEFAULT NULL,
    p_pincode TEXT DEFAULT NULL,
    p_gst_number TEXT DEFAULT NULL,
    p_pan_number TEXT DEFAULT NULL,
    p_logo_url TEXT DEFAULT NULL,
    p_cgst_rate NUMERIC DEFAULT 1.5,
    p_sgst_rate NUMERIC DEFAULT 1.5,
    p_template_id TEXT DEFAULT 'classic'
)
RETURNS UUID AS $$
DECLARE
    v_shop_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    INSERT INTO shops (
        shop_name, phone_number, email, address, state, pincode, 
        gst_number, pan_number, logo_url, cgst_rate, sgst_rate, template_id, created_by
    ) VALUES (
        p_shop_name, p_phone_number, p_email, p_address, p_state, p_pincode,
        p_gst_number, p_pan_number, p_logo_url, p_cgst_rate, p_sgst_rate, p_template_id, v_user_id
    ) RETURNING id INTO v_shop_id;
    
    INSERT INTO user_shop_roles (user_id, shop_id, role)
    VALUES (v_user_id, v_shop_id, 'owner');
    
    INSERT INTO user_preferences (user_id, last_active_shop_id, onboarding_completed)
    VALUES (v_user_id, v_shop_id, true)
    ON CONFLICT (user_id) DO UPDATE SET
        last_active_shop_id = v_shop_id,
        onboarding_completed = true;
        
    RETURN v_shop_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Customer
CREATE OR REPLACE FUNCTION create_customer(
    p_shop_id UUID,
    p_name TEXT,
    p_phone TEXT,
    p_email TEXT,
    p_address TEXT,
    p_state TEXT,
    p_pincode TEXT,
    p_gst_number TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_customer_id UUID;
BEGIN
    INSERT INTO customers (
        shop_id, name, phone, email, address, state, pincode, gst_number
    ) VALUES (
        p_shop_id, p_name, p_phone, p_email, p_address, p_state, p_pincode, p_gst_number
    ) RETURNING id INTO v_customer_id;
    RETURN jsonb_build_object('id', v_customer_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Stock Item
CREATE OR REPLACE FUNCTION create_stock_item(
    p_shop_id UUID,
    p_name TEXT,
    p_description TEXT,
    p_purity TEXT,
    p_base_price NUMERIC,
    p_making_charge NUMERIC,
    p_quantity NUMERIC,
    p_unit TEXT,
    p_category TEXT,
    p_is_active BOOLEAN
)
RETURNS JSONB AS $$
DECLARE
    v_item_id UUID;
BEGIN
    INSERT INTO stock_items (
        shop_id, name, description, purity, base_price, making_charge_per_gram, 
        quantity, unit, category, is_active
    ) VALUES (
        p_shop_id, p_name, p_description, p_purity, p_base_price, p_making_charge,
        p_quantity, p_unit, p_category, p_is_active
    ) RETURNING id INTO v_item_id;
    RETURN jsonb_build_object('id', v_item_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add Ledger Transaction
CREATE OR REPLACE FUNCTION add_ledger_transaction(
    p_shop_id UUID,
    p_customer_id UUID,
    p_transaction_type TEXT,
    p_amount NUMERIC,
    p_entry_type TEXT,
    p_description TEXT,
    p_date DATE
)
RETURNS JSONB AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO ledger_transactions (
        shop_id, customer_id, transaction_type, amount, entry_type, description, transaction_date, created_by
    ) VALUES (
        p_shop_id, p_customer_id, p_transaction_type, p_amount, p_entry_type, p_description, p_date, auth.uid()
    ) RETURNING id INTO v_id;
    RETURN jsonb_build_object('id', v_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dashboard Stats
CREATE OR REPLACE FUNCTION get_dashboard_stats(
    p_shop_id UUID,
    p_month_start TIMESTAMPTZ,
    p_month_end TIMESTAMPTZ,
    p_week_start TIMESTAMPTZ,
    p_today_start TIMESTAMPTZ,
    p_last_month_start TIMESTAMPTZ,
    p_last_month_end TIMESTAMPTZ
)
RETURNS JSONB AS $$
DECLARE
    v_total_paid_this_month NUMERIC;
    v_total_paid_this_week NUMERIC;
    v_total_paid_today NUMERIC;
    v_total_paid_last_month NUMERIC;
    v_revenue_mom NUMERIC;
    v_recent_invoices JSONB;
    v_due_invoices JSONB;
BEGIN
    SELECT COALESCE(SUM(grand_total), 0) INTO v_total_paid_this_month
    FROM invoices WHERE shop_id = p_shop_id AND status = 'paid' AND invoice_date BETWEEN p_month_start::DATE AND p_month_end::DATE;

    SELECT COALESCE(SUM(grand_total), 0) INTO v_total_paid_this_week
    FROM invoices WHERE shop_id = p_shop_id AND status = 'paid' AND invoice_date >= p_week_start::DATE;

    SELECT COALESCE(SUM(grand_total), 0) INTO v_total_paid_today
    FROM invoices WHERE shop_id = p_shop_id AND status = 'paid' AND invoice_date >= p_today_start::DATE;

    SELECT COALESCE(SUM(grand_total), 0) INTO v_total_paid_last_month
    FROM invoices WHERE shop_id = p_shop_id AND status = 'paid' AND invoice_date BETWEEN p_last_month_start::DATE AND p_last_month_end::DATE;

    IF v_total_paid_last_month = 0 THEN
        v_revenue_mom := CASE WHEN v_total_paid_this_month > 0 THEN 100 ELSE 0 END;
    ELSE
        v_revenue_mom := ((v_total_paid_this_month - v_total_paid_last_month) / v_total_paid_last_month) * 100;
    END IF;

    SELECT jsonb_agg(t) INTO v_recent_invoices FROM (
        SELECT i.id, i.invoice_number, i.grand_total, i.status, i.invoice_date, i.created_at,
               c.name as customer_name, c.phone as customer_phone
        FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id
        WHERE i.shop_id = p_shop_id ORDER BY i.created_at DESC LIMIT 10
    ) t;

    SELECT jsonb_agg(t) INTO v_due_invoices FROM (
        SELECT i.id, i.invoice_number, i.grand_total, i.status, i.invoice_date as due_date,
               c.name as customer_name, c.phone as customer_phone
        FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id
        WHERE i.shop_id = p_shop_id AND i.status = 'due' ORDER BY i.invoice_date ASC
    ) t;

    RETURN jsonb_build_object(
        'totalPaidThisMonth', v_total_paid_this_month,
        'totalPaidThisWeek', v_total_paid_this_week,
        'totalPaidToday', v_total_paid_today,
        'revenueMoM', v_revenue_mom,
        'recentInvoices', COALESCE(v_recent_invoices, '[]'::jsonb),
        'dueInvoices', COALESCE(v_due_invoices, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 13. Performance Indexes
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_shops_created_by ON shops(created_by);
CREATE INDEX IF NOT EXISTS idx_user_shop_roles_user_id ON user_shop_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_shop_roles_shop_id ON user_shop_roles(shop_id);
CREATE INDEX IF NOT EXISTS idx_user_shop_roles_user_shop ON user_shop_roles(user_id, shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_shop_id ON customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON customers USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_stock_items_shop_id ON stock_items(shop_id);
CREATE INDEX IF NOT EXISTS idx_invoices_shop_id ON invoices(shop_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_ledger_shop_id ON ledger_transactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_ledger_customer_id ON ledger_transactions(customer_id);

-- ==========================================
-- 14. Initial Data
-- ==========================================

INSERT INTO public.market_rates (gold_24k, gold_22k, silver, source)
VALUES (72000, 68000, 85000, 'Initial Seed')
ON CONFLICT DO NOTHING;
