-- ==========================================
-- Migration 0003: Consolidated Policies
-- Description: Row Level Security (RLS)
-- ==========================================

-- Enable RLS
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_shop_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_loyalty_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_loyalty_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogue_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogue_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogue_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogue_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_collateral ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- New Inventory Tables
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_tag_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_status_history ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------
-- SHOPS
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their shops" ON public.shops;
CREATE POLICY "Users can view their shops" ON public.shops
    FOR SELECT USING (created_by = (select auth.uid()) OR is_shop_member(id));

DROP POLICY IF EXISTS "Users can create shops" ON public.shops;
CREATE POLICY "Users can create shops" ON public.shops
    FOR INSERT WITH CHECK ((select auth.uid()) = created_by);

-- ----------------------------------------------------------
-- USER SHOP ROLES
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "View shop roles" ON public.user_shop_roles;
CREATE POLICY "View shop roles" ON public.user_shop_roles
    FOR SELECT USING (user_id = (select auth.uid()) OR is_shop_member(shop_id));

-- ----------------------------------------------------------
-- USER PREFERENCES
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_preferences;
CREATE POLICY "Users can manage their own preferences" ON public.user_preferences
    FOR ALL USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- ----------------------------------------------------------
-- INVENTORY (Core Module)
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "inventory_items_shop_access" ON inventory_items;
CREATE POLICY "inventory_items_shop_access" ON inventory_items
  FOR ALL USING (public.is_shop_member(shop_id));

DROP POLICY IF EXISTS "inventory_tag_sequences_shop_access" ON inventory_tag_sequences;
CREATE POLICY "inventory_tag_sequences_shop_access" ON inventory_tag_sequences
  FOR ALL USING (public.is_shop_member(shop_id));

DROP POLICY IF EXISTS "inventory_status_history_access" ON inventory_status_history;
CREATE POLICY "inventory_status_history_access" ON inventory_status_history
  FOR ALL USING (item_id IN (SELECT id FROM inventory_items WHERE public.is_shop_member(shop_id)));

-- ----------------------------------------------------------
-- CUSTOMERS
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Manage shop customers" ON public.customers;
CREATE POLICY "Manage shop customers" ON public.customers FOR ALL USING (is_shop_member(shop_id));

-- ----------------------------------------------------------
-- INVOICES & ITEMS
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Manage shop invoices" ON public.invoices;
CREATE POLICY "Manage shop invoices" ON public.invoices FOR ALL USING (is_shop_member(shop_id));

DROP POLICY IF EXISTS "Manage invoice items" ON public.invoice_items;
CREATE POLICY "Manage invoice items" ON public.invoice_items 
    FOR ALL USING (EXISTS (SELECT 1 FROM invoices WHERE id = invoice_items.invoice_id AND is_shop_member(shop_id)));

-- ----------------------------------------------------------
-- LEDGER
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Manage shop ledger" ON public.ledger_transactions;
CREATE POLICY "Manage shop ledger" ON public.ledger_transactions FOR ALL USING (is_shop_member(shop_id));

-- ----------------------------------------------------------
-- STAFF
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Manage shop staff profiles" ON public.staff_profiles;
CREATE POLICY "Manage shop staff profiles" ON public.staff_profiles
    FOR ALL USING (is_shop_owner(shop_id) OR is_shop_admin(shop_id));
CREATE POLICY "View shop staff profiles" ON public.staff_profiles FOR SELECT USING (is_shop_member(shop_id));

DROP POLICY IF EXISTS "Manage shop staff payments" ON public.staff_payments;
CREATE POLICY "Manage shop staff payments" ON public.staff_payments
    FOR ALL USING (is_shop_owner(shop_id) OR is_shop_admin(shop_id));
CREATE POLICY "View shop staff payments" ON public.staff_payments FOR SELECT USING (is_shop_member(shop_id));

DROP POLICY IF EXISTS "Manage shop staff attendance" ON public.staff_attendance;
CREATE POLICY "Manage shop staff attendance" ON public.staff_attendance FOR ALL USING (is_shop_member(shop_id));

DROP POLICY IF EXISTS "Manage shop invitations" ON public.shop_invitations;
CREATE POLICY "Manage shop invitations" ON public.shop_invitations
    FOR INSERT WITH CHECK (is_shop_owner(shop_id));
CREATE POLICY "Update shop invitations" ON public.shop_invitations
    FOR UPDATE USING (is_shop_owner(shop_id));
CREATE POLICY "Delete shop invitations" ON public.shop_invitations
    FOR DELETE USING (is_shop_owner(shop_id));
CREATE POLICY "View shop invitations" ON public.shop_invitations FOR SELECT USING (is_shop_member(shop_id));

-- ----------------------------------------------------------
-- MARKET RATES
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can update market rates" ON public.market_rates;
CREATE POLICY "Authenticated users can update market rates" ON public.market_rates
    FOR ALL USING ((select auth.role()) = 'authenticated');
CREATE POLICY "Everyone can view market rates" ON public.market_rates FOR SELECT USING (true);

-- ----------------------------------------------------------
-- LOYALTY
-- ----------------------------------------------------------
DROP POLICY IF EXISTS "Manage shop loyalty settings" ON public.shop_loyalty_settings;
CREATE POLICY "Manage shop loyalty settings" ON public.shop_loyalty_settings
    FOR ALL USING (is_shop_admin(shop_id));
CREATE POLICY "View shop loyalty settings" ON public.shop_loyalty_settings FOR SELECT USING (is_shop_member(shop_id));

DROP POLICY IF EXISTS "View loyalty logs" ON customer_loyalty_logs;
CREATE POLICY "View loyalty logs" ON customer_loyalty_logs FOR SELECT USING (is_shop_member(shop_id));
DROP POLICY IF EXISTS "Create loyalty logs" ON customer_loyalty_logs;
CREATE POLICY "Create loyalty logs" ON customer_loyalty_logs FOR INSERT WITH CHECK (is_shop_member(shop_id));

-- ----------------------------------------------------------
-- CATALOGUE
-- ----------------------------------------------------------
CREATE POLICY "Owners can manage categories" ON public.catalogue_categories FOR ALL USING (public.is_shop_owner(shop_id));
CREATE POLICY "Everyone can view categories" ON public.catalogue_categories FOR SELECT USING (is_active = true OR public.is_shop_owner(shop_id));

CREATE POLICY "Owners can manage products" ON public.catalogue_products FOR ALL USING (public.is_shop_owner(shop_id));
CREATE POLICY "Everyone can view products" ON public.catalogue_products FOR SELECT USING (is_active = true OR public.is_shop_owner(shop_id));

CREATE POLICY "Owners can manage catalogue settings" ON public.catalogue_settings FOR ALL USING (public.is_shop_owner(shop_id));
CREATE POLICY "Everyone can view catalogue settings" ON public.catalogue_settings FOR SELECT USING (is_active = true OR public.is_shop_owner(shop_id));

CREATE POLICY "Owners can view analytics" ON catalogue_analytics FOR SELECT USING (public.is_shop_owner(shop_id));
CREATE POLICY "Public can log analytics" ON catalogue_analytics FOR INSERT WITH CHECK (true);

-- ----------------------------------------------------------
-- WHATSAPP
-- ----------------------------------------------------------
CREATE POLICY "Manage whatsapp config" ON public.whatsapp_configs FOR ALL USING (is_shop_owner(shop_id));
CREATE POLICY "View whatsapp config" ON public.whatsapp_configs FOR SELECT USING (is_shop_member(shop_id));

CREATE POLICY "Manage templates" ON public.whatsapp_templates FOR ALL USING (is_shop_member(shop_id));
CREATE POLICY "Manage messages" ON public.whatsapp_messages FOR ALL USING (is_shop_member(shop_id));

-- ----------------------------------------------------------
-- LOANS
-- ----------------------------------------------------------
CREATE POLICY "Manage loans" ON public.loans FOR ALL USING (is_shop_member(shop_id));
CREATE POLICY "Manage loan customers" ON public.loan_customers FOR ALL USING (is_shop_member(shop_id));

CREATE POLICY "Manage loan collateral" ON public.loan_collateral 
    FOR ALL USING (EXISTS (SELECT 1 FROM loans WHERE loans.id = loan_collateral.loan_id AND is_shop_member(loans.shop_id)));

CREATE POLICY "Manage loan payments" ON public.loan_payments 
    FOR ALL USING (EXISTS (SELECT 1 FROM loans WHERE loans.id = loan_payments.loan_id AND is_shop_member(loans.shop_id)));

-- ----------------------------------------------------------
-- SUBSCRIPTIONS & AUDIT
-- ----------------------------------------------------------
CREATE POLICY "View subscriptions" ON public.subscriptions FOR SELECT USING (is_shop_member(shop_id));

CREATE POLICY "Shop owners can view audit logs" ON public.audit_logs FOR SELECT USING (is_shop_admin(shop_id));
CREATE POLICY "System can insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);

-- ----------------------------------------------------------
-- GOLD SCHEMES
-- ----------------------------------------------------------
CREATE POLICY "Shop users can manage schemes" ON public.schemes
    USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = auth.uid()));

CREATE POLICY "Shop users can manage enrollments" ON public.customer_schemes
    USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = auth.uid()));

CREATE POLICY "Shop users can manage payments" ON public.scheme_payments
    USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = auth.uid()));
