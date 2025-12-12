-- Rate Limits Table
create table if not exists rate_limits (
    key text primary key,
    points integer default 0,
    expires_at timestamptz not null
);

-- RPC to check and increment
create or replace function check_rate_limit(
    p_key text,
    p_limit integer,
    p_window_seconds integer
)
returns boolean
language plpgsql
security definer
as $$
declare
    current_points integer;
    expiration timestamptz;
begin
    -- 1. Clean up expired records (lazy cleanup)
    -- Ideally run this via cron, but doing it on write is fine for low volume
    -- To avoid locking issues, maybe skip this or do it probabilistically?
    -- Let's just do it for this key or overall? Overall might be slow.
    -- Let's delete *this* key if expired.
    delete from rate_limits where key = p_key and expires_at < now();

    -- 2. Upsert
    insert into rate_limits (key, points, expires_at)
    values (p_key, 1, now() + (p_window_seconds || ' seconds')::interval)
    on conflict (key)
    do update set 
        points = rate_limits.points + 1
    returning points, expires_at into current_points, expiration;

    -- 3. Check limit
    return current_points <= p_limit;
end;
$$;
