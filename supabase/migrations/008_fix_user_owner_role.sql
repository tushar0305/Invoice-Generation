-- =============================================
-- Fix: Assign Owner Role to User
-- =============================================
-- This migration assigns the owner role to users who created shops
-- but don't have a role assigned in user_shop_roles

-- Insert owner roles for shop creators who don't have a role yet
INSERT INTO user_shop_roles (user_id, shop_id, role, invited_by, accepted_at)
SELECT 
    s.created_by as user_id,
    s.id as shop_id,
    'owner' as role,
    s.created_by as invited_by,
    now() as accepted_at
FROM shops s
WHERE NOT EXISTS (
    SELECT 1 FROM user_shop_roles usr 
    WHERE usr.user_id = s.created_by 
    AND usr.shop_id = s.id
)
AND s.created_by IS NOT NULL;

-- Verify the fix
-- SELECT u.email, s.shop_name, usr.role
-- FROM auth.users u
-- JOIN user_shop_roles usr ON usr.user_id = u.id
-- JOIN shops s ON s.id = usr.shop_id;
