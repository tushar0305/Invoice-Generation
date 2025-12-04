-- =============================================
-- UPDATE DELETE FUNCTIONS TO USE SOFT DELETE
-- =============================================
-- Replaces hard deletes with soft deletes (marking deleted_at)

-- 1. Update delete_stock_item
CREATE OR REPLACE FUNCTION delete_stock_item(
  p_item_id UUID,
  p_shop_id UUID,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_item RECORD;
BEGIN
  -- Lock and fetch the item
  SELECT * INTO v_item
  FROM stock_items
  WHERE id = p_item_id AND shop_id = p_shop_id AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock item not found or already deleted';
  END IF;

  -- Soft delete: mark as deleted instead of removing
  UPDATE stock_items
  SET deleted_at = NOW(), deleted_by = p_user_id
  WHERE id = p_item_id;

  RETURN json_build_object(
    'id', p_item_id,
    'name', v_item.name,
    'quantity', v_item.quantity
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update delete_khata_transaction
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
  WHERE id = p_transaction_id AND shop_id = p_shop_id AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found or already deleted';
  END IF;

  -- Soft delete: mark as deleted instead of removing
  UPDATE khata_transactions
  SET deleted_at = NOW(), deleted_by = p_user_id
  WHERE id = p_transaction_id;

  RETURN json_build_object(
    'transaction_id', p_transaction_id,
    'amount', v_transaction.amount,
    'type', v_transaction.type,
    'customer_id', v_transaction.customer_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- OPTIONAL: RESTORE FUNCTIONS
-- =============================================
-- Functions to restore soft-deleted records (for admin/owner use)

CREATE OR REPLACE FUNCTION restore_stock_item(
  p_item_id UUID,
  p_shop_id UUID,
  p_user_id UUID
)
RETURNS JSON AS $$
BEGIN
  -- Check item exists and is deleted
  PERFORM 1 FROM stock_items
  WHERE id = p_item_id AND shop_id = p_shop_id AND deleted_at IS NOT NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock item not found or not deleted';
  END IF;

  -- Restore by clearing deleted_at
  UPDATE stock_items
  SET deleted_at = NULL, deleted_by = NULL
  WHERE id = p_item_id;

  RETURN json_build_object(
    'id', p_item_id,
    'status', 'restored'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION restore_khata_transaction(
  p_transaction_id UUID,
  p_shop_id UUID,
  p_user_id UUID
)
RETURNS JSON AS $$
BEGIN
  -- Check transaction exists and is deleted
  PERFORM 1 FROM khata_transactions
  WHERE id = p_transaction_id AND shop_id = p_shop_id AND deleted_at IS NOT NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found or not deleted';
  END IF;

  -- Restore by clearing deleted_at
  UPDATE khata_transactions
  SET deleted_at = NULL, deleted_by = NULL
  WHERE id = p_transaction_id;

  RETURN json_build_object(
    'id', p_transaction_id,
    'status', 'restored'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION restore_stock_item TO authenticated;
GRANT EXECUTE ON FUNCTION restore_khata_transaction TO authenticated;

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON FUNCTION delete_stock_item IS 'Soft deletes a stock item by marking deleted_at';
COMMENT ON FUNCTION delete_khata_transaction IS 'Soft deletes a khata transaction by marking deleted_at';
COMMENT ON FUNCTION restore_stock_item IS 'Restores a soft-deleted stock item';
COMMENT ON FUNCTION restore_khata_transaction IS 'Restores a soft-deleted khata transaction';
