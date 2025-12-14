-- ==========================================
-- Migration 0004: Consolidated Indexes
-- Description: Performance Indexes (FK + GIN)
-- ==========================================

-- 1. FOREIGN KEY INDEXES (Crucial for Performance)

-- Shops & Auth
CREATE INDEX IF NOT EXISTS idx_shops_created_by ON shops(created_by);
CREATE INDEX IF NOT EXISTS idx_user_shop_roles_user_id ON user_shop_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_shop_roles_shop_id ON user_shop_roles(shop_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Customers
CREATE INDEX IF NOT EXISTS idx_customers_shop_id ON customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_deleted_by ON customers(deleted_by);

-- Inventory (High Read Volume)
CREATE INDEX IF NOT EXISTS idx_inventory_items_shop_id ON inventory_items(shop_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_inventory_items_metal_type ON inventory_items(metal_type);
CREATE INDEX IF NOT EXISTS idx_inventory_items_tag_id ON inventory_items(tag_id);
CREATE INDEX IF NOT EXISTS idx_inventory_status_history_item_id ON inventory_status_history(item_id);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_shop_id ON invoices(shop_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Ledger
CREATE INDEX IF NOT EXISTS idx_ledger_shop_id ON ledger_transactions(shop_id);
CREATE INDEX IF NOT EXISTS idx_ledger_customer_id ON ledger_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_ledger_invoice_id ON ledger_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_ledger_date ON ledger_transactions(transaction_date);

-- Staff
CREATE INDEX IF NOT EXISTS idx_staff_profiles_shop_user ON staff_profiles(shop_id, user_id);
CREATE INDEX IF NOT EXISTS idx_shop_invitations_email ON shop_invitations(email);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_shop_id ON staff_attendance(shop_id);
CREATE INDEX IF NOT EXISTS idx_staff_payments_shop_id ON staff_payments(shop_id);

-- Catalogue
CREATE INDEX IF NOT EXISTS idx_catalogue_slug ON catalogue_settings(public_slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON catalogue_products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_shop ON catalogue_products(shop_id);

-- WhatsApp
CREATE INDEX IF NOT EXISTS idx_whatsapp_configs_shop ON whatsapp_configs(shop_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_shop ON whatsapp_messages(shop_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_customer_id ON whatsapp_messages(customer_id);

-- Loans
CREATE INDEX IF NOT EXISTS idx_loans_customer_id ON loans(customer_id);
CREATE INDEX IF NOT EXISTS idx_loans_shop_id ON loans(shop_id);
CREATE INDEX IF NOT EXISTS idx_loan_collateral_loan_id ON loan_collateral(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan_id ON loan_payments(loan_id);


-- 2. POWER USER INDEXES (Optimizations)

-- Composite: Inventory Filter by Shop + Status is very common
CREATE INDEX IF NOT EXISTS idx_inventory_shop_status ON inventory_items(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_lookup ON inventory_items(shop_id, status, category);

-- Composite: Recent invoices by shop
CREATE INDEX IF NOT EXISTS idx_invoices_shop_date ON invoices(shop_id, invoice_date DESC);

-- GIN: Full Text Search for Customers
CREATE INDEX IF NOT EXISTS idx_customers_search_gin ON customers USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON customers USING GIN (name gin_trgm_ops);

-- GIN: Fuzzy Search for Invoices (Number)
CREATE INDEX IF NOT EXISTS idx_invoices_search_trgm ON invoices USING GIN (invoice_number gin_trgm_ops);

-- GIN: Fuzzy Search for Inventory (Tag ID / Name)
CREATE INDEX IF NOT EXISTS idx_inventory_tag_trgm ON inventory_items USING GIN (tag_id gin_trgm_ops);


-- 3. UTILITY UPDATES (One-time)

-- Ensure initial market rates exist
INSERT INTO public.market_rates (gold_24k, gold_22k, silver, source)
VALUES (72000, 68000, 85000, 'Initial Seed')
ON CONFLICT DO NOTHING;

-- Force schema reload for PostgREST
NOTIFY pgrst, 'reload schema';
