-- Add loyalty columns to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS loyalty_points_earned integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS loyalty_points_redeemed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS loyalty_discount_amount numeric(10, 2) DEFAULT 0;

-- Add index for analytics
CREATE INDEX IF NOT EXISTS idx_invoices_loyalty_earned ON public.invoices (loyalty_points_earned) WHERE loyalty_points_earned > 0;
CREATE INDEX IF NOT EXISTS idx_invoices_loyalty_redeemed ON public.invoices (loyalty_points_redeemed) WHERE loyalty_points_redeemed > 0;
