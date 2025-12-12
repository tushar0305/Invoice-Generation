-- Create loan_documents table
create table if not exists loan_documents (
  id uuid default uuid_generate_v4() primary key,
  loan_id uuid references loans(id) on delete cascade not null,
  shop_id uuid references shops(id) on delete cascade not null,
  name text not null,
  type text not null,
  url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table loan_documents enable row level security;

-- Policies
create policy "Users can view documents for their shop loans"
  on loan_documents for select
  using (
    exists (
      select 1 from user_shop_roles
      where user_shop_roles.shop_id = loan_documents.shop_id
      and user_shop_roles.user_id = auth.uid()
    )
  );

create policy "Users can insert documents for their shop loans"
  on loan_documents for insert
  with check (
    exists (
      select 1 from user_shop_roles
      where user_shop_roles.shop_id = loan_documents.shop_id
      and user_shop_roles.user_id = auth.uid()
    )
  );
