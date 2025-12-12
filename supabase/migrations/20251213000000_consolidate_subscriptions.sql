-- Add payment fields to shop_subscriptions
ALTER TABLE public.shop_subscriptions
ADD COLUMN IF NOT EXISTS razorpay_subscription_id text UNIQUE,
ADD COLUMN IF NOT EXISTS razorpay_customer_id text,
ADD COLUMN IF NOT EXISTS razorpay_plan_id text;

-- Create index for faster lookups by razorpay_subscription_id
CREATE INDEX IF NOT EXISTS idx_shop_subscriptions_razorpay_sub_id 
ON public.shop_subscriptions(razorpay_subscription_id);

-- Drop the redundant subscriptions table
DROP TABLE IF EXISTS public.subscriptions;

-- Verify RLS Policies exist for shop_subscriptions (should already be there from previous migration)
-- But ensuring update policy allows service role or shop owners to update via webhook/actions

-- (Optional) If we had data in `subscriptions` we would migrate it here, 
-- but assuming clean slate or loss is acceptable as per previous instructions for dev environment.
