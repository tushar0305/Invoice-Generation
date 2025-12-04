-- Drop the old function signature to avoid overloading confusion
-- Old signature: (shop_id, customer_id, name, phone, address, items, discount, notes, user_id)
DROP FUNCTION IF EXISTS create_invoice_with_items(uuid, uuid, text, text, text, jsonb, decimal, text, uuid);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
