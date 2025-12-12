-- Migration: Subscription & Usage Tracking System

-- 1. Plans Table
create table if not exists plans (
    id text primary key,
    name text not null,
    description text,
    price_monthly integer default 0,
    price_yearly integer default 0,
    limits jsonb not null default '{}'::jsonb, -- { "invoices": 100, "staff": 2, "ai_tokens": 10000 }
    features jsonb not null default '{}'::jsonb, -- { "can_remove_branding": false }
    created_at timestamptz default now()
);

-- 2. Shop Subscriptions
create table if not exists shop_subscriptions (
    shop_id uuid references shops(id) on delete cascade primary key,
    plan_id text references plans(id),
    status text default 'active', -- active, past_due, canceled, trialing
    current_period_start timestamptz default now(),
    current_period_end timestamptz default (now() + interval '30 days'),
    cancel_at_period_end boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 3. Shop Usage Limits (Aggregates)
create table if not exists shop_usage_limits (
    shop_id uuid references shops(id) on delete cascade,
    period_start timestamptz not null,
    invoices_created integer default 0,
    customers_added integer default 0,
    staff_seats_occupied integer default 0,
    ai_tokens_used bigint default 0,
    storage_bytes bigint default 0,
    updated_at timestamptz default now(),
    primary key (shop_id, period_start)
);

-- 4. Usage Events (Audit Log)
create table if not exists usage_events (
    id uuid default gen_random_uuid() primary key,
    shop_id uuid references shops(id) on delete cascade,
    event_type text not null, -- invoice_created, customer_created, ai_completion
    metric text not null, -- invoices_created, ai_tokens_used
    amount integer not null default 1,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

-- Enable RLS
alter table plans enable row level security;
alter table shop_subscriptions enable row level security;
alter table shop_usage_limits enable row level security;
alter table usage_events enable row level security;

-- Policies
create policy "Public read access to plans" on plans for select using (true);

create policy "Shops can view own subscription" on shop_subscriptions for select
    using (auth.uid() in (select user_id from user_shop_roles where shop_id = shop_subscriptions.shop_id));

create policy "Shops can view own usage" on shop_usage_limits for select
    using (auth.uid() in (select user_id from user_shop_roles where shop_id = shop_usage_limits.shop_id));

-- Triggers for Automatic Counting

-- Function: Increment Invoice Count
create or replace function handle_new_invoice()
returns trigger as $$
declare
    current_period timestamptz;
begin
    -- Get current subscription period start
    select current_period_start into current_period
    from shop_subscriptions
    where shop_id = new.shop_id;

    -- If no subscription found, default to beginning of month (fallback)
    if current_period is null then
        current_period := date_trunc('month', now());
    end if;

    -- Upsert usage record
    insert into shop_usage_limits (shop_id, period_start, invoices_created)
    values (new.shop_id, current_period, 1)
    on conflict (shop_id, period_start)
    do update set invoices_created = shop_usage_limits.invoices_created + 1, updated_at = now();

    -- Log event
    insert into usage_events (shop_id, event_type, metric, amount, metadata)
    values (new.shop_id, 'invoice_created', 'invoices_created', 1, jsonb_build_object('invoice_id', new.id));

    return new;
end;
$$ language plpgsql security definer;

-- Trigger: New Invoice
drop trigger if exists on_new_invoice on invoices;
create trigger on_new_invoice
    after insert on invoices
    for each row
    execute function handle_new_invoice();


-- Function: Increment Customer Count
create or replace function handle_new_customer()
returns trigger as $$
declare
    current_period timestamptz;
begin
    select current_period_start into current_period
    from shop_subscriptions
    where shop_id = new.shop_id;

    if current_period is null then
        current_period := date_trunc('month', now());
    end if;

    insert into shop_usage_limits (shop_id, period_start, customers_added)
    values (new.shop_id, current_period, 1)
    on conflict (shop_id, period_start)
    do update set customers_added = shop_usage_limits.customers_added + 1, updated_at = now();

    insert into usage_events (shop_id, event_type, metric, amount, metadata)
    values (new.shop_id, 'customer_created', 'customers_added', 1, jsonb_build_object('customer_id', new.id));

    return new;
end;
$$ language plpgsql security definer;

-- Trigger: New Loan Customer
drop trigger if exists on_new_loan_customer on loan_customers;
create trigger on_new_loan_customer
    after insert on loan_customers
    for each row
    execute function handle_new_customer();

-- Seed Default Plans
insert into plans (id, name, description, price_monthly, limits, features)
values
    ('free', 'Starter', 'For small shops', 0,
     '{"invoices": 50, "customers": 100, "staff": 1, "ai_tokens": 5000}'::jsonb,
     '{"ai_insights": false, "custom_branding": false}'::jsonb),
    ('gold', 'Growth', 'For growing businesses', 999,
     '{"invoices": 1000, "customers": 5000, "staff": 5, "ai_tokens": 100000}'::jsonb,
     '{"ai_insights": true, "custom_branding": true}'::jsonb),
    ('platinum', 'Enterprise', 'Unlimited scale', 2999,
     '{"invoices": -1, "customers": -1, "staff": -1, "ai_tokens": 500000}'::jsonb,
     '{"ai_insights": true, "custom_branding": true, "priority_support": true}'::jsonb)
on conflict (id) do nothing;
