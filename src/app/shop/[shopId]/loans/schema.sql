-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. LOAN CUSTOMERS TABLE
create table if not exists loan_customers (
  id uuid default uuid_generate_v4() primary key,
  shop_id uuid references shops(id) on delete cascade not null,
  name text not null,
  phone text,
  email text,
  address text,
  photo_url text,
  kyc_document_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. LOANS TABLE
create table if not exists loans (
  id uuid default uuid_generate_v4() primary key,
  shop_id uuid references shops(id) on delete cascade not null,
  customer_id uuid references loan_customers(id) on delete cascade not null,
  loan_number text not null,
  status text not null check (status in ('active', 'closed', 'overdue', 'rejected')),
  repayment_type text check (repayment_type in ('interest_only', 'emi', 'bullet')), -- New field
  principal_amount numeric not null check (principal_amount >= 0),
  interest_rate numeric not null check (interest_rate >= 0), -- Annual Rate %
  tenure_months integer, -- New field
  emi_amount numeric, -- New field
  start_date date not null default current_date,
  end_date date, -- Used as Due Date
  total_interest_accrued numeric default 0,
  total_amount_paid numeric default 0,
  settlement_amount numeric,
  settlement_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. LOAN COLLATERAL TABLE
create table if not exists loan_collateral (
  id uuid default uuid_generate_v4() primary key,
  loan_id uuid references loans(id) on delete cascade not null,
  item_name text not null,
  item_type text not null check (item_type in ('gold', 'silver', 'diamond', 'other')),
  gross_weight numeric not null default 0,
  net_weight numeric not null default 0,
  purity text,
  estimated_value numeric,
  description text,
  photo_urls text[], -- Array of URLs
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. LOAN PAYMENTS TABLE
create table if not exists loan_payments (
  id uuid default uuid_generate_v4() primary key,
  loan_id uuid references loans(id) on delete cascade not null,
  payment_date date not null default current_date,
  amount numeric not null check (amount > 0),
  payment_type text not null check (payment_type in ('principal', 'interest', 'full_settlement')),
  payment_method text not null check (payment_method in ('cash', 'upi', 'bank_transfer')),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROW LEVEL SECURITY (RLS) POLICIES
-- We assume a table 'user_shop_roles' exists mapping users to shops.

-- Enable RLS
alter table loan_customers enable row level security;
alter table loans enable row level security;
alter table loan_collateral enable row level security;
alter table loan_payments enable row level security;

-- Helper policy to check shop access
-- (This logic assumes user_shop_roles has columns: user_id, shop_id)

-- Policy for LOAN CUSTOMERS
create policy "Users can view customers for their shop"
  on loan_customers for select
  using (
    exists (
      select 1 from user_shop_roles
      where user_shop_roles.shop_id = loan_customers.shop_id
      and user_shop_roles.user_id = auth.uid()
    )
  );

create policy "Users can insert customers for their shop"
  on loan_customers for insert
  with check (
    exists (
      select 1 from user_shop_roles
      where user_shop_roles.shop_id = loan_customers.shop_id
      and user_shop_roles.user_id = auth.uid()
    )
  );

create policy "Users can update customers for their shop"
  on loan_customers for update
  using (
    exists (
      select 1 from user_shop_roles
      where user_shop_roles.shop_id = loan_customers.shop_id
      and user_shop_roles.user_id = auth.uid()
    )
  );

-- Policy for LOANS
create policy "Users can view loans for their shop"
  on loans for select
  using (
    exists (
      select 1 from user_shop_roles
      where user_shop_roles.shop_id = loans.shop_id
      and user_shop_roles.user_id = auth.uid()
    )
  );

create policy "Users can insert loans for their shop"
  on loans for insert
  with check (
    exists (
      select 1 from user_shop_roles
      where user_shop_roles.shop_id = loans.shop_id
      and user_shop_roles.user_id = auth.uid()
    )
  );

create policy "Users can update loans for their shop"
  on loans for update
  using (
    exists (
      select 1 from user_shop_roles
      where user_shop_roles.shop_id = loans.shop_id
      and user_shop_roles.user_id = auth.uid()
    )
  );

-- Policy for LOAN COLLATERAL (Access via Loan -> Shop)
create policy "Users can view collateral for their shop loans"
  on loan_collateral for select
  using (
    exists (
      select 1 from loans
      join user_shop_roles on loans.shop_id = user_shop_roles.shop_id
      where loans.id = loan_collateral.loan_id
      and user_shop_roles.user_id = auth.uid()
    )
  );

create policy "Users can insert collateral for their shop loans"
  on loan_collateral for insert
  with check (
    exists (
      select 1 from loans
      join user_shop_roles on loans.shop_id = user_shop_roles.shop_id
      where loans.id = loan_collateral.loan_id
      and user_shop_roles.user_id = auth.uid()
    )
  );

-- Policy for LOAN PAYMENTS (Access via Loan -> Shop)
create policy "Users can view payments for their shop loans"
  on loan_payments for select
  using (
    exists (
      select 1 from loans
      join user_shop_roles on loans.shop_id = user_shop_roles.shop_id
      where loans.id = loan_payments.loan_id
      and user_shop_roles.user_id = auth.uid()
    )
  );

create policy "Users can insert payments for their shop loans"
  on loan_payments for insert
  with check (
    exists (
      select 1 from loans
      join user_shop_roles on loans.shop_id = user_shop_roles.shop_id
      where loans.id = loan_payments.loan_id
      and user_shop_roles.user_id = auth.uid()
    )
  );
