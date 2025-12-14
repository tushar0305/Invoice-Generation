-- Migration: Add ON DELETE CASCADE to invoice_items foreign key
-- This allows deleting an invoice to automatically delete all its associated items

ALTER TABLE invoice_items
DROP CONSTRAINT IF EXISTS invoice_items_invoice_id_fkey;

ALTER TABLE invoice_items
ADD CONSTRAINT invoice_items_invoice_id_fkey
FOREIGN KEY (invoice_id)
REFERENCES invoices(id)
ON DELETE CASCADE;
