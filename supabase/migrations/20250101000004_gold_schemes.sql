-- Gold Schemes Module

-- 1. Schemes Definition
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

-- 2. Customer Enrollments
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

-- 3. Scheme Payments
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

-- RLS Policies (Basic)
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheme_payments ENABLE ROW LEVEL SECURITY;

-- Allow read/write for shop users
CREATE POLICY "Shop users can manage schemes" ON public.schemes
    USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = auth.uid()));

CREATE POLICY "Shop users can manage enrollments" ON public.customer_schemes
    USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = auth.uid()));

CREATE POLICY "Shop users can manage payments" ON public.scheme_payments
    USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = auth.uid()));
