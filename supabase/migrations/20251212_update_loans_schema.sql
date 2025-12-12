-- Update loans table to support flexible repayment types
-- Consolidated into a single statement to avoid syntax errors in some runners

ALTER TABLE loans
    ADD COLUMN IF NOT EXISTS repayment_type text CHECK (repayment_type IN ('interest_only', 'emi', 'bullet')) DEFAULT 'interest_only',
    ADD COLUMN IF NOT EXISTS tenure_months integer,
    ADD COLUMN IF NOT EXISTS emi_amount numeric,
    ADD COLUMN IF NOT EXISTS end_date date;
