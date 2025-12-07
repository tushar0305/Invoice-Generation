-- SUBSCRIPTIONS TABLE
create type subscription_status as enum ('active', 'past_due', 'canceled', 'unpaid', 'trialing');
create type subscription_plan as enum ('free', 'pro', 'enterprise');

create table if not exists subscriptions (
  id uuid default uuid_generate_v4() primary key,
  shop_id uuid references shops(id) on delete cascade not null,
  razorpay_subscription_id text unique,
  razorpay_customer_id text,
  razorpay_plan_id text, -- The Plan ID from Razorpay Dashboard
  plan_id subscription_plan not null default 'free',
  status subscription_status not null default 'active',
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean default false,
  billing_cycle_anchor timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table subscriptions enable row level security;

create policy "Shop owners can view their subscription"
  on subscriptions for select
  using (
    exists (
      select 1 from user_shop_roles
      where user_shop_roles.shop_id = subscriptions.shop_id
      and user_shop_roles.user_id = auth.uid()
      and user_shop_roles.role in ('owner', 'manager')
    )
  );

-- Only system/service_role should insert/update subscriptions ideally,
-- but for now we allow owners to insert initial records if creating via Client side (though Server Action is preferred).
-- Better to keep strict:
create policy "Service role manages subscriptions"
  on subscriptions for all
  using ( auth.uid() is null ); -- Or specific check if we use a service role client

-- Allow read for checking limits
create policy "Users can read subscription for limits"
  on subscriptions for select
  using (
    exists (
      select 1 from user_shop_roles
      where user_shop_roles.shop_id = subscriptions.shop_id
      and user_shop_roles.user_id = auth.uid()
    )
  );
