-- Create schemes table
CREATE TABLE IF NOT EXISTS schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('FIXED_AMOUNT', 'VARIABLE_AMOUNT')),
    duration_months INTEGER NOT NULL,
    scheme_amount DECIMAL(12, 2), -- Optional for variable schemes
    rules JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create scheme_enrollments table
CREATE TABLE IF NOT EXISTS scheme_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    scheme_id UUID NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
    account_number TEXT NOT NULL,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    maturity_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'MATURED', 'CLOSED', 'CANCELLED')) DEFAULT 'ACTIVE',
    total_paid DECIMAL(12, 2) DEFAULT 0,
    total_gold_weight_accumulated DECIMAL(10, 3) DEFAULT 0, -- In grams
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(shop_id, account_number)
);

-- Create scheme_transactions table
CREATE TABLE IF NOT EXISTS scheme_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES scheme_enrollments(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('INSTALLMENT', 'BONUS', 'FINE', 'ADJUSTMENT')),
    amount DECIMAL(12, 2) NOT NULL,
    gold_rate DECIMAL(10, 2), -- Rate per gram at time of payment
    gold_weight DECIMAL(10, 3), -- Weight bought/accumulated
    payment_date TIMESTAMPTZ DEFAULT now(),
    payment_mode TEXT CHECK (payment_mode IN ('CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'OTHER')),
    status TEXT NOT NULL CHECK (status IN ('PAID', 'DUE', 'OVERDUE')) DEFAULT 'PAID',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID -- link to staff/user if needed later
);

-- Create scheme_redemptions table
CREATE TABLE IF NOT EXISTS scheme_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES scheme_enrollments(id) ON DELETE CASCADE,
    redeemed_date TIMESTAMPTZ DEFAULT now(),
    payout_amount DECIMAL(12, 2) NOT NULL,
    payout_gold_weight DECIMAL(10, 3),
    bonus_applied DECIMAL(12, 2) DEFAULT 0,
    invoice_id UUID, -- Optional link to an invoice if redeemed against purchase
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_schemes_shop_id ON schemes(shop_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_shop_id ON scheme_enrollments(shop_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_customer_id ON scheme_enrollments(customer_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_scheme_id ON scheme_enrollments(scheme_id);
CREATE INDEX IF NOT EXISTS idx_transactions_enrollment_id ON scheme_transactions(enrollment_id);

-- Enable RLS
ALTER TABLE schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheme_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheme_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheme_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Using user_shop_roles to verify shop ownership/access
CREATE POLICY "Users can manage schemes for their shops" ON schemes
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM user_shop_roles WHERE shop_id = schemes.shop_id
        )
    );

CREATE POLICY "Users can manage enrollments for their shops" ON scheme_enrollments
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM user_shop_roles WHERE shop_id = scheme_enrollments.shop_id
        )
    );

CREATE POLICY "Users can manage transactions for their shops" ON scheme_transactions
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM user_shop_roles WHERE shop_id = scheme_transactions.shop_id
        )
    );

CREATE POLICY "Users can manage redemptions for their shops" ON scheme_redemptions
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM user_shop_roles WHERE shop_id = scheme_redemptions.shop_id
        )
    );
