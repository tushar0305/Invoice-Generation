-- Enable UUID extension
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
-- 2. Customer Management (Unified)
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
    -- Ensure phone uniqueness per shop if provided
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
-- 4. Invoicing (Normalized)
-- ==========================================

CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    invoice_number TEXT NOT NULL,
    customer_id UUID REFERENCES public.customers(id),
    customer_snapshot JSONB NOT NULL, -- Snapshot of customer details at time of invoice
    status TEXT CHECK (status IN ('paid', 'due', 'cancelled')) DEFAULT 'due',
    invoice_date DATE DEFAULT CURRENT_DATE,
    
    -- Financials
    subtotal NUMERIC NOT NULL DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    cgst_amount NUMERIC DEFAULT 0,
    sgst_amount NUMERIC DEFAULT 0,
    grand_total NUMERIC NOT NULL DEFAULT 0,
    
    -- Meta
    notes TEXT,
    created_by_name TEXT,
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
-- 5. Ledger / Khata (Unified)
-- ==========================================

CREATE TABLE public.ledger_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    invoice_id UUID REFERENCES public.invoices(id),
    
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('INVOICE', 'PAYMENT', 'ADJUSTMENT')),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    entry_type TEXT NOT NULL CHECK (entry_type IN ('DEBIT', 'CREDIT')), -- DEBIT: Customer owes more, CREDIT: Customer pays
    
    description TEXT,
    transaction_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- ==========================================
-- 6. Staff Management Tables
-- ==========================================

-- Staff Profiles (Links Auth User to Shop Staff context)
CREATE TABLE IF NOT EXISTS public.staff_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    joined_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(shop_id, user_id)
);

-- Shop Invitations
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

-- Staff Payments
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

-- Staff Attendance
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
-- 7. Row Level Security (RLS)
-- ==========================================

-- Enable RLS
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

-- Helper Function to check shop membership
DROP FUNCTION IF EXISTS public.is_shop_member(uuid) CASCADE;
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

-- Helper: Is Shop Owner
DROP FUNCTION IF EXISTS public.is_shop_owner(uuid) CASCADE;
CREATE OR REPLACE FUNCTION is_shop_owner(p_shop_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_shop_roles
        WHERE user_id = auth.uid() AND shop_id = p_shop_id AND role = 'owner' AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: Is Shop Admin (Owner or Manager)
DROP FUNCTION IF EXISTS public.is_shop_admin(uuid) CASCADE;
CREATE OR REPLACE FUNCTION is_shop_admin(p_shop_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_shop_roles
        WHERE user_id = auth.uid() AND shop_id = p_shop_id AND role IN ('owner', 'manager') AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies

-- Shops: Users can view shops they belong to
CREATE POLICY "Users can view their shops" ON shops
    FOR SELECT USING (
        created_by = auth.uid() OR 
        EXISTS (SELECT 1 FROM user_shop_roles WHERE user_id = auth.uid() AND shop_id = shops.id)
    );

CREATE POLICY "Users can create shops" ON shops
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- User Shop Roles: Users can view roles for their shops
CREATE POLICY "View shop roles" ON user_shop_roles
    FOR SELECT USING (
        user_id = auth.uid() OR 
        shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = auth.uid())
    );

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

-- Invoice Items (Cascade from Invoice)
CREATE POLICY "View invoice items" ON invoice_items
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM invoices WHERE id = invoice_items.invoice_id AND is_shop_member(shop_id))
    );

CREATE POLICY "Manage invoice items" ON invoice_items
    FOR ALL USING (
        EXISTS (SELECT 1 FROM invoices WHERE id = invoice_items.invoice_id AND is_shop_member(shop_id))
    );

-- Ledger
CREATE POLICY "View shop ledger" ON ledger_transactions
    FOR SELECT USING (is_shop_member(shop_id));

CREATE POLICY "Manage shop ledger" ON ledger_transactions
    FOR ALL USING (is_shop_member(shop_id));

-- Staff Profiles
CREATE POLICY "View shop staff profiles" ON staff_profiles
    FOR SELECT USING (is_shop_member(shop_id));

CREATE POLICY "Manage shop staff profiles" ON staff_profiles
    FOR ALL USING (is_shop_owner(shop_id) OR is_shop_admin(shop_id));

-- Shop Invitations
CREATE POLICY "View shop invitations" ON shop_invitations
    FOR SELECT USING (is_shop_member(shop_id));

CREATE POLICY "Manage shop invitations" ON shop_invitations
    FOR ALL USING (is_shop_owner(shop_id));

-- Staff Payments
CREATE POLICY "View shop staff payments" ON staff_payments
    FOR SELECT USING (is_shop_member(shop_id));

CREATE POLICY "Manage shop staff payments" ON staff_payments
    FOR ALL USING (is_shop_owner(shop_id) OR is_shop_admin(shop_id));

-- Staff Attendance
CREATE POLICY "View shop staff attendance" ON staff_attendance
    FOR SELECT USING (is_shop_member(shop_id));

CREATE POLICY "Manage shop staff attendance" ON staff_attendance
    FOR ALL USING (is_shop_member(shop_id));

-- ==========================================
-- 8. Functions & Triggers
-- ==========================================

-- Drop existing/deprecated functions to ensure a clean slate
DROP FUNCTION IF EXISTS add_khata_transaction(uuid, uuid, text, numeric, text, date, uuid);
DROP FUNCTION IF EXISTS add_loan_payment(uuid, numeric, text, text, text, uuid);
DROP FUNCTION IF EXISTS close_loan(uuid, numeric, text, uuid);
DROP FUNCTION IF EXISTS complete_onboarding(uuid);
DROP FUNCTION IF EXISTS create_customer(uuid, text, text, text, text, text, text, text, uuid);
DROP FUNCTION IF EXISTS create_new_shop(text);
DROP FUNCTION IF EXISTS create_new_shop_with_details(text, text, text, text, text, text, text, text, text, numeric, numeric, text);
DROP FUNCTION IF EXISTS create_stock_item(uuid, uuid, text, text, text, numeric, numeric, numeric, numeric, text, text, boolean);
DROP FUNCTION IF EXISTS delete_khata_transaction(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS delete_stock_item(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS fn_calculate_invoice_totals();
DROP FUNCTION IF EXISTS generate_random_code();
DROP FUNCTION IF EXISTS get_dashboard_stats(uuid, timestamptz, timestamptz, timestamptz, timestamptz, timestamptz, timestamptz);
DROP FUNCTION IF EXISTS get_user_role(uuid, uuid);
DROP FUNCTION IF EXISTS get_user_shop_role(uuid);
DROP FUNCTION IF EXISTS get_user_shops();
-- is_shop_admin and is_shop_owner drops removed as they are handled in Section 7
DROP FUNCTION IF EXISTS is_shop_staff(uuid);
DROP FUNCTION IF EXISTS remove_staff_member(uuid);
DROP FUNCTION IF EXISTS restore_khata_transaction(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS restore_stock_item(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS update_customer(uuid, uuid, text, text, text, text, text, text, text, uuid);
DROP FUNCTION IF EXISTS update_khata_customer(uuid, uuid, text, text, text, uuid);
DROP FUNCTION IF EXISTS update_onboarding_step(integer);
DROP FUNCTION IF EXISTS update_stock_item(uuid, uuid, text, text, text, numeric, numeric, numeric, numeric, text, text, boolean, uuid);
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS user_has_shop_access(uuid);
DROP FUNCTION IF EXISTS user_is_shop_owner(uuid);
DROP FUNCTION IF EXISTS user_owns_invoice(uuid);
DROP FUNCTION IF EXISTS user_settings_insert();
DROP FUNCTION IF EXISTS user_settings_update();

-- Function to generate next invoice number
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

-- Function to create invoice with items (Transactional)
CREATE OR REPLACE FUNCTION create_invoice_with_items(
    p_shop_id UUID,
    p_customer_id UUID,
    p_customer_snapshot JSONB,
    p_items JSONB, -- Array of objects
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
    
    -- Get Shop Rates
    SELECT cgst_rate, sgst_rate INTO v_cgst_rate, v_sgst_rate FROM shops WHERE id = p_shop_id;
    
    -- Generate Invoice Number
    v_invoice_number := generate_invoice_number(p_shop_id);
    
    -- Insert Invoice Header
    INSERT INTO invoices (
        shop_id, invoice_number, customer_id, customer_snapshot, status, 
        discount, notes, created_by_name, deleted_by
    ) VALUES (
        p_shop_id, v_invoice_number, p_customer_id, p_customer_snapshot, p_status,
        p_discount, p_notes, v_user_email, v_user_id
    ) RETURNING id INTO v_invoice_id;
    
    -- Process Items
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
        
        -- Calculate Subtotal (Net Weight * Rate + Net Weight * Making)
        v_subtotal := v_subtotal + 
            ((v_item->>'netWeight')::NUMERIC * (v_item->>'rate')::NUMERIC) + 
            ((v_item->>'netWeight')::NUMERIC * (v_item->>'making')::NUMERIC);
            
        -- TODO: Deduct Stock if needed
    END LOOP;
    
    -- Calculate Totals
    v_subtotal := v_subtotal - COALESCE(p_discount, 0);
    v_cgst_amount := v_subtotal * (v_cgst_rate / 100);
    v_sgst_amount := v_subtotal * (v_sgst_rate / 100);
    v_grand_total := v_subtotal + v_cgst_amount + v_sgst_amount;
    
    -- Update Invoice with Totals
    UPDATE invoices SET 
        subtotal = v_subtotal + COALESCE(p_discount, 0), -- Store original subtotal before discount
        cgst_amount = v_cgst_amount,
        sgst_amount = v_sgst_amount,
        grand_total = v_grand_total
    WHERE id = v_invoice_id;
    
    -- Add Ledger Entry if 'due'
    IF p_status = 'due' AND p_customer_id IS NOT NULL THEN
        INSERT INTO ledger_transactions (
            shop_id, customer_id, invoice_id, transaction_type, amount, entry_type, description, created_by
        ) VALUES (
            p_shop_id, p_customer_id, v_invoice_id, 'INVOICE', v_grand_total, 'DEBIT', 
            'Invoice #' || v_invoice_number, v_user_id
        );
        
        -- Update Customer Total Spent & Balance
        UPDATE customers SET 
            total_spent = total_spent + v_grand_total
        WHERE id = p_customer_id;
    END IF;

    RETURN jsonb_build_object('id', v_invoice_id, 'invoice_number', v_invoice_number);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Create New Shop with Details
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
    
    -- Create Shop
    INSERT INTO shops (
        shop_name, phone_number, email, address, state, pincode, 
        gst_number, pan_number, logo_url, cgst_rate, sgst_rate, template_id, created_by
    ) VALUES (
        p_shop_name, p_phone_number, p_email, p_address, p_state, p_pincode,
        p_gst_number, p_pan_number, p_logo_url, p_cgst_rate, p_sgst_rate, p_template_id, v_user_id
    ) RETURNING id INTO v_shop_id;
    
    -- Assign Owner Role
    INSERT INTO user_shop_roles (user_id, shop_id, role)
    VALUES (v_user_id, v_shop_id, 'owner');
    
    -- Update User Preferences
    INSERT INTO user_preferences (user_id, last_active_shop_id, onboarding_completed)
    VALUES (v_user_id, v_shop_id, true)
    ON CONFLICT (user_id) DO UPDATE SET
        last_active_shop_id = v_shop_id,
        onboarding_completed = true;
        
    RETURN v_shop_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Customer
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

-- 3. Update Customer
CREATE OR REPLACE FUNCTION update_customer(
    p_customer_id UUID,
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
BEGIN
    UPDATE customers SET
        name = p_name,
        phone = p_phone,
        email = p_email,
        address = p_address,
        state = p_state,
        pincode = p_pincode,
        gst_number = p_gst_number,
        updated_at = now()
    WHERE id = p_customer_id AND shop_id = p_shop_id;
    
    RETURN jsonb_build_object('id', p_customer_id, 'success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create Stock Item
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

-- 5. Update Stock Item
CREATE OR REPLACE FUNCTION update_stock_item(
    p_item_id UUID,
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
BEGIN
    UPDATE stock_items SET
        name = p_name,
        description = p_description,
        purity = p_purity,
        base_price = p_base_price,
        making_charge_per_gram = p_making_charge,
        quantity = p_quantity,
        unit = p_unit,
        category = p_category,
        is_active = p_is_active,
        updated_at = now()
    WHERE id = p_item_id AND shop_id = p_shop_id;
    
    RETURN jsonb_build_object('id', p_item_id, 'success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Delete Stock Item (Soft Delete)
CREATE OR REPLACE FUNCTION delete_stock_item(
    p_item_id UUID,
    p_shop_id UUID
)
RETURNS JSONB AS $$
BEGIN
    UPDATE stock_items SET
        deleted_at = now(),
        deleted_by = auth.uid()
    WHERE id = p_item_id AND shop_id = p_shop_id;
    
    RETURN jsonb_build_object('id', p_item_id, 'success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Add Ledger Transaction (Replaces Khata)
CREATE OR REPLACE FUNCTION add_ledger_transaction(
    p_shop_id UUID,
    p_customer_id UUID,
    p_transaction_type TEXT, -- 'PAYMENT', 'ADJUSTMENT'
    p_amount NUMERIC,
    p_entry_type TEXT, -- 'DEBIT', 'CREDIT'
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

-- 8. Delete Ledger Transaction
CREATE OR REPLACE FUNCTION delete_ledger_transaction(
    p_transaction_id UUID,
    p_shop_id UUID
)
RETURNS JSONB AS $$
BEGIN
    DELETE FROM ledger_transactions
    WHERE id = p_transaction_id AND shop_id = p_shop_id;
    
    RETURN jsonb_build_object('id', p_transaction_id, 'success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Get Dashboard Stats
CREATE OR REPLACE FUNCTION get_dashboard_stats(
    p_shop_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS JSONB AS $$
DECLARE
    v_total_revenue NUMERIC;
    v_total_due NUMERIC;
    v_invoice_count INTEGER;
    v_new_customers INTEGER;
    v_low_stock_count INTEGER;
BEGIN
    -- Revenue (Paid Invoices)
    SELECT COALESCE(SUM(grand_total), 0), COUNT(*)
    INTO v_total_revenue, v_invoice_count
    FROM invoices
    WHERE shop_id = p_shop_id 
    AND status = 'paid'
    AND created_at BETWEEN p_start_date AND p_end_date;
    
    -- Due Amount
    SELECT COALESCE(SUM(grand_total), 0)
    INTO v_total_due
    FROM invoices
    WHERE shop_id = p_shop_id 
    AND status = 'due';
    
    -- New Customers
    SELECT COUNT(*)
    INTO v_new_customers
    FROM customers
    WHERE shop_id = p_shop_id
    AND created_at BETWEEN p_start_date AND p_end_date;
    
    -- Low Stock
    SELECT COUNT(*)
    INTO v_low_stock_count
    FROM stock_items
    WHERE shop_id = p_shop_id
    AND quantity < 3
    AND deleted_at IS NULL;
    
    RETURN jsonb_build_object(
        'total_revenue', v_total_revenue,
        'total_due', v_total_due,
        'invoice_count', v_invoice_count,
        'new_customers', v_new_customers,
        'low_stock_count', v_low_stock_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Helper: Get User Shop Role
CREATE OR REPLACE FUNCTION get_user_shop_role(p_shop_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role
    FROM user_shop_roles
    WHERE user_id = auth.uid() AND shop_id = p_shop_id AND is_active = true;
    
    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 9. Performance Indexes
-- ==========================================

-- Shops
CREATE INDEX IF NOT EXISTS idx_shops_created_by ON shops(created_by);

-- User Shop Roles
CREATE INDEX IF NOT EXISTS idx_user_shop_roles_user_id ON user_shop_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_shop_roles_shop_id ON user_shop_roles(shop_id);
CREATE INDEX IF NOT EXISTS idx_user_shop_roles_user_shop ON user_shop_roles(user_id, shop_id);

-- User Preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Customers
CREATE INDEX IF NOT EXISTS idx_customers_shop_id ON customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON customers USING gin (name gin_trgm_ops);

-- Stock Items
CREATE INDEX IF NOT EXISTS idx_stock_items_shop_id ON stock_items(shop_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_category ON stock_items(category);
CREATE INDEX IF NOT EXISTS idx_stock_items_name_trgm ON stock_items USING gin (name gin_trgm_ops);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_shop_id ON invoices(shop_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);

-- Invoice Items
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Ledger Transactions
CREATE INDEX IF NOT EXISTS idx_ledger_shop_id ON ledger_transactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_ledger_customer_id ON ledger_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_ledger_invoice_id ON ledger_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_ledger_date ON ledger_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_ledger_type ON ledger_transactions(transaction_type);

-- Staff Tables Indexes
CREATE INDEX IF NOT EXISTS idx_staff_profiles_shop_user ON staff_profiles(shop_id, user_id);
CREATE INDEX IF NOT EXISTS idx_shop_invitations_email ON shop_invitations(email);
CREATE INDEX IF NOT EXISTS idx_staff_payments_staff_id ON staff_payments(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_staff_date ON staff_attendance(staff_id, date);
