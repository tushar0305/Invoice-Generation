-- Add settlement tracking columns to loans table
ALTER TABLE public.loans 
ADD COLUMN IF NOT EXISTS settlement_amount DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS settlement_notes TEXT;

-- Add comment explaining these fields
COMMENT ON COLUMN public.loans.settlement_amount IS 'Final settlement amount when loan is closed. May differ from principal + interest if there is a discount or waiver.';
COMMENT ON COLUMN public.loans.settlement_notes IS 'Notes explaining the settlement terms, discounts, or special conditions.';
