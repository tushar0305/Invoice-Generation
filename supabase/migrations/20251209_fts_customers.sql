create extension if not exists unaccent;

-- Use a trigger-maintained tsvector (generated columns require IMMUTABLE functions)
alter table if exists public.customers
    add column if not exists search_vector tsvector;

-- Trigger function to maintain search_vector
create or replace function public.update_customers_search_vector()
returns trigger
language plpgsql
as $$
begin
    new.search_vector := to_tsvector(
        'simple',
        unaccent(coalesce(new.name, '')) || ' ' || unaccent(coalesce(new.email, '')) || ' ' || unaccent(coalesce(new.phone, ''))
    );
    return new;
end;
$$;

-- Create trigger (idempotent: drop if exists then create)
drop trigger if exists trg_customers_search_vector on public.customers;
create trigger trg_customers_search_vector
before insert or update of name, email, phone
on public.customers
for each row execute function public.update_customers_search_vector();

-- Index for fast FTS lookup
create index if not exists customers_search_vector_idx on public.customers using gin (search_vector);

-- Backfill existing rows to ensure search_vector is populated
update public.customers c
set search_vector = to_tsvector(
    'simple',
    unaccent(coalesce(c.name, '')) || ' ' || unaccent(coalesce(c.email, '')) || ' ' || unaccent(coalesce(c.phone, ''))
)
where c.search_vector is null;

-- Optimized RPC: search customers with ranking and highlights
-- Drop the existing function before redefining with a changed return type
drop function if exists public.search_customers(uuid, text, int, int);
create or replace function public.search_customers(
    p_shop_id uuid,
    p_query text,
    p_limit int default 10,
    p_offset int default 0
) returns table (
    id uuid,
    shop_id uuid,
    name text,
    email text,
    phone text,
    address text,
    state text,
    pincode text,
    loyalty_points int,
    rank real,
    name_highlight text,
    email_highlight text,
    phone_highlight text
) language sql stable as $$
    select
        c.id,
        c.shop_id,
        c.name,
        c.email,
        c.phone,
        c.address,
        c.state,
        c.pincode,
        c.loyalty_points,
        ts_rank(c.search_vector, websearch_to_tsquery('simple', unaccent(coalesce(p_query, '')))) as rank,
        ts_headline('simple', coalesce(c.name, ''),  websearch_to_tsquery('simple', unaccent(coalesce(p_query, ''))), 'StartSel=<mark>,StopSel=</mark>,MaxWords=20,MinWords=1,MaxFragments=1') as name_highlight,
        ts_headline('simple', coalesce(c.email, ''), websearch_to_tsquery('simple', unaccent(coalesce(p_query, ''))), 'StartSel=<mark>,StopSel=</mark>,MaxWords=20,MinWords=1,MaxFragments=1') as email_highlight,
        ts_headline('simple', coalesce(c.phone, ''), websearch_to_tsquery('simple', unaccent(coalesce(p_query, ''))), 'StartSel=<mark>,StopSel=</mark>,MaxWords=20,MinWords=1,MaxFragments=1') as phone_highlight
    from public.customers c
    where c.shop_id = p_shop_id
      and (
          coalesce(p_query, '') = ''
          or c.search_vector @@ websearch_to_tsquery('simple', unaccent(coalesce(p_query, '')))
      )
    order by rank desc nulls last, c.created_at desc
    limit greatest(p_limit, 1)
    offset greatest(p_offset, 0);
$$;

-- Count RPC to support pagination
create or replace function public.search_customers_count(
    p_shop_id uuid,
    p_query text
) returns integer language sql stable as $$
    select count(*)::int
    from public.customers c
    where c.shop_id = p_shop_id
      and (
          coalesce(p_query, '') = ''
          or c.search_vector @@ websearch_to_tsquery('simple', unaccent(coalesce(p_query, '')))
      );
$$;
