-- Migration: Enhance Schemes for Next-Gen Features
-- Date: 2025-12-26

-- 1. Rename 'type' to 'scheme_type' if needed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schemes' AND column_name = 'type') THEN
        ALTER TABLE schemes RENAME COLUMN type TO scheme_type;
    END IF;
END $$;

-- 2. Drop old constraint immediately to allow updates
-- We drop it BEFORE updating values because the old constraint likely enforces ('FIXED_AMOUNT', 'VARIABLE_AMOUNT')
-- and would block our update to 'FIXED_DURATION'.
ALTER TABLE schemes DROP CONSTRAINT IF EXISTS schemes_type_check;
ALTER TABLE schemes DROP CONSTRAINT IF EXISTS schemes_scheme_type_check;

-- 3. Migrate old values to new enum values
UPDATE schemes SET scheme_type = 'FIXED_DURATION' WHERE scheme_type = 'FIXED_AMOUNT';
UPDATE schemes SET scheme_type = 'FLEXIBLE' WHERE scheme_type = 'VARIABLE_AMOUNT';

-- 4. Add New Check Constraint
ALTER TABLE schemes ADD CONSTRAINT schemes_scheme_type_check CHECK (scheme_type IN ('FIXED_DURATION', 'FLEXIBLE'));

-- 5. Add New Columns for Next-Gen Features
ALTER TABLE schemes
ADD COLUMN IF NOT EXISTS calculation_type TEXT DEFAULT 'FLAT_AMOUNT' CHECK (calculation_type IN ('FLAT_AMOUNT', 'WEIGHT_ACCUMULATION')),
ADD COLUMN IF NOT EXISTS payment_frequency TEXT DEFAULT 'MONTHLY' CHECK (payment_frequency IN ('MONTHLY', 'WEEKLY', 'DAILY', 'FLEXIBLE')),
ADD COLUMN IF NOT EXISTS min_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS benefit_type TEXT DEFAULT 'BONUS_MONTH' CHECK (benefit_type IN ('BONUS_MONTH', 'INTEREST', 'MAKING_CHARGE_DISCOUNT', 'FIXED_AMOUNT')),
ADD COLUMN IF NOT EXISTS benefit_value NUMERIC DEFAULT 0;

-- 6. Enhance Enrollments for Tracking
ALTER TABLE scheme_enrollments
ADD COLUMN IF NOT EXISTS target_weight NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS target_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_weight_balance NUMERIC DEFAULT 0;

-- 7. Add Comments
COMMENT ON COLUMN schemes.calculation_type IS 'FLAT_AMOUNT: Traditional cash saving. WEIGHT_ACCUMULATION: Gold SIP (grams).';
COMMENT ON COLUMN schemes.payment_frequency IS 'FLEXIBLE allows any amount at any time.';
