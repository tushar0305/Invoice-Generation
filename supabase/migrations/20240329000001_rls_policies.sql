-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Helper function to check if user is owner/manager
CREATE OR REPLACE FUNCTION is_shop_admin(shop_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_shop_roles
    WHERE user_id = auth.uid()
    AND shop_id = shop_uuid
    AND role IN ('owner', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is staff
CREATE OR REPLACE FUNCTION is_shop_staff(shop_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_shop_roles
    WHERE user_id = auth.uid()
    AND shop_id = shop_uuid
    AND role = 'staff'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_shop_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_loyalty_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_rates ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Shops
CREATE POLICY "Users can view shops they belong to" ON shops
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_shop_roles WHERE user_id = auth.uid() AND shop_id = shops.id)
  );

CREATE POLICY "Owners can update shop details" ON shops
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_shop_roles WHERE user_id = auth.uid() AND shop_id = shops.id AND role = 'owner')
  );

-- User Shop Roles
CREATE POLICY "Users can view their own roles" ON user_shop_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles" ON user_shop_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_shop_roles admin_roles
      WHERE admin_roles.user_id = auth.uid()
      AND admin_roles.shop_id = user_shop_roles.shop_id
      AND admin_roles.role IN ('owner', 'manager')
    )
  );

-- Market Rates
CREATE POLICY "Anyone can view market rates" ON market_rates
  FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can update rates" ON market_rates
  FOR ALL USING (auth.uid() IS NOT NULL);

-- User Preferences
CREATE POLICY "Users manage their own preferences" ON user_preferences
  FOR ALL USING (user_id = auth.uid());

-- Customers
CREATE POLICY "Shop members can view customers" ON customers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_shop_roles WHERE user_id = auth.uid() AND shop_id = customers.shop_id)
  );

CREATE POLICY "Admins can manage customers" ON customers
  FOR ALL USING (is_shop_admin(shop_id));

-- Stock Items
CREATE POLICY "Shop members can view stock" ON stock_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_shop_roles WHERE user_id = auth.uid() AND shop_id = stock_items.shop_id)
  );

CREATE POLICY "Admins can manage stock" ON stock_items
  FOR ALL USING (is_shop_admin(shop_id));

-- Invoices
CREATE POLICY "Shop members can view invoices" ON invoices
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_shop_roles WHERE user_id = auth.uid() AND shop_id = invoices.shop_id)
  );

CREATE POLICY "Admins can manage invoices" ON invoices
  FOR ALL USING (is_shop_admin(shop_id));

CREATE POLICY "Staff can create invoices" ON invoices
  FOR INSERT WITH CHECK (is_shop_staff(shop_id));

-- Invoice Items
CREATE POLICY "Admins manage invoice items" ON invoice_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND is_shop_admin(invoices.shop_id)
    )
  );

CREATE POLICY "Staff can create invoice items" ON invoice_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND is_shop_staff(invoices.shop_id)
    )
  );

-- Customer Ledger
CREATE POLICY "Admins manage ledger" ON customer_ledger
  FOR ALL USING (is_shop_admin(shop_id));

CREATE POLICY "Staff view ledger" ON customer_ledger
  FOR SELECT USING (is_shop_staff(shop_id));

-- Staff Management
CREATE POLICY "Admins manage staff profiles" ON staff_profiles
  FOR ALL USING (is_shop_admin(shop_id));

CREATE POLICY "Staff view own profile" ON staff_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins manage attendance" ON staff_attendance
  FOR ALL USING (is_shop_admin(shop_id));

CREATE POLICY "Staff view own attendance" ON staff_attendance
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM staff_profiles WHERE id = staff_attendance.staff_id AND user_id = auth.uid())
    OR
    staff_user_id = auth.uid()
  );

CREATE POLICY "Admins manage payments" ON staff_payments
  FOR ALL USING (is_shop_admin(shop_id));

CREATE POLICY "Staff view own payments" ON staff_payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM staff_profiles WHERE id = staff_payments.staff_id AND user_id = auth.uid())
    OR
    staff_user_id = auth.uid()
  );

-- Shop Invitations
CREATE POLICY "Shop owners and managers can view invitations"
    ON shop_invitations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_shop_roles
            WHERE user_shop_roles.shop_id = shop_invitations.shop_id
            AND user_shop_roles.user_id = auth.uid()
            AND user_shop_roles.role IN ('owner', 'manager')
        )
    );

CREATE POLICY "Shop owners and managers can create invitations"
    ON shop_invitations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_shop_roles
            WHERE user_shop_roles.shop_id = shop_invitations.shop_id
            AND user_shop_roles.user_id = auth.uid()
            AND user_shop_roles.role IN ('owner', 'manager')
        )
    );

CREATE POLICY "Shop owners and managers can delete invitations"
    ON shop_invitations FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_shop_roles
            WHERE user_shop_roles.shop_id = shop_invitations.shop_id
            AND user_shop_roles.user_id = auth.uid()
            AND user_shop_roles.role IN ('owner', 'manager')
        )
    );
