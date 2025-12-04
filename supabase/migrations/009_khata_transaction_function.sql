-- =============================================
-- KHATA TRANSACTION FUNCTION
-- =============================================
-- Handles adding khata (ledger) transactions
-- 1. Validates customer and shop
-- 2. Inserts transaction
-- 3. Updates customer balance (if we decide to store it on customer table later)

CREATE OR REPLACE FUNCTION add_khata_transaction(
  p_shop_id UUID,
  p_customer_id UUID,
  p_type TEXT, -- 'given' or 'received'
  p_amount DECIMAL(12,2),
  p_description TEXT,
  p_due_date DATE,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_transaction_id UUID;
  v_customer_name TEXT;
BEGIN
  -- Validate Shop
  PERFORM 1 FROM shops WHERE id = p_shop_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Shop not found';
  END IF;

  -- Validate Customer and get name
  SELECT name INTO v_customer_name FROM customers WHERE id = p_customer_id AND shop_id = p_shop_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found in this shop';
  END IF;

  -- Validate Amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Insert Transaction
  INSERT INTO khata_transactions (
    shop_id,
    customer_id,
    type,
    amount,
    description,
    due_date,
    date
  ) VALUES (
    p_shop_id,
    p_customer_id,
    p_type,
    p_amount,
    p_description,
    p_due_date,
    CURRENT_DATE
  )
  RETURNING id INTO v_transaction_id;

  -- Return result
  RETURN json_build_object(
    'transaction_id', v_transaction_id,
    'customer_name', v_customer_name,
    'amount', p_amount,
    'type', p_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION add_khata_transaction TO authenticated;
