-- =============================================
-- Cleanup Invitation System Migration
-- =============================================

-- Drop the shop_invites table
DROP TABLE IF EXISTS shop_invites CASCADE;

-- Drop the RPC functions
DROP FUNCTION IF EXISTS generate_shop_invite(UUID, TEXT);
DROP FUNCTION IF EXISTS accept_shop_invite(TEXT);
DROP FUNCTION IF EXISTS generate_invite_code(); -- Old one if it exists

-- No need to drop columns from user_shop_roles as they might be useful for history, 
-- but we can drop the unique constraint on invite_code if we want.
-- For now, let's keep the columns (invite_code, invited_by, accepted_at) as they are useful for tracking who added whom.

-- =============================================
-- Migration Complete!
-- =============================================
