-- ==========================================
-- Migration 0001: Consolidated Schema
-- Description: Core Tables, Enums, and Constraints
-- ==========================================

-- 1. EXTENSIONS
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA extensions;

GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- 2. ENUMS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
        CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'unpaid', 'trialing');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN
        CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'enterprise');
    END IF;
END$$;

-- 3. CORE TABLES

-- Shops
CREATE TABLE IF NOT EXISTS public.shops (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    shop_name TEXT NOT NULL,
    gst_number TEXT,
    pan_number TEXT,
    address TEXT,
    state TEXT,
    pincode TEXT,
    phone_number TEXT,
    email TEXT,
    logo_url TEXT,
    cgst_rate NUMERIC(10,3) DEFAULT 1.5,
    sgst_rate NUMERIC(10,3) DEFAULT 1.5,
    template_id TEXT DEFAULT 'classic',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- User Shop Roles
CREATE TABLE IF NOT EXISTS public.user_shop_roles (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, shop_id)
);

-- User Preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
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

-- 4. CUSTOMERS & INVOICING

CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    state TEXT,
    pincode TEXT,
    gst_number TEXT,
    loyalty_points INTEGER DEFAULT 0,
    total_spent NUMERIC(15,2) DEFAULT 0,
    notes TEXT,
    tags TEXT[],
    search_vector tsvector,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id),
    UNIQUE(shop_id, phone)
);

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    invoice_number TEXT NOT NULL,
    customer_id UUID REFERENCES public.customers(id),
    customer_snapshot JSONB NOT NULL,
    status TEXT CHECK (status IN ('paid', 'due', 'cancelled')) DEFAULT 'due',
    invoice_date DATE DEFAULT CURRENT_DATE,
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount NUMERIC(15,2) DEFAULT 0,
    cgst_amount NUMERIC(15,2) DEFAULT 0,
    sgst_amount NUMERIC(15,2) DEFAULT 0,
    grand_total NUMERIC(15,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_by_name TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id),
    UNIQUE(shop_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id),
    description TEXT NOT NULL,
    purity TEXT,
    gross_weight NUMERIC(10,3) DEFAULT 0,
    net_weight NUMERIC(10,3) DEFAULT 0,
    rate NUMERIC(15,2) DEFAULT 0,
    making NUMERIC(15,2) DEFAULT 0,
    hsn_code TEXT,
    tag_id TEXT,
    stock_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
    amount NUMERIC GENERATED ALWAYS AS ((net_weight * rate) + (net_weight * making)) STORED,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. INVENTORY (New Unit Based)

CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id TEXT UNIQUE NOT NULL,
  
  -- ensure location column exists (fix for legacy implementations)
  location TEXT DEFAULT 'SHOWCASE',

  qr_data TEXT,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  metal_type TEXT NOT NULL,
  purity TEXT NOT NULL,
  category TEXT,
  subcategory TEXT,
  hsn_code TEXT,
  gross_weight DECIMAL(10,3) NOT NULL,
  net_weight DECIMAL(10,3) NOT NULL,
  stone_weight DECIMAL(10,3) DEFAULT 0,
  wastage_percent DECIMAL(5,2) DEFAULT 0,
  making_charge_type TEXT DEFAULT 'PER_GRAM' CHECK (making_charge_type IN ('PER_GRAM', 'FIXED', 'PERCENT')),
  making_charge_value DECIMAL(10,2) DEFAULT 0,
  stone_value DECIMAL(10,2) DEFAULT 0,
  purchase_cost DECIMAL(10,2),
  selling_price DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'IN_STOCK' CHECK (status IN ('IN_STOCK', 'RESERVED', 'SOLD', 'EXCHANGED', 'LOANED', 'MELTED', 'DAMAGED')),
  location TEXT DEFAULT 'SHOWCASE',
  reserved_for_customer_id UUID REFERENCES customers(id),
  reserved_until TIMESTAMPTZ,
  source_type TEXT NOT NULL DEFAULT 'VENDOR_PURCHASE' CHECK (source_type IN ('VENDOR_PURCHASE', 'CUSTOMER_EXCHANGE', 'MELT_REMAKE', 'GIFT_RECEIVED')),
  source_notes TEXT,
  vendor_name TEXT,
  sold_invoice_id UUID REFERENCES invoices(id),
  sold_at TIMESTAMPTZ,
  images JSONB DEFAULT '[]'::jsonb,
  certification_info JSONB,
  name TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS inventory_tag_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  metal_type TEXT NOT NULL,
  last_sequence INTEGER DEFAULT 0,
  UNIQUE(shop_id, metal_type)
);

CREATE TABLE IF NOT EXISTS inventory_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  old_location TEXT,
  new_location TEXT,
  reason TEXT,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Old Stock Table (Deprecated)
CREATE TABLE IF NOT EXISTS public.stock_items (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    name TEXT NOT NULL,
    description TEXT,
    purity TEXT NOT NULL,
    base_price NUMERIC(15,2) DEFAULT 0,
    making_charge_per_gram NUMERIC(15,2) DEFAULT 0,
    quantity NUMERIC(10,3) DEFAULT 0,
    unit TEXT DEFAULT 'grams',
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id)
);

-- 6. LEDGER
CREATE TABLE IF NOT EXISTS public.ledger_transactions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    invoice_id UUID REFERENCES public.invoices(id),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('INVOICE', 'PAYMENT', 'ADJUSTMENT')),
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    entry_type TEXT NOT NULL CHECK (entry_type IN ('DEBIT', 'CREDIT')),
    description TEXT,
    transaction_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- 7. STAFF
CREATE TABLE IF NOT EXISTS public.staff_profiles (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name TEXT,
    joined_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(shop_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.shop_invitations (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
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
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    staff_id UUID NOT NULL REFERENCES public.staff_profiles(id),
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    payment_type TEXT NOT NULL CHECK (payment_type IN ('salary', 'bonus', 'advance', 'commission')),
    description TEXT,
    payment_date DATE DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_attendance (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    staff_id UUID NOT NULL REFERENCES public.staff_profiles(id),
    date DATE DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'half_day', 'leave')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(staff_id, date)
);

-- 8. MARKET RATES
CREATE TABLE IF NOT EXISTS public.market_rates (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    gold_24k NUMERIC(15,2) NOT NULL DEFAULT 0,
    gold_22k NUMERIC(15,2) NOT NULL DEFAULT 0,
    silver NUMERIC(15,2) NOT NULL DEFAULT 0,
    source TEXT DEFAULT 'Manual',
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. OTHER MODULES (Loyalty, Catalogue, WhatsApp, Loans, Subscriptions, Audit)
-- (Truncated for clean separation, but assume full schema is here)
-- Including tables: shop_loyalty_settings, customer_loyalty_logs, catalogue_settings, catalogue_analytics, catalogue_categories, catalogue_products
-- whatsapp_configs, whatsapp_templates, whatsapp_messages
-- loan_customers, loans, loan_collateral, loan_payments
-- subscriptions, audit_logs

-- [Placeholder for these tables - reusing same structure as provided in consolidated_schema.sql]

CREATE TABLE IF NOT EXISTS public.shop_loyalty_settings (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) UNIQUE,
    is_enabled BOOLEAN DEFAULT false,
    earning_type TEXT CHECK (earning_type IN ('flat', 'percentage')) DEFAULT 'flat',
    flat_points_ratio NUMERIC(10,4) DEFAULT 0.01,
    percentage_back NUMERIC(5,2) DEFAULT 1,
    redemption_conversion_rate NUMERIC(10,4) DEFAULT 1,
    min_redemption_points INTEGER DEFAULT 100,
    max_redemption_percentage NUMERIC(5,2) DEFAULT 50,
    redemption_enabled BOOLEAN DEFAULT FALSE,
    min_points_required INTEGER DEFAULT 0,
    earn_on_discounted_items BOOLEAN DEFAULT TRUE,
    earn_on_full_payment_only BOOLEAN DEFAULT FALSE,
    points_validity_days INTEGER DEFAULT 365,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_loyalty_logs (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    invoice_id UUID REFERENCES public.invoices(id),
    points_change INTEGER NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    shop_id uuid REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    user_agent text,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Catalogue Tables
CREATE TABLE IF NOT EXISTS public.catalogue_settings (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    public_slug TEXT NOT NULL,
    shop_display_name TEXT NOT NULL,
    about_text TEXT,
    logo_url TEXT,
    banner_url TEXT,
    primary_color TEXT DEFAULT '#D4AF37',
    is_active BOOLEAN DEFAULT false,
    contact_phone TEXT,
    contact_address TEXT,
    show_prices BOOLEAN DEFAULT true,
    template_id TEXT DEFAULT 'basic',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(shop_id),
    UNIQUE(public_slug)
);

CREATE TABLE IF NOT EXISTS public.catalogue_analytics (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    view_type TEXT CHECK (view_type IN ('page_view', 'product_view', 'whatsapp_click')),
    product_id UUID,
    visitor_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.catalogue_categories (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(shop_id, slug)
);

CREATE TABLE IF NOT EXISTS public.catalogue_products (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    category_id UUID REFERENCES public.catalogue_categories(id),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(15,2) DEFAULT 0,
    weight_g NUMERIC(10,3),
    purity TEXT,
    images TEXT[],
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Whatsapp Tables
CREATE TABLE IF NOT EXISTS public.whatsapp_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    waba_id TEXT NOT NULL,
    phone_number_id TEXT NOT NULL,
    access_token_encrypted TEXT NOT NULL,
    display_name TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'error')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(shop_id)
);

CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'MARKETING' CHECK (category IN ('MARKETING', 'UTILITY', 'AUTHENTICATION')),
    language TEXT DEFAULT 'en',
    body TEXT NOT NULL,
    header_text TEXT,
    footer TEXT,
    buttons JSONB,
    meta_template_id TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(shop_id, name)
);

CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    template_id UUID REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
    phone_number TEXT NOT NULL,
    variables JSONB,
    meta_message_id TEXT,
    status TEXT DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'failed')),
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT now()
);


-- Loans Tables
CREATE TABLE IF NOT EXISTS public.loan_customers (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    shop_id uuid REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    phone text,
    email text,
    address text,
    photo_url text,
    kyc_document_url text,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.loans (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    shop_id uuid REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
    customer_id uuid REFERENCES loan_customers(id) ON DELETE CASCADE NOT NULL,
    loan_number text NOT NULL,
    status text NOT NULL CHECK (status IN ('active', 'closed', 'overdue', 'rejected')),
    principal_amount numeric(15,2) NOT NULL CHECK (principal_amount >= 0),
    interest_rate numeric(5,2) NOT NULL CHECK (interest_rate >= 0),
    start_date date NOT NULL DEFAULT CURRENT_DATE,
    end_date date,
    total_interest_accrued numeric(15,2) DEFAULT 0,
    total_amount_paid numeric(15,2) DEFAULT 0,
    settlement_amount numeric(15,2),
    settlement_notes text,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.loan_collateral (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    loan_id uuid REFERENCES loans(id) ON DELETE CASCADE NOT NULL,
    item_name text NOT NULL,
    item_type text NOT NULL CHECK (item_type IN ('gold', 'silver', 'diamond', 'other')),
    gross_weight numeric(10,3) NOT NULL DEFAULT 0,
    net_weight numeric(10,3) NOT NULL DEFAULT 0,
    purity text,
    estimated_value numeric(15,2),
    description text,
    photo_urls text[],
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.loan_payments (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    loan_id uuid REFERENCES loans(id) ON DELETE CASCADE NOT NULL,
    payment_date date NOT NULL DEFAULT CURRENT_DATE,
    amount numeric(15,2) NOT NULL CHECK (amount > 0),
    payment_type text NOT NULL CHECK (payment_type IN ('principal', 'interest', 'full_settlement')),
    payment_method text NOT NULL CHECK (payment_method IN ('cash', 'upi', 'bank_transfer')),
    notes text,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    shop_id uuid REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
    razorpay_subscription_id text UNIQUE,
    razorpay_customer_id text,
    razorpay_plan_id text,
    plan_id subscription_plan NOT NULL DEFAULT 'free',\
    status subscription_status NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end boolean DEFAULT false,
    billing_cycle_anchor TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 10. GOLD SCHEMES

CREATE TABLE IF NOT EXISTS public.schemes (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    scheme_type TEXT NOT NULL CHECK (scheme_type IN ('FIXED_DURATION', 'FLEXIBLE')), 
    duration_months INTEGER NOT NULL CHECK (duration_months > 0),
    installment_amount NUMERIC(15,2) DEFAULT 0, -- For fixed plans
    bonus_months NUMERIC(5,2) DEFAULT 0, -- e.g. 1 month bonus
    interest_rate NUMERIC(5,2) DEFAULT 0, -- For flexible plans
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_schemes (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    scheme_id UUID NOT NULL REFERENCES public.schemes(id),
    
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'MATURED', 'CLOSED', 'CANCELLED')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    maturity_date DATE,
    
    total_installments_paid INTEGER DEFAULT 0,
    total_amount_collected NUMERIC(15,2) DEFAULT 0,
    
    closed_at TIMESTAMPTZ,
    closed_by UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(customer_id, scheme_id, start_date)
);

CREATE TABLE IF NOT EXISTS public.scheme_payments (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    customer_scheme_id UUID NOT NULL REFERENCES public.customer_schemes(id) ON DELETE CASCADE,
    
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_mode TEXT NOT NULL CHECK (payment_mode IN ('CASH', 'UPI', 'CARD', 'BANK_TRANSFER')),
    transaction_ref TEXT,
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);
