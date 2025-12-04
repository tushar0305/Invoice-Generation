-- Jewellery Loan Management Database Migration

-- Create loan_customers table
CREATE TABLE IF NOT EXISTS public.loan_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    kyc_document_url TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for loan_customers
CREATE INDEX IF NOT EXISTS idx_loan_customers_shop_id ON public.loan_customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_loan_customers_phone ON public.loan_customers(phone);

-- Create loans table
CREATE TABLE IF NOT EXISTS public.loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.loan_customers(id) ON DELETE CASCADE,
    loan_number TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'closed', 'overdue', 'rejected')),
    principal_amount DECIMAL(12, 2) NOT NULL CHECK (principal_amount > 0),
    interest_rate DECIMAL(5, 2) NOT NULL CHECK (interest_rate >= 0), -- Annual interest rate in %
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    total_interest_accrued DECIMAL(12, 2) DEFAULT 0.00,
    total_amount_paid DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure loan_number is unique per shop
    CONSTRAINT loans_loan_number_shop_id_key UNIQUE (shop_id, loan_number)
);

-- Add indexes for loans
CREATE INDEX IF NOT EXISTS idx_loans_shop_id ON public.loans(shop_id);
CREATE INDEX IF NOT EXISTS idx_loans_customer_id ON public.loans(customer_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON public.loans(status);

-- Create loan_collateral table
CREATE TABLE IF NOT EXISTS public.loan_collateral (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('gold', 'silver', 'diamond', 'other')),
    gross_weight DECIMAL(10, 3) NOT NULL, -- in grams
    net_weight DECIMAL(10, 3) NOT NULL, -- in grams
    purity TEXT, -- e.g., "22K", "18K"
    estimated_value DECIMAL(12, 2),
    description TEXT,
    photo_urls TEXT[], -- Array of photo URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for loan_collateral
CREATE INDEX IF NOT EXISTS idx_loan_collateral_loan_id ON public.loan_collateral(loan_id);

-- Create loan_payments table
CREATE TABLE IF NOT EXISTS public.loan_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    payment_type TEXT NOT NULL CHECK (payment_type IN ('principal', 'interest', 'full_settlement')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'upi', 'bank_transfer')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for loan_payments
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan_id ON public.loan_payments(loan_id);

-- Create triggers for updated_at
CREATE TRIGGER update_loan_customers_updated_at
    BEFORE UPDATE ON public.loan_customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loans_updated_at
    BEFORE UPDATE ON public.loans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.loan_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_collateral ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loan_customers
CREATE POLICY "Users can view their shop's loan customers"
    ON public.loan_customers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_shop_roles
            WHERE user_shop_roles.shop_id = loan_customers.shop_id
            AND user_shop_roles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert loan customers for their shops"
    ON public.loan_customers FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_shop_roles
            WHERE user_shop_roles.shop_id = loan_customers.shop_id
            AND user_shop_roles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their shop's loan customers"
    ON public.loan_customers FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_shop_roles
            WHERE user_shop_roles.shop_id = loan_customers.shop_id
            AND user_shop_roles.user_id = auth.uid()
        )
    );

-- RLS Policies for loans
CREATE POLICY "Users can view their shop's loans"
    ON public.loans FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_shop_roles
            WHERE user_shop_roles.shop_id = loans.shop_id
            AND user_shop_roles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert loans for their shops"
    ON public.loans FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_shop_roles
            WHERE user_shop_roles.shop_id = loans.shop_id
            AND user_shop_roles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their shop's loans"
    ON public.loans FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_shop_roles
            WHERE user_shop_roles.shop_id = loans.shop_id
            AND user_shop_roles.user_id = auth.uid()
        )
    );

-- RLS Policies for loan_collateral
CREATE POLICY "Users can view collateral for their shop's loans"
    ON public.loan_collateral FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.loans
            JOIN public.user_shop_roles ON loans.shop_id = user_shop_roles.shop_id
            WHERE loans.id = loan_collateral.loan_id
            AND user_shop_roles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert collateral for their shop's loans"
    ON public.loan_collateral FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.loans
            JOIN public.user_shop_roles ON loans.shop_id = user_shop_roles.shop_id
            WHERE loans.id = loan_collateral.loan_id
            AND user_shop_roles.user_id = auth.uid()
        )
    );

-- RLS Policies for loan_payments
CREATE POLICY "Users can view payments for their shop's loans"
    ON public.loan_payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.loans
            JOIN public.user_shop_roles ON loans.shop_id = user_shop_roles.shop_id
            WHERE loans.id = loan_payments.loan_id
            AND user_shop_roles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert payments for their shop's loans"
    ON public.loan_payments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.loans
            JOIN public.user_shop_roles ON loans.shop_id = user_shop_roles.shop_id
            WHERE loans.id = loan_payments.loan_id
            AND user_shop_roles.user_id = auth.uid()
        )
    );

-- Create Storage Bucket for Loan Documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('loan-documents', 'loan-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Users can upload loan documents for their shop"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'loan-documents' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Users can view loan documents"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'loan-documents' AND
    auth.role() = 'authenticated'
);

-- Comments
COMMENT ON TABLE public.loan_customers IS 'Customers specifically for the jewellery loan feature';
COMMENT ON TABLE public.loans IS 'Jewellery loans records';
COMMENT ON TABLE public.loan_collateral IS 'Items pledged as collateral for loans';
COMMENT ON TABLE public.loan_payments IS 'Repayment records for loans';
