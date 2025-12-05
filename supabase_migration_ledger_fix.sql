-- Ledger Fix Migration (Idempotent)

-- 1. Create Ledger Transactions Table (if missing)
CREATE TABLE IF NOT EXISTS public.ledger_transactions (
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

-- 2. Enable RLS (Safe to run multiple times)
ALTER TABLE public.ledger_transactions ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "View shop ledger" ON public.ledger_transactions;
DROP POLICY IF EXISTS "Manage shop ledger" ON public.ledger_transactions;

-- 4. Recreate Policies
CREATE POLICY "View shop ledger" ON public.ledger_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_shop_roles 
            WHERE user_id = auth.uid() 
            AND shop_id = public.ledger_transactions.shop_id 
            AND is_active = true
        )
    );

CREATE POLICY "Manage shop ledger" ON public.ledger_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_shop_roles 
            WHERE user_id = auth.uid() 
            AND shop_id = public.ledger_transactions.shop_id 
            AND is_active = true
        )
    );

-- 5. Fix `create_customer` function (Drop first to ensure signature update)
DROP FUNCTION IF EXISTS public.create_customer; 
DROP FUNCTION IF EXISTS public.create_customer(uuid, text, text, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.create_customer(uuid, text, text, text, text, text, text, text, numeric);

CREATE OR REPLACE FUNCTION public.create_customer(
    p_shop_id UUID,
    p_name TEXT,
    p_phone TEXT,
    p_email TEXT,
    p_address TEXT,
    p_state TEXT,
    p_pincode TEXT,
    p_gst_number TEXT,
    p_opening_balance NUMERIC DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    v_customer_id UUID;
    v_existing_id UUID;
    v_entry_type TEXT;
    v_amount NUMERIC;
BEGIN
    -- Check for existing customer with same phone in shop
    SELECT id INTO v_existing_id FROM public.customers 
    WHERE shop_id = p_shop_id AND phone = p_phone AND deleted_at IS NULL;

    IF v_existing_id IS NOT NULL THEN
        RAISE EXCEPTION 'Customer with this phone number already exists (ID: %)', v_existing_id
        USING ERRCODE = 'P0001'; -- Custom error code
    END IF;

    INSERT INTO public.customers (
        shop_id, name, phone, email, address, state, pincode, gst_number
    ) VALUES (
        p_shop_id, p_name, p_phone, p_email, p_address, p_state, p_pincode, p_gst_number
    ) RETURNING id INTO v_customer_id;

    -- Handle Opening Balance
    IF p_opening_balance IS NOT NULL AND p_opening_balance <> 0 THEN
        v_amount := ABS(p_opening_balance);
        
        IF p_opening_balance > 0 THEN
            v_entry_type := 'DEBIT'; -- Customer owes shop (Positive balance in view)
        ELSE
            v_entry_type := 'CREDIT'; -- Shop owes customer (Negative balance in view)
        END IF;

        INSERT INTO public.ledger_transactions (
            shop_id, customer_id, transaction_type, amount, entry_type, description, transaction_date, created_by
        ) VALUES (
            p_shop_id, v_customer_id, 'ADJUSTMENT', v_amount, v_entry_type, 'Opening Balance', CURRENT_DATE, auth.uid()
        );
    END IF;

    RETURN jsonb_build_object('id', v_customer_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create or Replace View
DROP VIEW IF EXISTS public.customer_balances_view;

CREATE OR REPLACE VIEW public.customer_balances_view AS
SELECT 
    c.id, 
    c.shop_id, 
    c.name, 
    c.phone, 
    c.email, 
    c.address,
    COALESCE(SUM(CASE WHEN lt.entry_type = 'DEBIT' THEN lt.amount ELSE 0 END), 0) as total_debit,
    COALESCE(SUM(CASE WHEN lt.entry_type = 'CREDIT' THEN lt.amount ELSE 0 END), 0) as total_credit,
    (COALESCE(SUM(CASE WHEN lt.entry_type = 'DEBIT' THEN lt.amount ELSE 0 END), 0) - 
     COALESCE(SUM(CASE WHEN lt.entry_type = 'CREDIT' THEN lt.amount ELSE 0 END), 0)) as current_balance
FROM public.customers c
LEFT JOIN public.ledger_transactions lt ON c.id = lt.customer_id
WHERE c.deleted_at IS NULL
GROUP BY c.id;

-- 7. Fix indexes (Safe)
CREATE INDEX IF NOT EXISTS idx_ledger_shop_id ON public.ledger_transactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_ledger_customer_id ON public.ledger_transactions(customer_id);
