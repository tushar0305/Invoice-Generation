-- ==========================================
-- Migration 0004: Consolidated Indexes
-- Description: Performance Optimization
-- ==========================================

-- Customers
CREATE INDEX IF NOT EXISTS idx_customers_shop_phone ON customers(shop_id, phone);
CREATE INDEX IF NOT EXISTS idx_customers_search_vector ON customers USING GIN(search_vector);

-- Inventory
CREATE INDEX IF NOT EXISTS idx_inventory_items_shop_status ON inventory_items(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_items_tag_id ON inventory_items(tag_id);
-- Added deleted_at index for performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_deleted_at ON inventory_items(deleted_at) WHERE deleted_at IS NOT NULL;

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_shop_number ON invoices(shop_id, invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
-- Dashboard Performance Index: Filter by shop, status and date
CREATE INDEX IF NOT EXISTS idx_invoices_shop_status_date ON invoices(shop_id, status, invoice_date);

-- Invoice Items
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_stock_id ON invoice_items(stock_id);

-- Ledger
CREATE INDEX IF NOT EXISTS idx_ledger_transactions_shop_customer ON ledger_transactions(shop_id, customer_id);

-- Gold Schemes
CREATE INDEX IF NOT EXISTS idx_customer_schemes_status ON customer_schemes(shop_id, status);

-- Shop Invitations
CREATE INDEX IF NOT EXISTS idx_shop_invitations_status ON shop_invitations(shop_id, status);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_shop_read ON notifications(shop_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at desc);

-- Catalogue
CREATE INDEX IF NOT EXISTS idx_catalogue_analytics_shop_type ON catalogue_analytics(shop_id, view_type);
