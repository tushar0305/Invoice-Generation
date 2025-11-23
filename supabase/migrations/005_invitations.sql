-- =============================================
-- Invitation System Migration
-- =============================================

-- Table: shop_invites
-- Stores pending invitations that are not yet tied to a user
CREATE TABLE IF NOT EXISTS shop_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('manager', 'staff')),
  invite_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours'),
  is_used BOOLEAN DEFAULT false,
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shop_invites_code ON shop_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_shop_invites_shop ON shop_invites(shop_id);

-- Enable RLS
ALTER TABLE shop_invites ENABLE ROW LEVEL SECURITY;

-- Policies
-- Owners can view invites for their shop
CREATE POLICY "Owners can view shop invites" ON shop_invites
  FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM user_shop_roles 
      WHERE user_id = auth.uid() AND role = 'owner' AND is_active = true
    )
  );

-- Owners can create invites
CREATE POLICY "Owners can create invites" ON shop_invites
  FOR INSERT
  WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM user_shop_roles 
      WHERE user_id = auth.uid() AND role = 'owner' AND is_active = true
    )
    AND created_by = auth.uid()
  );

-- Helper Function to generate random code
CREATE OR REPLACE FUNCTION generate_random_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- RPC: Generate Shop Invite
CREATE OR REPLACE FUNCTION generate_shop_invite(
  p_shop_id UUID,
  p_role TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_is_owner BOOLEAN;
BEGIN
  -- Check if user is owner of the shop
  SELECT EXISTS (
    SELECT 1 FROM user_shop_roles
    WHERE user_id = auth.uid() 
      AND shop_id = p_shop_id 
      AND role = 'owner'
      AND is_active = true
  ) INTO v_is_owner;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'Only shop owners can generate invites';
  END IF;

  -- Generate unique code
  LOOP
    v_code := generate_random_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM shop_invites WHERE invite_code = v_code AND is_used = false AND expires_at > now());
  END LOOP;

  -- Insert invite
  INSERT INTO shop_invites (shop_id, role, invite_code, created_by)
  VALUES (p_shop_id, p_role, v_code, auth.uid());

  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Accept Shop Invite
CREATE OR REPLACE FUNCTION accept_shop_invite(
  p_invite_code TEXT
)
RETURNS UUID AS $$
DECLARE
  v_invite RECORD;
  v_existing_role RECORD;
BEGIN
  -- Find valid invite
  SELECT * INTO v_invite
  FROM shop_invites
  WHERE invite_code = p_invite_code
    AND is_used = false
    AND expires_at > now();

  IF v_invite IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite code';
  END IF;

  -- Check if user already has a role in this shop
  SELECT * INTO v_existing_role
  FROM user_shop_roles
  WHERE user_id = auth.uid() AND shop_id = v_invite.shop_id;

  IF v_existing_role IS NOT NULL THEN
    RAISE EXCEPTION 'You are already a member of this shop';
  END IF;

  -- Create user role
  INSERT INTO user_shop_roles (user_id, shop_id, role, invited_by, invite_code, accepted_at)
  VALUES (auth.uid(), v_invite.shop_id, v_invite.role, v_invite.created_by, p_invite_code, now());

  -- Mark invite as used
  UPDATE shop_invites
  SET is_used = true, used_by = auth.uid(), used_at = now()
  WHERE id = v_invite.id;

  RETURN v_invite.shop_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
