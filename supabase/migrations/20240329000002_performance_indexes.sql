-- =============================================
-- Performance Indexes Migration
-- =============================================
-- These indexes optimize the most frequently executed queries
-- Expected impact: 10x faster query times (200-500ms → 20-50ms)

-- 1. Invoices queries (most critical)
-- Used by: invoices/page.tsx, dashboard, insights
CREATE INDEX IF NOT EXISTS idx_invoices_shop_created 
  ON invoices(shop_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_shop_status 
  ON invoices(shop_id, status) 
  WHERE status = 'due';

CREATE INDEX IF NOT EXISTS idx_invoices_customer 
  ON invoices(customer_id) 
  WHERE customer_id IS NOT NULL;

-- 2. User shop roles lookup (used on every page load)
-- Used by: layout.tsx, use-active-shop, auth checks
CREATE INDEX IF NOT EXISTS idx_user_shop_roles_user_active 
  ON user_shop_roles(user_id, is_active) 
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_user_shop_roles_shop 
  ON user_shop_roles(shop_id, role);

-- 3. Invoice items join (used when viewing/editing invoices)
-- Used by: invoice view, edit, print pages
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice 
  ON invoice_items(invoice_id);

-- 4. Staff management queries
-- Used by: staff/page.tsx
CREATE INDEX IF NOT EXISTS idx_staff_payments_shop 
  ON staff_payments(shop_id, payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_staff_attendance_shop 
  ON staff_attendance(shop_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_staff_profiles_shop 
  ON staff_profiles(shop_id, is_active) 
  WHERE is_active = TRUE;

-- 5. Customer queries
-- Used by: customers/page.tsx, invoice form autocomplete
CREATE INDEX IF NOT EXISTS idx_customers_shop 
  ON customers(shop_id, name);

CREATE INDEX IF NOT EXISTS idx_customers_phone 
  ON customers(phone) 
  WHERE phone IS NOT NULL;

-- 6. Stock items queries
-- Used by: stock/page.tsx, invoice form
CREATE INDEX IF NOT EXISTS idx_stock_items_shop_active 
  ON stock_items(shop_id, is_active) 
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_stock_items_category 
  ON stock_items(category, shop_id) 
  WHERE category IS NOT NULL;

-- 7. User preferences (loaded on every auth check)
-- Already has PRIMARY KEY on user_id, but add index for shop lookup
CREATE INDEX IF NOT EXISTS idx_user_preferences_shop 
  ON user_preferences(last_active_shop_id) 
  WHERE last_active_shop_id IS NOT NULL;

-- =============================================
-- Analyze tables for query planner optimization
-- =============================================
ANALYZE invoices;
ANALYZE invoice_items;
ANALYZE user_shop_roles;
ANALYZE staff_payments;
ANALYZE staff_attendance;
ANALYZE customers;
ANALYZE stock_items;
ANALYZE user_preferences;
