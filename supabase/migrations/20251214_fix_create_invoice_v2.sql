-- Migration: Fix ambiguous alias in create_invoice_v2
-- Date: 2025-12-14

-- NOTE: Adjust column names/types if they differ in your schema.
-- This implementation assumes tables:
--   invoices(id uuid pk, shop_id uuid, customer_id uuid null, customer_snapshot jsonb, invoice_date date,
--            discount numeric, notes text, status text, grand_total numeric, subtotal numeric,
--            sgst_amount numeric, cgst_amount numeric, loyalty_points_earned int, loyalty_points_redeemed int)
--   invoice_items(id uuid pk default gen_random_uuid(), invoice_id uuid fk, description text,
--                 purity text, gross_weight numeric, net_weight numeric, rate numeric, making numeric,
--                 stone_amount numeric null, making_rate numeric null)
--   inventory_items(id uuid pk, status text, sold_invoice_id uuid null, sold_at timestamptz null)

-- This function uses explicit alias j_item for jsonb_to_recordset to avoid ambiguity.

create or replace function public.create_invoice_v2(
  p_shop_id uuid,
  p_customer_id uuid,
  p_customer_snapshot jsonb,
  p_items jsonb,
  p_discount numeric,
  p_notes text,
  p_status text,
  p_loyalty_points_earned integer default 0,
  p_loyalty_points_redeemed integer default 0
) returns table(invoice_id uuid) language plpgsql as $$
declare
  v_invoice_id uuid;
  v_invoice_number text;
  v_subtotal numeric := 0;
  v_sgst_rate numeric := 1.5; -- Adjust if stored elsewhere
  v_cgst_rate numeric := 1.5; -- Adjust if stored elsewhere
  v_sgst_amount numeric := 0;
  v_cgst_amount numeric := 0;
  v_grand_total numeric := 0;
  v_settings record;
  v_effective_points_earned integer := 0;
  v_effective_points_redeemed integer := 0;
  v_customer_current_points integer := 0;
begin
  -- Generate invoice number
  select coalesce(max(cast(substring(invoice_number from '[0-9]+$') as integer)), 0) + 1
  into v_invoice_number
  from invoices
  where shop_id = p_shop_id;
  
  v_invoice_number := 'INV-' || lpad(v_invoice_number, 6, '0');
  
  -- Compute subtotal from items (net * rate + making_rate * net + stoneAmount)
  select coalesce(sum((coalesce(j_item.netWeight,0) * coalesce(j_item.rate,0))
                    + (coalesce(j_item.makingRate,0) * coalesce(j_item.netWeight,0))
                    + coalesce(j_item.stoneAmount,0)), 0)
  into v_subtotal
  from jsonb_to_recordset(p_items) as j_item(
    item_id uuid,
    stockId uuid,
    description text,
    purity text,
    grossWeight numeric,
    netWeight numeric,
    rate numeric,
    making numeric,
    stoneAmount numeric,
    makingRate numeric
  );

  v_sgst_amount := v_subtotal * (v_sgst_rate / 100);
  v_cgst_amount := v_subtotal * (v_cgst_rate / 100);
  v_grand_total := v_subtotal - coalesce(p_discount,0) + v_sgst_amount + v_cgst_amount;

  -- Loyalty: compute earn/redeem using shop settings when customer present
  if p_customer_id is not null then
    select *
    into v_settings
    from shop_loyalty_settings
    where shop_id = p_shop_id;

    if v_settings is not null and coalesce(v_settings.is_enabled, false) then
      -- Load customer's current points
      select coalesce(loyalty_points,0)
        into v_customer_current_points
      from customers
      where id = p_customer_id;

      -- Calculate points to earn
      if v_settings.earning_type = 'flat' and v_settings.flat_points_ratio is not null then
        v_effective_points_earned := floor(v_grand_total * v_settings.flat_points_ratio);
      elsif v_settings.earning_type = 'percentage' and v_settings.percentage_back is not null then
        v_effective_points_earned := floor(v_grand_total * (v_settings.percentage_back / 100));
      else
        v_effective_points_earned := coalesce(p_loyalty_points_earned, 0);
      end if;

      -- Validate and apply redemption if enabled
      if coalesce(v_settings.redemption_enabled, false) and coalesce(p_loyalty_points_redeemed,0) > 0 then
        -- Basic validations
        if v_settings.min_redemption_points is not null and p_loyalty_points_redeemed < v_settings.min_redemption_points then
          raise exception 'Minimum redemption points not met: %', v_settings.min_redemption_points;
        end if;
        if p_loyalty_points_redeemed > v_customer_current_points then
          raise exception 'Insufficient loyalty points. Available: %, Requested: %', v_customer_current_points, p_loyalty_points_redeemed;
        end if;
        v_effective_points_redeemed := p_loyalty_points_redeemed;
      end if;
    end if;
  end if;

  -- Insert invoice
  insert into invoices(
    shop_id, customer_id, customer_snapshot, invoice_number, invoice_date,
    discount, notes, status, grand_total, subtotal,
    sgst_amount, cgst_amount
  ) values (
    p_shop_id, p_customer_id, p_customer_snapshot, v_invoice_number, current_date,
    coalesce(p_discount,0), p_notes, p_status, v_grand_total, v_subtotal,
    v_sgst_amount, v_cgst_amount
  ) returning id into v_invoice_id;

  -- Insert items
  insert into invoice_items(
    invoice_id, description, purity, gross_weight, net_weight, rate, making, stone_amount, making_rate
  )
  select v_invoice_id,
         j_item.description,
         coalesce(j_item.purity,'22K'),
         coalesce(j_item.grossWeight,0),
         coalesce(j_item.netWeight,0),
         coalesce(j_item.rate,0),
         coalesce(j_item.making,0),
         coalesce(j_item.stoneAmount,0),
         coalesce(j_item.makingRate,0)
  from jsonb_to_recordset(p_items) as j_item(
    item_id uuid,
    stockId uuid,
    description text,
    purity text,
    grossWeight numeric,
    netWeight numeric,
    rate numeric,
    making numeric,
    stoneAmount numeric,
    makingRate numeric
  );

  -- Mark inventory items SOLD if stockId provided
  update inventory_items ii
  set status = 'SOLD', sold_invoice_id = v_invoice_id, sold_at = now()
  from (
    select j_item.stockId as stock_id
    from jsonb_to_recordset(p_items) as j_item(
      item_id uuid,
      stockId uuid,
      description text,
      purity text,
      grossWeight numeric,
      netWeight numeric,
      rate numeric,
      making numeric,
      stoneAmount numeric,
      makingRate numeric
    )
    where j_item.stockId is not null
  ) s
  where ii.id = s.stock_id;

  -- Apply loyalty updates if applicable
  if p_customer_id is not null and v_settings is not null and coalesce(v_settings.is_enabled,false) then
    -- Update customer points: add earned, subtract redeemed
    update customers
    set loyalty_points = coalesce(loyalty_points,0) + coalesce(v_effective_points_earned,0) - coalesce(v_effective_points_redeemed,0)
    where id = p_customer_id;

    -- Log earning
    if coalesce(v_effective_points_earned,0) > 0 then
      insert into customer_loyalty_logs(id, customer_id, shop_id, invoice_id, points_change, reason, created_at)
      values (extensions.uuid_generate_v4(), p_customer_id, p_shop_id, v_invoice_id, v_effective_points_earned, 'earn', now());
    end if;

    -- Log redemption
    if coalesce(v_effective_points_redeemed,0) > 0 then
      insert into customer_loyalty_logs(id, customer_id, shop_id, invoice_id, points_change, reason, created_at)
      values (extensions.uuid_generate_v4(), p_customer_id, p_shop_id, v_invoice_id, -v_effective_points_redeemed, 'redeem', now());
    end if;
  end if;

  return query select v_invoice_id as invoice_id;
end;
$$;
