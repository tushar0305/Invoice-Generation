-- Add missing pincode column to customers table
-- This column is referenced in the application but was missing from the schema

ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS pincode TEXT;

-- Add index for efficient queries by pincode if needed
CREATE INDEX IF NOT EXISTS idx_customers_pincode ON public.customers (pincode);

-- Update comment
COMMENT ON COLUMN public.customers.pincode IS 'Customer postal/pin code';
