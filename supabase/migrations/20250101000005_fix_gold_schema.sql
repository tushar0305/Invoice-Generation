-- Migration to align database with frontend code for Gold Schemes

-- 1. Rename tables to standard names
ALTER TABLE IF EXISTS public.customer_schemes RENAME TO scheme_enrollments;
ALTER TABLE IF EXISTS public.scheme_payments RENAME TO scheme_transactions;

-- 2. Update scheme_enrollments (formerly customer_schemes)
ALTER TABLE public.scheme_enrollments 
    RENAME COLUMN total_amount_collected TO total_paid;

ALTER TABLE public.scheme_enrollments 
    ADD COLUMN IF NOT EXISTS account_number TEXT,
    ADD COLUMN IF NOT EXISTS total_gold_weight_accumulated NUMERIC(10,3) DEFAULT 0;

-- 3. Update scheme_transactions (formerly scheme_payments)
ALTER TABLE public.scheme_transactions 
    RENAME COLUMN customer_scheme_id TO enrollment_id;

ALTER TABLE public.scheme_transactions 
    ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'INSTALLMENT',
    ADD COLUMN IF NOT EXISTS gold_rate NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS gold_weight NUMERIC(10,3),
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PAID';

-- 4. Create RPC for atomic enrollment updates
CREATE OR REPLACE FUNCTION update_enrollment_totals(enrollment_uuid UUID, amount_paid NUMERIC, weight_added NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE scheme_enrollments
  SET 
    total_paid = COALESCE(total_paid, 0) + amount_paid,
    total_gold_weight_accumulated = COALESCE(total_gold_weight_accumulated, 0) + weight_added,
    updated_at = now()
  WHERE id = enrollment_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
