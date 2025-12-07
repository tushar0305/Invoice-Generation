-- 1. AUDIT LOGS TABLE
create table if not exists audit_logs (
  id uuid default uuid_generate_v4() primary key,
  shop_id uuid references shops(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  action text not null, -- CREATE, UPDATE, DELETE
  entity_type text not null, -- e.g., 'loan', 'payment'
  entity_id text not null, -- Store as text to support various ID types
  metadata jsonb default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table audit_logs enable row level security;

create policy "Shop owners can view audit logs"
  on audit_logs for select
  using (
    exists (
      select 1 from user_shop_roles
      where user_shop_roles.shop_id = audit_logs.shop_id
      and user_shop_roles.user_id = auth.uid()
      and user_shop_roles.role in ('owner', 'manager')
    )
  );

create policy "System can insert audit logs"
  on audit_logs for insert
  with check (true); -- Allow inserts from authenticated users (application logic controls valid logging)

-- 2. ADD LOAN PAYMENT FUNCTION
create or replace function add_loan_payment(
  p_loan_id uuid,
  p_amount numeric,
  p_payment_type text,
  p_payment_method text,
  p_notes text,
  p_user_id uuid
) returns json language plpgsql security definer as $$
declare
  v_loan_status text;
  v_current_paid numeric;
  v_principal numeric;
  v_new_total numeric;
  v_payment_id uuid;
begin
  -- Lock loan row
  select status, total_amount_paid, principal_amount
  into v_loan_status, v_current_paid, v_principal
  from loans where id = p_loan_id
  for update;

  if not found then
    raise exception 'Loan not found';
  end if;

  if v_loan_status = 'closed' or v_loan_status = 'rejected' then
    raise exception 'Cannot add payment to a closed loan';
  end if;

  -- Insert payment
  insert into loan_payments (loan_id, amount, payment_type, payment_method, notes)
  values (p_loan_id, p_amount, p_payment_type, p_payment_method, p_notes)
  returning id into v_payment_id;

  -- Update loan totals
  v_new_total := v_current_paid + p_amount;
  update loans
  set total_amount_paid = v_new_total,
      updated_at = now()
  where id = p_loan_id;

  return json_build_object(
    'payment_id', v_payment_id,
    'previous_total', v_current_paid,
    'new_total', v_new_total
  );
end;
$$;

-- 3. CLOSE LOAN FUNCTION
create or replace function close_loan(
  p_loan_id uuid,
  p_settlement_amount numeric,
  p_settlement_notes text,
  p_user_id uuid
) returns json language plpgsql security definer as $$
declare
  v_loan_status text;
  v_principal numeric;
  v_total_paid numeric;
  v_outstanding numeric;
  v_final_settlement numeric;
begin
  -- Lock loan row
  select status, principal_amount, total_amount_paid
  into v_loan_status, v_principal, v_total_paid
  from loans where id = p_loan_id
  for update;

  if not found then
    raise exception 'Loan not found';
  end if;

  if v_loan_status = 'closed' then
    raise exception 'Loan is already closed';
  end if;

  -- Determine final numbers
  v_final_settlement := coalesce(p_settlement_amount, v_total_paid);
  v_outstanding := v_principal - v_total_paid; -- Simple logic, can be complex with interest

  -- Update loan status
  update loans
  set status = 'closed',
      end_date = current_date,
      settlement_amount = v_final_settlement,
      settlement_notes = p_settlement_notes,
      updated_at = now()
  where id = p_loan_id;

  return json_build_object(
    'loan_id', p_loan_id,
    'end_date', current_date,
    'settlement_amount', v_final_settlement,
    'outstanding', v_outstanding
  );
end;
$$;
