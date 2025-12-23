-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ENUMS
CREATE TYPE public.subscription_plan AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE public.subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid', 'paused');
CREATE TYPE public.user_role AS ENUM ('owner', 'manager', 'staff');

-- 1. SHOPS & AUTH
CREATE TABLE public.shops (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    shop_name text NOT NULL,
    gst_number text,
    pan_number text,
    address text,
    state text,
    pincode text,
    phone_number text,
    email text,
    logo_url text,
    cgst_rate numeric DEFAULT 1.5,
    sgst_rate numeric DEFAULT 1.5,
    template_id text DEFAULT 'classic',
    is_active boolean DEFAULT true,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT shops_pkey PRIMARY KEY (id)
);

CREATE TABLE public.user_shop_roles (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id),
    shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    role public.user_role NOT NULL DEFAULT 'staff',
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_shop_roles_pkey PRIMARY KEY (id),
    CONSTRAINT user_shop_roles_unique_user_shop UNIQUE (user_id, shop_id)
);

CREATE TABLE public.user_preferences (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_active_shop_id uuid REFERENCES public.shops(id) ON DELETE SET NULL,
    language text DEFAULT 'en',
    theme text DEFAULT 'system',
    notifications_enabled boolean DEFAULT true,
    currency text DEFAULT 'INR',
    onboarding_completed boolean DEFAULT false,
    onboarding_step integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_preferences_pkey PRIMARY KEY (user_id)
);

CREATE TABLE public.shop_invitations (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    email text NOT NULL,
    role public.user_role NOT NULL DEFAULT 'staff',
    invited_by uuid REFERENCES auth.users(id),
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'declined')),
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval),
    CONSTRAINT shop_invitations_pkey PRIMARY KEY (id)
);

-- 2. STAFF
CREATE TABLE public.staff_profiles (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id), -- Nullable if staff not yet invited/linked
    name text NOT NULL,
    joined_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    CONSTRAINT staff_profiles_pkey PRIMARY KEY (id)
);

CREATE TABLE public.staff_attendance (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    staff_id uuid NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
    date date DEFAULT CURRENT_DATE,
    status text NOT NULL CHECK (status IN ('present', 'absent', 'half_day', 'leave')),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT staff_attendance_pkey PRIMARY KEY (id)
);

CREATE TABLE public.staff_payments (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    staff_id uuid NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
    amount numeric NOT NULL CHECK (amount > 0),
    payment_type text NOT NULL CHECK (payment_type IN ('salary', 'bonus', 'advance', 'commission')),
    description text,
    payment_date date DEFAULT CURRENT_DATE,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT staff_payments_pkey PRIMARY KEY (id)
);

-- 3. PRODUCTS & INVENTORY
CREATE TABLE public.catalogue_categories (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    name text NOT NULL,
    slug text NOT NULL,
    image_url text,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT catalogue_categories_pkey PRIMARY KEY (id),
    CONSTRAINT catalogue_categories_shop_slug_unique UNIQUE (shop_id, slug)
);

CREATE TABLE public.inventory_items (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    tag_id text NOT NULL,
    qr_data text,
    metal_type text NOT NULL,
    purity text NOT NULL,
    category text,
    hsn_code text,
    gross_weight numeric NOT NULL,
    net_weight numeric NOT NULL,
    stone_weight numeric DEFAULT 0,
    stone_value numeric DEFAULT 0,
    wastage_percent numeric DEFAULT 0,
    making_charge_type text DEFAULT 'PER_GRAM' CHECK (making_charge_type IN ('PER_GRAM', 'FIXED', 'PERCENT')),
    making_charge_value numeric DEFAULT 0,
    status text NOT NULL DEFAULT 'IN_STOCK' CHECK (status IN ('IN_STOCK', 'RESERVED', 'SOLD', 'EXCHANGED', 'LOANED', 'MELTED', 'DAMAGED')),
    sold_invoice_id uuid, -- Link happens later
    sold_at timestamp with time zone,
    name text,
    location text DEFAULT 'SHOWCASE',
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    deleted_at timestamp with time zone,
    CONSTRAINT inventory_items_pkey PRIMARY KEY (id),
    CONSTRAINT inventory_items_tag_shop_unique UNIQUE (shop_id, tag_id) -- Tag ID unique per shop, not globally
);

CREATE TABLE public.inventory_tag_sequences (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    metal_type text NOT NULL,
    last_sequence integer DEFAULT 0,
    CONSTRAINT inventory_tag_sequences_pkey PRIMARY KEY (id),
    CONSTRAINT inventory_tag_sequences_shop_metal_unique UNIQUE (shop_id, metal_type)
);

CREATE TABLE public.inventory_status_history (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    old_status text,
    new_status text NOT NULL,
    old_location text,
    new_location text,
    reason text,
    reference_id uuid,
    reference_type text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    CONSTRAINT inventory_status_history_pkey PRIMARY KEY (id)
);

-- 4. CUSTOMERS & KHATA
CREATE TABLE public.customers (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    name text NOT NULL,
    phone text,
    email text,
    address text,
    state text,
    pincode text,
    gst_number text,
    loyalty_points integer DEFAULT 0,
    total_spent numeric DEFAULT 0,
    notes text,
    tags text[],
    search_vector tsvector,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    deleted_by uuid REFERENCES auth.users(id),
    CONSTRAINT customers_pkey PRIMARY KEY (id),
    CONSTRAINT customers_shop_phone_unique UNIQUE (shop_id, phone) -- Prevent dupes per shop
);

CREATE TABLE public.khatabook_contacts (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    name text NOT NULL,
    phone text,
    email text,
    address text,
    type text NOT NULL CHECK (type IN ('CUSTOMER', 'SUPPLIER', 'KARIGAR', 'PARTNER', 'OTHER')),
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    CONSTRAINT khatabook_contacts_pkey PRIMARY KEY (id)
);

CREATE TABLE public.ledger_transactions (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
    khatabook_contact_id uuid REFERENCES public.khatabook_contacts(id) ON DELETE SET NULL,
    transaction_type text CHECK (transaction_type IN ('INVOICE', 'PAYMENT', 'ADJUSTMENT', 'SALE', 'SALE_RETURN', 'PURCHASE', 'PURCHASE_RETURN', 'WORK_ORDER', 'MAKING_CHARGES', 'JAMA', 'ODHARA', 'LOAN_GIVEN', 'LOAN_RECEIVED', 'SETTLEMENT')),
    entry_type text NOT NULL CHECK (entry_type IN ('DEBIT', 'CREDIT')),
    amount numeric NOT NULL DEFAULT 0,
    description text,
    transaction_date timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    CONSTRAINT ledger_transactions_pkey PRIMARY KEY (id)
);

CREATE TABLE public.transaction_documents (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  transaction_id uuid NOT NULL REFERENCES public.ledger_transactions(id) ON DELETE CASCADE,
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  file_name text,
  file_type text NOT NULL,
  storage_path text NOT NULL,
  description text,
  uploaded_at timestamp with time zone DEFAULT now(),
  uploaded_by uuid REFERENCES auth.users(id),
  CONSTRAINT transaction_documents_pkey PRIMARY KEY (id)
);

-- 5. INVOICING
CREATE TABLE public.invoices (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    invoice_number text NOT NULL,
    customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
    status text DEFAULT 'due' CHECK (status IN ('paid', 'due', 'cancelled')),
    invoice_date date DEFAULT CURRENT_DATE,
    subtotal numeric NOT NULL DEFAULT 0,
    discount numeric DEFAULT 0,
    cgst_amount numeric DEFAULT 0,
    sgst_amount numeric DEFAULT 0,
    grand_total numeric NOT NULL DEFAULT 0,
    loyalty_points_earned integer DEFAULT 0,
    loyalty_points_redeemed integer DEFAULT 0,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    created_by uuid REFERENCES auth.users(id),
    deleted_by uuid REFERENCES auth.users(id),
    CONSTRAINT invoices_pkey PRIMARY KEY (id),
    CONSTRAINT invoices_shop_number_unique UNIQUE (shop_id, invoice_number)
);

-- Link back from inventory to invoice
ALTER TABLE public.inventory_items 
ADD CONSTRAINT inventory_items_sold_invoice_id_fkey 
FOREIGN KEY (sold_invoice_id) REFERENCES public.invoices(id);

CREATE TABLE public.invoice_items (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    stock_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL, -- Can be null if custom item
    tag_id text,
    description text NOT NULL,
    purity text,
    metal_type text,
    category text,
    hsn_code text,
    gross_weight numeric DEFAULT 0,
    net_weight numeric DEFAULT 0,
    stone_weight numeric DEFAULT 0,
    stone_amount numeric DEFAULT 0,
    wastage_percent numeric DEFAULT 0,
    making_rate numeric DEFAULT 0,
    rate numeric DEFAULT 0,
    making numeric DEFAULT 0,
    amount numeric, -- Line total
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT invoice_items_pkey PRIMARY KEY (id)
);

-- 6. LOANS
CREATE TABLE public.loan_customers (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    name text NOT NULL,
    phone text,
    email text,
    address text,
    photo_url text,
    kyc_document_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT loan_customers_pkey PRIMARY KEY (id)
);

CREATE TABLE public.loans (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES public.loan_customers(id) ON DELETE CASCADE,
    loan_number text NOT NULL,
    status text NOT NULL CHECK (status IN ('active', 'closed', 'overdue', 'rejected')),
    principal_amount numeric NOT NULL CHECK (principal_amount >= 0),
    interest_rate numeric NOT NULL CHECK (interest_rate >= 0),
    start_date date NOT NULL DEFAULT CURRENT_DATE,
    end_date date,
    repayment_type text DEFAULT 'interest_only' CHECK (repayment_type IN ('interest_only', 'emi', 'bullet')),
    tenure_months integer,
    emi_amount numeric,
    total_interest_accrued numeric DEFAULT 0,
    total_amount_paid numeric DEFAULT 0,
    settlement_amount numeric,
    settlement_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT loans_pkey PRIMARY KEY (id),
    CONSTRAINT loans_shop_number_unique UNIQUE (shop_id, loan_number)
);

CREATE TABLE public.loan_collateral (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    loan_id uuid NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    item_name text NOT NULL,
    item_type text NOT NULL CHECK (item_type IN ('gold', 'silver', 'diamond', 'other')),
    gross_weight numeric NOT NULL DEFAULT 0,
    net_weight numeric NOT NULL DEFAULT 0,
    purity text,
    estimated_value numeric,
    description text,
    photo_urls text[],
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT loan_collateral_pkey PRIMARY KEY (id)
);

CREATE TABLE public.loan_payments (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    loan_id uuid NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    payment_date date NOT NULL DEFAULT CURRENT_DATE,
    amount numeric NOT NULL CHECK (amount > 0),
    payment_type text NOT NULL CHECK (payment_type IN ('principal', 'interest', 'full_settlement')),
    payment_method text NOT NULL CHECK (payment_method IN ('cash', 'upi', 'bank_transfer')),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT loan_payments_pkey PRIMARY KEY (id)
);

-- 7. SCHEMES (GOLD SIP)
CREATE TABLE public.schemes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('FIXED_AMOUNT', 'VARIABLE_AMOUNT')),
    duration_months integer NOT NULL,
    scheme_amount numeric,
    rules jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT schemes_pkey PRIMARY KEY (id)
);

CREATE TABLE public.scheme_enrollments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    scheme_id uuid NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
    account_number text NOT NULL,
    start_date date NOT NULL DEFAULT CURRENT_DATE,
    maturity_date date NOT NULL,
    status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'MATURED', 'CLOSED', 'CANCELLED')),
    total_paid numeric DEFAULT 0,
    total_gold_weight_accumulated numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT scheme_enrollments_pkey PRIMARY KEY (id),
    CONSTRAINT scheme_enrollments_shop_account_unique UNIQUE (shop_id, account_number)
);

CREATE TABLE public.scheme_transactions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    enrollment_id uuid NOT NULL REFERENCES public.scheme_enrollments(id) ON DELETE CASCADE,
    shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    transaction_type text NOT NULL CHECK (transaction_type IN ('INSTALLMENT', 'BONUS', 'FINE', 'ADJUSTMENT')),
    amount numeric NOT NULL,
    gold_rate numeric,
    gold_weight numeric,
    payment_date timestamp with time zone DEFAULT now(),
    payment_mode text CHECK (payment_mode IN ('CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'OTHER')),
    status text NOT NULL DEFAULT 'PAID' CHECK (status IN ('PAID', 'DUE', 'OVERDUE')),
    description text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    CONSTRAINT scheme_transactions_pkey PRIMARY KEY (id)
);

-- 8. SUBSCRIPTIONS & LIMITS (SaaS Level)
CREATE TABLE public.plans (
    id text NOT NULL, -- e.g. 'free', 'pro'
    name text NOT NULL,
    description text,
    price_monthly integer DEFAULT 0,
    price_yearly integer DEFAULT 0,
    limits jsonb NOT NULL DEFAULT '{}'::jsonb, -- { "invoices": 50, "staff": 2 }
    features jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT plans_pkey PRIMARY KEY (id)
);

-- Consolidated Subscription Table
CREATE TABLE public.subscriptions (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    razorpay_subscription_id text UNIQUE,
    razorpay_customer_id text,
    razorpay_plan_id text,
    plan_id public.subscription_plan NOT NULL DEFAULT 'free',
    status public.subscription_status NOT NULL DEFAULT 'active',
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    cancel_at_period_end boolean DEFAULT false,
    billing_cycle_anchor timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT subscriptions_pkey PRIMARY KEY (id)
);
-- Legacy table support - if code still uses 'shop_subscriptions', we can create a VIEW or keep table but careful with sync.
-- Since the user asked for a Clean Slate, we will Use ONE table. 
-- *Checking usage*: The code uses 'shop_subscriptions' in subscription-service.ts.
-- We must alias or rename. For now, let's CREATE A VIEW proxy if needed, or better, UPDATE THE CODE later.
-- BUT, this file is schema. Let's create `shop_subscriptions` as a VIEW to `subscriptions`?
-- No, for now let's keep `subscriptions` as the master. The user code logic needs to adapt or we keep table name as `subscriptions`.

CREATE TABLE public.shop_usage_limits (
    shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    period_start timestamp with time zone NOT NULL,
    invoices_created integer DEFAULT 0,
    customers_added integer DEFAULT 0,
    staff_seats_occupied integer DEFAULT 0,
    ai_tokens_used bigint DEFAULT 0,
    storage_bytes bigint DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT shop_usage_limits_pkey PRIMARY KEY (shop_id, period_start)
);

-- 9. LOGS & AUDIT
CREATE TABLE public.usage_events (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    metric text NOT NULL,
    amount integer NOT NULL DEFAULT 1,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT usage_events_pkey PRIMARY KEY (id)
);

CREATE TABLE public.audit_logs (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id),
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);

-- 10. CATALOGUE & SETTINGS
CREATE TABLE public.catalogue_settings (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    public_slug text NOT NULL,
    shop_display_name text NOT NULL,
    about_text text,
    logo_url text,
    banner_url text,
    primary_color text DEFAULT '#D4AF37',
    is_active boolean DEFAULT false,
    contact_phone text,
    contact_address text,
    show_prices boolean DEFAULT true,
    template_id text DEFAULT 'basic',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT catalogue_settings_pkey PRIMARY KEY (id),
    CONSTRAINT catalogue_settings_shop_unique UNIQUE (shop_id),
    CONSTRAINT catalogue_settings_slug_unique UNIQUE (public_slug)
);

CREATE TABLE public.catalogue_analytics (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    view_type text CHECK (view_type IN ('page_view', 'product_view', 'whatsapp_click')),
    product_id uuid, -- Link casually to inventory if needed, but analytics might persist after delete
    visitor_id text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT catalogue_analytics_pkey PRIMARY KEY (id)
);

-- 11. MISC
CREATE TABLE public.market_rates (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    gold_24k numeric NOT NULL DEFAULT 0,
    gold_22k numeric NOT NULL DEFAULT 0,
    silver numeric NOT NULL DEFAULT 0,
    source text DEFAULT 'Manual',
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT market_rates_pkey PRIMARY KEY (id)
);

CREATE TABLE public.notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    link text,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

CREATE TABLE public.shop_loyalty_settings (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    is_enabled boolean DEFAULT false,
    earning_type text DEFAULT 'flat' CHECK (earning_type IN ('flat', 'percentage')),
    flat_points_ratio numeric DEFAULT 0.01,
    percentage_back numeric DEFAULT 1,
    redemption_conversion_rate numeric DEFAULT 1,
    min_redemption_points integer DEFAULT 100,
    max_redemption_percentage numeric DEFAULT 50,
    min_points_required integer DEFAULT 0,
    earn_on_discounted_items boolean DEFAULT true,
    earn_on_full_payment_only boolean DEFAULT false,
    points_validity_days integer DEFAULT 365,
    redemption_enabled boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT shop_loyalty_settings_pkey PRIMARY KEY (id),
    CONSTRAINT shop_loyalty_settings_shop_unique UNIQUE (shop_id)
);

CREATE TABLE public.whatsapp_configs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    phone_number text NOT NULL,
    waba_id text NOT NULL,
    phone_number_id text NOT NULL,
    access_token_encrypted text NOT NULL,
    display_name text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'error')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT whatsapp_configs_pkey PRIMARY KEY (id),
    CONSTRAINT whatsapp_configs_shop_unique UNIQUE (shop_id)
);

-- INDEXES FOR PERFORMANCE
-- Shops
CREATE INDEX idx_shops_created_by ON public.shops(created_by);
-- Inventory
CREATE INDEX idx_inventory_shop_id ON public.inventory_items(shop_id);
CREATE INDEX idx_inventory_status ON public.inventory_items(shop_id, status);
CREATE INDEX idx_inventory_tag ON public.inventory_items(tag_id);
-- Invoices
CREATE INDEX idx_invoices_shop_id ON public.invoices(shop_id);
CREATE INDEX idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX idx_invoices_date ON public.invoices(shop_id, invoice_date);
-- Customers
CREATE INDEX idx_customers_shop_phone ON public.customers(shop_id, phone);
CREATE INDEX idx_customers_search ON public.customers USING GIN(search_vector);
-- Ledger
CREATE INDEX idx_ledger_shop_id ON public.ledger_transactions(shop_id);
CREATE INDEX idx_ledger_customer_id ON public.ledger_transactions(customer_id);
CREATE INDEX idx_ledger_date ON public.ledger_transactions(shop_id, transaction_date);
-- Audit
CREATE INDEX idx_audit_shop_id ON public.audit_logs(shop_id);
-- Subscriptions
CREATE INDEX idx_subscriptions_shop_id ON public.subscriptions(shop_id);
