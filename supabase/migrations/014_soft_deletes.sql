-- =============================================
-- SOFT DELETE IMPLEMENTATION
-- =============================================
-- Adds deleted_at and deleted_by columns to all critical tables
-- Updates RLS policies to exclude soft-deleted records
-- Prevents accidental data loss and enables GDPR compliance

-- =============================================
-- 1. ADD SOFT DELETE COLUMNS
-- =============================================

-- Customers
ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Invoices
ALTER TABLE invoices 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Invoice Items
ALTER TABLE invoice_items 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Stock Items
ALTER TABLE stock_items 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Loans (not jewellery_loans)
ALTER TABLE loans 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Loan Payments
ALTER TABLE loan_payments 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Khata Customers
ALTER TABLE khata_customers 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Khata Transactions
ALTER TABLE khata_transactions 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- =============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_customers_deleted_at ON customers(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_deleted_at ON invoices(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoice_items_deleted_at ON invoice_items(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stock_items_deleted_at ON stock_items(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_loans_deleted_at ON loans(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_loan_payments_deleted_at ON loan_payments(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_khata_customers_deleted_at ON khata_customers(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_khata_transactions_deleted_at ON khata_transactions(deleted_at) WHERE deleted_at IS NOT NULL;

-- =============================================
-- 3. UPDATE RLS POLICIES
-- =============================================

-- CUSTOMERS
DROP POLICY IF EXISTS "Users can view their shop's customers" ON customers;
CREATE POLICY "Users can view their shop's customers"
  ON customers FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM user_shop_roles
      WHERE user_shop_roles.shop_id = customers.shop_id
      AND user_shop_roles.user_id = auth.uid()
    )
  );

-- INVOICES
DROP POLICY IF EXISTS "Users can view their shop invoices" ON invoices;
CREATE POLICY "Users can view their shop invoices"
  ON invoices FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM user_shop_roles
      WHERE user_shop_roles.shop_id = invoices.shop_id
      AND user_shop_roles.user_id = auth.uid()
    )
  );

-- INVOICE ITEMS
DROP POLICY IF EXISTS "Users can view invoice items" ON invoice_items;
CREATE POLICY "Users can view invoice items"
  ON invoice_items FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.deleted_at IS NULL
      AND EXISTS (
        SELECT 1 FROM user_shop_roles
        WHERE user_shop_roles.shop_id = invoices.shop_id
        AND user_shop_roles.user_id = auth.uid()
      )
    )
  );

-- STOCK ITEMS
DROP POLICY IF EXISTS "Users can view their shop stock items" ON stock_items;
CREATE POLICY "Users can view their shop stock items"
  ON stock_items FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM user_shop_roles
      WHERE user_shop_roles.shop_id = stock_items.shop_id
      AND user_shop_roles.user_id = auth.uid()
    )
  );

-- LOANS
DROP POLICY IF EXISTS "Users can view their shop's loans" ON loans;
CREATE POLICY "Users can view their shop's loans"
  ON loans FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM user_shop_roles
      WHERE user_shop_roles.shop_id = loans.shop_id
      AND user_shop_roles.user_id = auth.uid()
    )
  );

-- LOAN PAYMENTS
DROP POLICY IF EXISTS "Users can view loan payments" ON loan_payments;
CREATE POLICY "Users can view loan payments"
  ON loan_payments FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = loan_payments.loan_id
      AND loans.deleted_at IS NULL
      AND EXISTS (
        SELECT 1 FROM user_shop_roles
        WHERE user_shop_roles.shop_id = loans.shop_id
        AND user_shop_roles.user_id = auth.uid()
      )
    )
  );

-- KHATA CUSTOMERS
DROP POLICY IF EXISTS "Users can view their shop's khata customers" ON khata_customers;
CREATE POLICY "Users can view their shop's khata customers"
  ON khata_customers FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      auth.uid() = user_id 
      OR EXISTS (
        SELECT 1 FROM user_shop_roles
        WHERE user_shop_roles.shop_id = khata_customers.shop_id
        AND user_shop_roles.user_id = auth.uid()
      )
    )
  );

-- KHATA TRANSACTIONS
DROP POLICY IF EXISTS "Users can view their shop's khata transactions" ON khata_transactions;
CREATE POLICY "Users can view their shop's khata transactions"
  ON khata_transactions FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      auth.uid() = user_id
      OR EXISTS (
        SELECT 1 FROM user_shop_roles
        WHERE user_shop_roles.shop_id = khata_transactions.shop_id
        AND user_shop_roles.user_id = auth.uid()
      )
    )
  );

-- =============================================
-- 4. COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON COLUMN customers.deleted_at IS 'Soft delete timestamp - NULL means active record';
COMMENT ON COLUMN customers.deleted_by IS 'User who soft-deleted this record';

COMMENT ON COLUMN invoices.deleted_at IS 'Soft delete timestamp - NULL means active record';
COMMENT ON COLUMN invoices.deleted_by IS 'User who soft-deleted this record';

COMMENT ON COLUMN stock_items.deleted_at IS 'Soft delete timestamp - NULL means active record';
COMMENT ON COLUMN stock_items.deleted_by IS 'User who soft-deleted this record';

COMMENT ON COLUMN khata_customers.deleted_at IS 'Soft delete timestamp - NULL means active record';
COMMENT ON COLUMN khata_customers.deleted_by IS 'User who soft-deleted this record';
