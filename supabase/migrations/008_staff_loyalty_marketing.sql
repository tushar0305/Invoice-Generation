-- Staff Enhancements
CREATE TABLE IF NOT EXISTS public.staff_profiles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE,
    full_name text,
    phone_number text,
    address text,
    designation text,
    joining_date date,
    salary_amount numeric,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, shop_id)
);

CREATE TABLE IF NOT EXISTS public.staff_salaries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id uuid REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
    shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    month integer NOT NULL, -- 1-12
    year integer NOT NULL,
    status text CHECK (status IN ('paid', 'pending', 'partial')),
    payment_date timestamptz,
    payment_method text,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staff_attendance (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id uuid REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
    shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE,
    date date NOT NULL,
    status text CHECK (status IN ('present', 'absent', 'half-day', 'leave')),
    check_in time,
    check_out time,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for now - Owners can do everything)
CREATE POLICY "Owners can manage staff profiles" ON public.staff_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_shop_roles
            WHERE user_shop_roles.shop_id = staff_profiles.shop_id
            AND user_shop_roles.user_id = auth.uid()
            AND user_shop_roles.role = 'owner'
        )
    );

CREATE POLICY "Owners can manage staff salaries" ON public.staff_salaries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_shop_roles
            WHERE user_shop_roles.shop_id = staff_salaries.shop_id
            AND user_shop_roles.user_id = auth.uid()
            AND user_shop_roles.role = 'owner'
        )
    );

CREATE POLICY "Owners can manage staff attendance" ON public.staff_attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_shop_roles
            WHERE user_shop_roles.shop_id = staff_attendance.shop_id
            AND user_shop_roles.user_id = auth.uid()
            AND user_shop_roles.role = 'owner'
        )
    );

-- Loyalty Program
CREATE TABLE IF NOT EXISTS public.loyalty_programs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE,
    program_name text NOT NULL,
    is_active boolean DEFAULT false,
    points_per_unit numeric DEFAULT 1, -- e.g., 1 point per 100 currency
    unit_currency_amount numeric DEFAULT 100,
    redemption_rate numeric DEFAULT 0.1, -- 1 point = 0.1 currency
    min_redeem_points integer DEFAULT 100,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_loyalty (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
    shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE,
    current_points integer DEFAULT 0,
    total_earned integer DEFAULT 0,
    total_redeemed integer DEFAULT 0,
    tier text DEFAULT 'Silver',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(customer_id, shop_id)
);

ALTER TABLE public.loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_loyalty ENABLE ROW LEVEL SECURITY;

-- Marketing
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE,
    name text NOT NULL,
    channel text CHECK (channel IN ('sms', 'whatsapp', 'email')),
    status text CHECK (status IN ('draft', 'scheduled', 'sent', 'failed')),
    scheduled_at timestamptz,
    sent_at timestamptz,
    message_template text,
    audience_filter jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
