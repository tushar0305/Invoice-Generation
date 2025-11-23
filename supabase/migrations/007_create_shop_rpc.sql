-- =============================================
-- RPC: Create New Shop
-- =============================================

-- Function to create a new shop and assign the creator as owner
-- This function is SECURITY DEFINER to bypass RLS on user_shop_roles for the initial assignment
CREATE OR REPLACE FUNCTION create_new_shop(
  p_shop_name TEXT
)
RETURNS UUID AS $$
DECLARE
  v_shop_id UUID;
BEGIN
  -- 1. Create the shop
  INSERT INTO shops (shop_name, created_by)
  VALUES (p_shop_name, auth.uid())
  RETURNING id INTO v_shop_id;

  -- 2. Assign the creator as owner
  INSERT INTO user_shop_roles (user_id, shop_id, role, invited_by, accepted_at)
  VALUES (auth.uid(), v_shop_id, 'owner', auth.uid(), now());

  -- 3. Create initial user preferences if not exists (optional, but good practice)
  INSERT INTO user_preferences (user_id, last_active_shop_id)
  VALUES (auth.uid(), v_shop_id)
  ON CONFLICT (user_id) 
  DO UPDATE SET last_active_shop_id = v_shop_id;

  RETURN v_shop_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
