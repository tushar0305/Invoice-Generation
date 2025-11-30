-- Create shop_loyalty_settings table
CREATE TABLE IF NOT EXISTS public.shop_loyalty_settings (
  shop_id uuid NOT NULL PRIMARY KEY REFERENCES shops(id) ON DELETE CASCADE,
  is_enabled boolean DEFAULT false,
  
  -- Earning Rules
  earning_type text CHECK (earning_type IN ('flat', 'percentage')),
  flat_points_ratio numeric(10, 2), -- Points per currency unit (e.g. 0.01 for 1 point per 100)
  percentage_back numeric(5, 2), -- Percentage of invoice amount
  
  -- Redemption Rules
  redemption_enabled boolean DEFAULT true,
  redemption_conversion_rate numeric(10, 2) DEFAULT 1.0, -- Value of 1 point in currency
  max_redemption_percentage numeric(5, 2), -- Max % of invoice value
  min_points_required integer DEFAULT 0,
  allowed_categories text[], -- e.g. ['gold', 'silver']
  
  -- Expiry
  points_validity_days integer, -- NULL means never expire
  
  -- Earning Conditions
  earn_on_discounted_items boolean DEFAULT true,
  earn_on_full_payment_only boolean DEFAULT false,
  excluded_categories text[],
  
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shop_loyalty_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shop_loyalty_settings
CREATE POLICY "Users can view loyalty settings for their shops" ON public.shop_loyalty_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_shop_roles
      WHERE user_shop_roles.shop_id = shop_loyalty_settings.shop_id
      AND user_shop_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and managers can update loyalty settings" ON public.shop_loyalty_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_shop_roles
      WHERE user_shop_roles.shop_id = shop_loyalty_settings.shop_id
      AND user_shop_roles.user_id = auth.uid()
      AND user_shop_roles.role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Owners can insert loyalty settings" ON public.shop_loyalty_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_shop_roles
      WHERE user_shop_roles.shop_id = shop_loyalty_settings.shop_id
      AND user_shop_roles.user_id = auth.uid()
      AND user_shop_roles.role = 'owner'
    )
  );

-- Create customer_ledger table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.customer_ledger (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NULL,
  shop_id uuid NULL,
  invoice_id uuid NULL,
  type text NOT NULL,
  amount numeric(10, 2) NOT NULL,
  description text NULL,
  due_date timestamp with time zone NULL,
  is_cleared boolean NULL DEFAULT false,
  created_by uuid NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT customer_ledger_pkey PRIMARY KEY (id),
  CONSTRAINT customer_ledger_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users (id),
  CONSTRAINT customer_ledger_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
  CONSTRAINT customer_ledger_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE SET NULL,
  CONSTRAINT customer_ledger_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES shops (id) ON DELETE CASCADE,
  CONSTRAINT customer_ledger_type_check CHECK (
    (type = ANY (ARRAY['credit'::text, 'debit'::text]))
  )
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_ledger_customer_pending ON public.customer_ledger USING btree (customer_id) TABLESPACE pg_default
WHERE (is_cleared = false);

-- Enable RLS for customer_ledger
ALTER TABLE public.customer_ledger ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_ledger
CREATE POLICY "Users can view ledger for their shops" ON public.customer_ledger
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_shop_roles
      WHERE user_shop_roles.shop_id = customer_ledger.shop_id
      AND user_shop_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert ledger entries for their shops" ON public.customer_ledger
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_shop_roles
      WHERE user_shop_roles.shop_id = customer_ledger.shop_id
      AND user_shop_roles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update ledger entries for their shops" ON public.customer_ledger
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_shop_roles
      WHERE user_shop_roles.shop_id = customer_ledger.shop_id
      AND user_shop_roles.user_id = auth.uid()
    )
  );
