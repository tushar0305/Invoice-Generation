-- Khata Book Database Migration
-- This creates tables for customer ledger management (Khata Book feature)

-- Create khata_customers table
CREATE TABLE IF NOT EXISTS public.khata_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    opening_balance DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for better query performance
    CONSTRAINT khata_customers_name_check CHECK (length(trim(name)) > 0)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_khata_customers_shop_id ON public.khata_customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_khata_customers_user_id ON public.khata_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_khata_customers_name ON public.khata_customers(name);

-- Create khata_transactions table
CREATE TABLE IF NOT EXISTS public.khata_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.khata_customers(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('given', 'received')),
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    description TEXT,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for khata_transactions
CREATE INDEX IF NOT EXISTS idx_khata_transactions_shop_id ON public.khata_transactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_khata_transactions_user_id ON public.khata_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_khata_transactions_customer_id ON public.khata_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_khata_transactions_type ON public.khata_transactions(type);
CREATE INDEX IF NOT EXISTS idx_khata_transactions_date ON public.khata_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_khata_transactions_invoice_id ON public.khata_transactions(invoice_id);

-- Create view for customer balances
-- This calculates current balance based on opening balance and all transactions
CREATE OR REPLACE VIEW public.khata_customer_balances AS
SELECT 
    c.id,
    c.shop_id,
    c.user_id,
    c.name,
    c.phone,
    c.address,
    c.opening_balance,
    COALESCE(SUM(CASE WHEN t.type = 'given' THEN t.amount ELSE 0 END), 0) as total_given,
    COALESCE(SUM(CASE WHEN t.type = 'received' THEN t.amount ELSE 0 END), 0) as total_received,
    c.opening_balance + 
        COALESCE(SUM(CASE WHEN t.type = 'given' THEN t.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN t.type = 'received' THEN t.amount ELSE 0 END), 0) as current_balance,
    c.created_at,
    c.updated_at
FROM public.khata_customers c
LEFT JOIN public.khata_transactions t ON c.id = t.customer_id
GROUP BY c.id, c.shop_id, c.user_id, c.name, c.phone, c.address, c.opening_balance, c.created_at, c.updated_at;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_khata_customers_updated_at
    BEFORE UPDATE ON public.khata_customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_khata_transactions_updated_at
    BEFORE UPDATE ON public.khata_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.khata_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.khata_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for khata_customers
CREATE POLICY "Users can view their shop's khata customers"
    ON public.khata_customers FOR SELECT
    USING (
        auth.uid() = user_id 
        OR 
        EXISTS (
            SELECT 1 FROM public.user_shop_roles
            WHERE user_shop_roles.shop_id = khata_customers.shop_id
            AND user_shop_roles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert khata customers for their shops"
    ON public.khata_customers FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM public.user_shop_roles
            WHERE user_shop_roles.shop_id = khata_customers.shop_id
            AND user_shop_roles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their shop's khata customers"
    ON public.khata_customers FOR UPDATE
    USING (
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM public.user_shop_roles
            WHERE user_shop_roles.shop_id = khata_customers.shop_id
            AND user_shop_roles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their shop's khata customers"
    ON public.khata_customers FOR DELETE
    USING (
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM public.user_shop_roles
            WHERE user_shop_roles.shop_id = khata_customers.shop_id
            AND user_shop_roles.user_id = auth.uid()
            AND user_shop_roles.role IN ('owner', 'manager')
        )
    );

-- RLS Policies for khata_transactions
CREATE POLICY "Users can view their shop's khata transactions"
    ON public.khata_transactions FOR SELECT
    USING (
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM public.user_shop_roles
            WHERE user_shop_roles.shop_id = khata_transactions.shop_id
            AND user_shop_roles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert khata transactions for their shops"
    ON public.khata_transactions FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM public.user_shop_roles
            WHERE user_shop_roles.shop_id = khata_transactions.shop_id
            AND user_shop_roles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their shop's khata transactions"
    ON public.khata_transactions FOR UPDATE
    USING (
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM public.user_shop_roles
            WHERE user_shop_roles.shop_id = khata_transactions.shop_id
            AND user_shop_roles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their shop's khata transactions"
    ON public.khata_transactions FOR DELETE
    USING (
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM public.user_shop_roles
            WHERE user_shop_roles.shop_id = khata_transactions.shop_id
            AND user_shop_roles.user_id = auth.uid()
            AND user_shop_roles.role IN ('owner', 'manager')
        )
    );

-- Grant permissions
GRANT SELECT ON public.khata_customer_balances TO authenticated;
GRANT ALL ON public.khata_customers TO authenticated;
GRANT ALL ON public.khata_transactions TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.khata_customers IS 'Customers for Khata Book (ledger) management';
COMMENT ON TABLE public.khata_transactions IS 'Transactions for Khata Book - tracks given (credit) and received (debit) amounts';
COMMENT ON VIEW public.khata_customer_balances IS 'Materialized view showing current balance for each customer';
COMMENT ON COLUMN public.khata_transactions.type IS 'Type of transaction: given (you gave them goods/credit) or received (you received payment/debit)';
