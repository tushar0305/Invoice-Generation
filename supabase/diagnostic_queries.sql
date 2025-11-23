-- DIAGNOSTIC QUERIES - Run these in Supabase SQL Editor
-- Run these while logged in as STAFF user to see what's visible

-- 1. Check if you can see your own user_shop_roles
SELECT 'user_shop_roles' as table_name, * FROM user_shop_roles WHERE user_id = auth.uid();

-- 2. Check if you can see shops
SELECT 'shops' as table_name, * FROM shops LIMIT 10;

-- 3. Check if you can see invoices  
SELECT 'invoices' as table_name, count(*) as count FROM invoices;

-- 4. Check if you can see stock_items
SELECT 'stock_items' as table_name, count(*) as count FROM stock_items;

-- 5. Who am I?
SELECT 'current_user' as info, auth.uid() as user_id, auth.email() as email;

-- 6. Check existing RLS policies on user_shop_roles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_shop_roles';

-- 7. Check existing RLS policies on shops
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'shops';

-- 8. Check existing RLS policies on invoices
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'invoices';
