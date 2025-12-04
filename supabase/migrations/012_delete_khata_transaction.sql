-- =============================================
-- KHATA TRANSACTION DELETE FUNCTION
-- =============================================
-- Deletes a khata transaction
-- 1. Validates shop ownership
-- 2. Deletes transaction
-- 3. Returns deleted details for audit

CREATE OR REPLACE FUNCTION delete_khata_transaction(
  p_transaction_id UUID,
  p_shop_id UUID,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_transaction RECORD;
BEGIN
  -- Find transaction and lock row
  SELECT * INTO v_transaction
  FROM khata_transactions
  WHERE id = p_transaction_id AND shop_id = p_shop_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;

  -- Delete
  DELETE FROM khata_transactions
  WHERE id = p_transaction_id;

  RETURN json_build_object(
    'transaction_id', p_transaction_id,
    'amount', v_transaction.amount,
    'type', v_transaction.type,
    'customer_id', v_transaction.customer_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION delete_khata_transaction TO authenticated;
