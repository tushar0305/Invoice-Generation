-- ==========================================
-- Migration 0003: Consolidated Policies
-- Description: Row Level Security (RLS)
-- OPTIMIZED: Uses (select auth.uid()) pattern for performance
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
ALTER TABLE loan_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_tag_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheme_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheme_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheme_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheme_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE khatabook_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_documents ENABLE ROW LEVEL SECURITY;

-- ==============================================================
-- SHOPS
-- ==============================================================
DROP POLICY IF EXISTS "Users can view their shops" ON public.shops;
CREATE POLICY "Users can view their shops" ON public.shops
    FOR SELECT USING (created_by = (select auth.uid()) OR is_shop_member(id));

DROP POLICY IF EXISTS "Users can create shops" ON public.shops;
CREATE POLICY "Users can create shops" ON public.shops
    FOR INSERT WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Owners can update their shops" ON public.shops;
CREATE POLICY "Owners can update their shops" ON public.shops
    FOR UPDATE USING (
        created_by = (select auth.uid()) 
        OR EXISTS (
            SELECT 1 FROM user_shop_roles 
            WHERE shop_id = id 
            AND user_id = (select auth.uid()) 
            AND role = 'owner'
        )
    ) WITH CHECK (
        created_by = (select auth.uid()) 
        OR EXISTS (
            SELECT 1 FROM user_shop_roles 
            WHERE shop_id = id 
            AND user_id = (select auth.uid()) 
            AND role = 'owner'
        )
    );

-- ==============================================================
-- USER SHOP ROLES
-- ==============================================================
DROP POLICY IF EXISTS "View shop roles" ON public.user_shop_roles;
CREATE POLICY "View shop roles" ON public.user_shop_roles
    FOR SELECT USING (user_id = (select auth.uid()) OR is_shop_member(shop_id));

-- ==============================================================
-- USER PREFERENCES
-- ==============================================================
DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_preferences;
CREATE POLICY "Users can manage their own preferences" ON public.user_preferences
    FOR ALL USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- ==============================================================
-- INVENTORY (Consolidated - Removed duplicate policies)
-- ==============================================================
DROP POLICY IF EXISTS "inventory_items_shop_access" ON inventory_items;
DROP POLICY IF EXISTS "inventory_items_view" ON inventory_items;
DROP POLICY IF EXISTS "inventory_items_modify" ON inventory_items;
CREATE POLICY "inventory_items_access" ON inventory_items
    FOR ALL USING (
        shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid()))
        AND deleted_at IS NULL
    );

DROP POLICY IF EXISTS "inventory_tag_sequences_shop_access" ON inventory_tag_sequences;
CREATE POLICY "inventory_tag_sequences_shop_access" ON inventory_tag_sequences
    FOR ALL USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "inventory_status_history_access" ON inventory_status_history;
CREATE POLICY "inventory_status_history_access" ON inventory_status_history
    FOR ALL USING (item_id IN (SELECT id FROM inventory_items WHERE shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid()))));

-- ==============================================================
-- CUSTOMERS
-- ==============================================================
DROP POLICY IF EXISTS "Manage shop customers" ON public.customers;
CREATE POLICY "Manage shop customers" ON public.customers
    FOR ALL USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())));

-- ==============================================================
-- INVOICES & ITEMS
-- ==============================================================
DROP POLICY IF EXISTS "Manage shop invoices" ON public.invoices;
CREATE POLICY "Manage shop invoices" ON public.invoices
    FOR ALL USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Manage invoice items" ON public.invoice_items;
CREATE POLICY "Manage invoice items" ON public.invoice_items 
    FOR ALL USING (invoice_id IN (SELECT id FROM invoices WHERE shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid()))));

-- ==============================================================
-- LEDGER
-- ==============================================================
DROP POLICY IF EXISTS "Manage shop ledger" ON public.ledger_transactions;
CREATE POLICY "Manage shop ledger" ON public.ledger_transactions
    FOR ALL USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())));

-- ==============================================================
-- STAFF
-- ==============================================================
DROP POLICY IF EXISTS "Manage shop staff profiles" ON public.staff_profiles;
DROP POLICY IF EXISTS "View shop staff profiles" ON public.staff_profiles;
CREATE POLICY "Staff profiles access" ON public.staff_profiles
    FOR ALL USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Manage shop staff payments" ON public.staff_payments;
DROP POLICY IF EXISTS "View shop staff payments" ON public.staff_payments;
CREATE POLICY "Staff payments access" ON public.staff_payments
    FOR ALL USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Manage shop staff attendance" ON public.staff_attendance;
CREATE POLICY "Staff attendance access" ON public.staff_attendance
    FOR ALL USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Manage shop invitations" ON public.shop_invitations;
DROP POLICY IF EXISTS "Update shop invitations" ON public.shop_invitations;
DROP POLICY IF EXISTS "Delete shop invitations" ON public.shop_invitations;
DROP POLICY IF EXISTS "View shop invitations" ON public.shop_invitations;
CREATE POLICY "Shop invitations access" ON public.shop_invitations
    FOR ALL USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())));

-- ==============================================================
-- MARKET RATES (Consolidated - Removed duplicate policies)
-- ==============================================================
DROP POLICY IF EXISTS "Authenticated users can update market rates" ON public.market_rates;
DROP POLICY IF EXISTS "Authenticated users can modify market rates" ON public.market_rates;
DROP POLICY IF EXISTS "Authenticated users can delete market rates" ON public.market_rates;
DROP POLICY IF EXISTS "Everyone can view market rates" ON public.market_rates;
DROP POLICY IF EXISTS "Allow insert/update by authenticated users" ON public.market_rates;
DROP POLICY IF EXISTS "Allow read access to all authenticated users" ON public.market_rates;
CREATE POLICY "Market rates access" ON public.market_rates
    FOR ALL USING (true);

-- ==============================================================
-- LOYALTY
-- ==============================================================
DROP POLICY IF EXISTS "Manage shop loyalty settings" ON public.shop_loyalty_settings;
DROP POLICY IF EXISTS "View shop loyalty settings" ON public.shop_loyalty_settings;
CREATE POLICY "Loyalty settings access" ON public.shop_loyalty_settings
    FOR ALL USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "View loyalty logs" ON customer_loyalty_logs;
DROP POLICY IF EXISTS "Create loyalty logs" ON customer_loyalty_logs;
CREATE POLICY "Loyalty logs access" ON customer_loyalty_logs
    FOR ALL USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())));

-- ==============================================================
-- CATALOGUE
-- ==============================================================
DROP POLICY IF EXISTS "Owners can manage categories" ON public.catalogue_categories;
DROP POLICY IF EXISTS "Everyone can view categories" ON public.catalogue_categories;
CREATE POLICY "Catalogue categories access" ON public.catalogue_categories
    FOR ALL USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())) OR is_active = true);

DROP POLICY IF EXISTS "Owners can manage products" ON public.catalogue_products;
DROP POLICY IF EXISTS "Everyone can view products" ON public.catalogue_products;
CREATE POLICY "Catalogue products access" ON public.catalogue_products
    FOR ALL USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())) OR is_active = true);

DROP POLICY IF EXISTS "Owners can manage catalogue settings" ON public.catalogue_settings;
DROP POLICY IF EXISTS "Everyone can view catalogue settings" ON public.catalogue_settings;
CREATE POLICY "Catalogue settings access" ON public.catalogue_settings
    FOR ALL USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())) OR is_active = true);

DROP POLICY IF EXISTS "Owners can view analytics" ON catalogue_analytics;
DROP POLICY IF EXISTS "Public can log analytics" ON catalogue_analytics;
CREATE POLICY "Catalogue analytics access" ON catalogue_analytics FOR ALL USING (true);

-- ==============================================================
-- WHATSAPP
-- ==============================================================
DROP POLICY IF EXISTS "Manage whatsapp config" ON public.whatsapp_configs;
DROP POLICY IF EXISTS "View whatsapp config" ON public.whatsapp_configs;
CREATE POLICY "Whatsapp config access" ON public.whatsapp_configs
    FOR ALL USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Manage templates" ON public.whatsapp_templates;
CREATE POLICY "Whatsapp templates access" ON public.whatsapp_templates
    FOR ALL USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Manage messages" ON public.whatsapp_messages;
CREATE POLICY "Whatsapp messages access" ON public.whatsapp_messages
    FOR ALL USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())));

-- ==============================================================
-- LOANS (Consolidated - Removed duplicate policies)
-- ==============================================================
DROP POLICY IF EXISTS "Manage loans" ON public.loans;
DROP POLICY IF EXISTS "View loans" ON public.loans;
DROP POLICY IF EXISTS "Update loans" ON public.loans;
DROP POLICY IF EXISTS "Users can view loans for their shop" ON public.loans;
DROP POLICY IF EXISTS "Users can insert loans for their shop" ON public.loans;
DROP POLICY IF EXISTS "Users can update loans for their shop" ON public.loans;
CREATE POLICY "Loans access" ON public.loans
    FOR ALL USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Manage loan customers" ON public.loan_customers;
DROP POLICY IF EXISTS "View loan customers" ON public.loan_customers;
DROP POLICY IF EXISTS "Update loan customers" ON public.loan_customers;
DROP POLICY IF EXISTS "Users can view customers for their shop" ON public.loan_customers;
DROP POLICY IF EXISTS "Users can insert customers for their shop" ON public.loan_customers;
DROP POLICY IF EXISTS "Users can update customers for their shop" ON public.loan_customers;
CREATE POLICY "Loan customers access" ON public.loan_customers
    FOR ALL USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Manage loan collateral" ON public.loan_collateral;
DROP POLICY IF EXISTS "View loan collateral" ON public.loan_collateral;
DROP POLICY IF EXISTS "Users can view collateral for their shop loans" ON public.loan_collateral;
DROP POLICY IF EXISTS "Users can insert collateral for their shop loans" ON public.loan_collateral;
CREATE POLICY "Loan collateral access" ON public.loan_collateral 
    FOR ALL USING (loan_id IN (SELECT id FROM loans WHERE shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid()))));

DROP POLICY IF EXISTS "Manage loan payments" ON public.loan_payments;
DROP POLICY IF EXISTS "View loan payments" ON public.loan_payments;
DROP POLICY IF EXISTS "Users can view payments for their shop loans" ON public.loan_payments;
DROP POLICY IF EXISTS "Users can insert payments for their shop loans" ON public.loan_payments;
CREATE POLICY "Loan payments access" ON public.loan_payments 
    FOR ALL USING (loan_id IN (SELECT id FROM loans WHERE shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid()))));

DROP POLICY IF EXISTS "Users can view documents for their shop loans" ON public.loan_documents;
DROP POLICY IF EXISTS "Users can insert documents for their shop loans" ON public.loan_documents;
CREATE POLICY "Loan documents access" ON public.loan_documents 
    FOR ALL USING (loan_id IN (SELECT id FROM loans WHERE shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid()))));

-- ==============================================================
-- SUBSCRIPTIONS & AUDIT
-- ==============================================================
DROP POLICY IF EXISTS "View subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view subscriptions for their shops" ON public.subscriptions;
CREATE POLICY "Subscriptions access" ON public.subscriptions
    FOR SELECT USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Shop owners can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
CREATE POLICY "Audit logs access" ON public.audit_logs FOR ALL USING (true);

-- ==============================================================
-- GOLD SCHEMES (Consolidated - Removed ALL duplicate policies)
-- ==============================================================
DROP POLICY IF EXISTS "Shop users can manage schemes" ON public.schemes;
DROP POLICY IF EXISTS "Users can manage schemes for their shops" ON public.schemes;
CREATE POLICY "Schemes access" ON public.schemes
    FOR ALL USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can manage enrollments for their shops" ON public.scheme_enrollments;
CREATE POLICY "Scheme enrollments access" ON public.scheme_enrollments
    FOR ALL USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can manage transactions for their shops" ON public.scheme_transactions;
CREATE POLICY "Scheme transactions access" ON public.scheme_transactions
    FOR ALL USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can manage redemptions for their shops" ON public.scheme_redemptions;
CREATE POLICY "Scheme redemptions access" ON public.scheme_redemptions
    FOR ALL USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Shop users can manage enrollments" ON public.customer_schemes;
DROP POLICY IF EXISTS "Shop members can view schemes" ON public.customer_schemes;
DROP POLICY IF EXISTS "Shop members can update schemes" ON public.customer_schemes;
CREATE POLICY "Customer schemes access" ON public.customer_schemes
    FOR ALL USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Shop users can manage payments" ON public.scheme_payments;
CREATE POLICY "Scheme payments access" ON public.scheme_payments
    FOR ALL USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())));

-- ==============================================================
-- SHOP SUBSCRIPTIONS & USAGE
-- ==============================================================
DROP POLICY IF EXISTS "Shops can view own subscription" ON public.shop_subscriptions;
CREATE POLICY "Shop subscriptions access" ON public.shop_subscriptions
    FOR SELECT USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())));

DROP POLICY IF EXISTS "Shops can view own usage" ON public.shop_usage_limits;
CREATE POLICY "Shop usage limits access" ON public.shop_usage_limits
    FOR SELECT USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())));

-- ==============================================================
-- STOCK ITEMS (Consolidated - Removed duplicate policies)
-- ==============================================================
DROP POLICY IF EXISTS "Users can view stock items for their shops" ON public.stock_items;
DROP POLICY IF EXISTS "Users can manage stock items for their shops" ON public.stock_items;
CREATE POLICY "Stock items access" ON public.stock_items
    FOR ALL USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())));

-- ==============================================================
-- KHATABOOK CONTACTS
-- ==============================================================
DROP POLICY IF EXISTS "Users can view khata contacts for their shops" ON public.khatabook_contacts;
DROP POLICY IF EXISTS "Users can create khata contacts for their shops" ON public.khatabook_contacts;
DROP POLICY IF EXISTS "Users can update khata contacts for their shops" ON public.khatabook_contacts;
DROP POLICY IF EXISTS "Khatabook contacts access" ON public.khatabook_contacts;
CREATE POLICY "Khatabook contacts access" ON public.khatabook_contacts
    FOR ALL USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())));

-- ==============================================================
-- TRANSACTION DOCUMENTS
-- ==============================================================
DROP POLICY IF EXISTS "Users can view docs for their shops" ON public.transaction_documents;
DROP POLICY IF EXISTS "Users can upload docs for their shops" ON public.transaction_documents;
DROP POLICY IF EXISTS "Users can delete docs for their shops" ON public.transaction_documents;
DROP POLICY IF EXISTS "Transaction documents access" ON public.transaction_documents;
CREATE POLICY "Transaction documents access" ON public.transaction_documents
    FOR ALL USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())));

-- ==============================================================
-- NOTIFICATIONS
-- ==============================================================
DROP POLICY IF EXISTS "Users can view notifications for their shop" ON notifications;
DROP POLICY IF EXISTS "Users can update (mark read) notifications for their shop" ON notifications;
DROP POLICY IF EXISTS "Server can insert notifications" ON notifications;
CREATE POLICY "Notifications access" ON notifications
    FOR ALL USING (shop_id IN (SELECT shop_id FROM user_shop_roles WHERE user_id = (select auth.uid())) OR true);
