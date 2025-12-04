-- =============================================
-- ADD UNIQUE CONSTRAINTS
-- =============================================
-- Prevents duplicate data at database level
-- Ensures data integrity and prevents race conditions

-- =============================================
-- STEP 1: CHECK FOR EXISTING DUPLICATES
-- =============================================
-- Run these queries to verify no duplicates exist before adding constraints
-- If duplicates found, clean them up first

-- Check invoices for duplicate invoice_numbers per shop
-- SELECT shop_id, invoice_number, COUNT(*) as count
-- FROM invoices
-- GROUP BY shop_id, invoice_number
-- HAVING COUNT(*) > 1;

-- Check customers for duplicate phones per shop
-- SELECT shop_id, phone, COUNT(*) as count
-- FROM customers
-- WHERE phone IS NOT NULL AND phone != ''
-- GROUP BY shop_id, phone
-- HAVING COUNT(*) > 1;

-- Check khata_customers for duplicate phones per shop
-- SELECT shop_id, phone, COUNT(*) as count
-- FROM khata_customers
-- WHERE phone IS NOT NULL AND phone != ''
-- GROUP BY shop_id, phone
-- HAVING COUNT(*) > 1;

-- =============================================
-- STEP 2: ADD UNIQUE CONSTRAINTS
-- =============================================

-- 1. INVOICES: Unique invoice number per shop
ALTER TABLE invoices
  ADD CONSTRAINT unique_invoice_number_per_shop
  UNIQUE (shop_id, invoice_number);

-- 2. CUSTOMERS: Unique phone number per shop
-- Note: Only enforce if phone is provided
ALTER TABLE customers
  ADD CONSTRAINT unique_customer_phone_per_shop
  UNIQUE (shop_id, phone);

-- 3. KHATA CUSTOMERS: Unique phone number per shop
ALTER TABLE khata_customers
  ADD CONSTRAINT unique_khata_customer_phone_per_shop
  UNIQUE (shop_id, phone);

-- 4. LOAN CUSTOMERS: Unique phone number per shop
ALTER TABLE loan_customers
  ADD CONSTRAINT unique_loan_customer_phone_per_shop
  UNIQUE (shop_id, phone);

-- =============================================
-- STEP 3: PERFORMANCE INDEXES
-- =============================================
-- These indexes are automatically created by UNIQUE constraints, but listing for clarity:
-- - invoices (shop_id, invoice_number)
-- - customers (shop_id, phone)
-- - khata_customers (shop_id, phone)
-- - loan_customers (shop_id, phone)

-- =============================================
-- STEP 4: COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON CONSTRAINT unique_invoice_number_per_shop ON invoices 
  IS 'Prevents duplicate invoice numbers within the same shop';

COMMENT ON CONSTRAINT unique_customer_phone_per_shop ON customers 
  IS 'Prevents duplicate customer phone numbers within the same shop';

COMMENT ON CONSTRAINT unique_khata_customer_phone_per_shop ON khata_customers 
  IS 'Prevents duplicate khata customer phone numbers within the same shop';

COMMENT ON CONSTRAINT unique_loan_customer_phone_per_shop ON loan_customers 
  IS 'Prevents duplicate loan customer phone numbers within are the same shop';
