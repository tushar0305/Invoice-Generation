-- =============================================
-- STOCK MANAGEMENT FUNCTIONS
-- =============================================

-- 1. Create Stock Item
CREATE OR REPLACE FUNCTION create_stock_item(
  p_shop_id UUID,
  p_user_id UUID,
  p_name TEXT,
  p_description TEXT,
  p_purity TEXT,
  p_base_price DECIMAL,
  p_base_weight DECIMAL,
  p_making_charge DECIMAL,
  p_quantity DECIMAL,
  p_unit TEXT,
  p_category TEXT,
  p_is_active BOOLEAN
)
RETURNS JSON AS $$
DECLARE
  v_item_id UUID;
BEGIN
  INSERT INTO stock_items (
    shop_id, user_id, name, description, purity, 
    base_price, base_weight, making_charge_per_gram, 
    quantity, unit, category, is_active
  )
  VALUES (
    p_shop_id, p_user_id, p_name, p_description, p_purity,
    p_base_price, p_base_weight, p_making_charge,
    p_quantity, p_unit, p_category, p_is_active
  )
  RETURNING id INTO v_item_id;

  RETURN json_build_object(
    'id', v_item_id,
    'status', 'created'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Stock Item
CREATE OR REPLACE FUNCTION update_stock_item(
  p_item_id UUID,
  p_shop_id UUID,
  p_name TEXT,
  p_description TEXT,
  p_purity TEXT,
  p_base_price DECIMAL,
  p_base_weight DECIMAL,
  p_making_charge DECIMAL,
  p_quantity DECIMAL,
  p_unit TEXT,
  p_category TEXT,
  p_is_active BOOLEAN,
  p_user_id UUID
)
RETURNS JSON AS $$
BEGIN
  -- Check existence and ownership
  PERFORM 1 FROM stock_items 
  WHERE id = p_item_id AND shop_id = p_shop_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock item not found';
  END IF;

  UPDATE stock_items
  SET
    name = COALESCE(p_name, name),
    description = p_description,
    purity = COALESCE(p_purity, purity),
    base_price = COALESCE(p_base_price, base_price),
    base_weight = p_base_weight,
    making_charge_per_gram = COALESCE(p_making_charge, making_charge_per_gram),
    quantity = COALESCE(p_quantity, quantity),
    unit = COALESCE(p_unit, unit),
    category = p_category,
    is_active = COALESCE(p_is_active, is_active),
    updated_at = NOW()
  WHERE id = p_item_id;

  RETURN json_build_object(
    'id', p_item_id,
    'status', 'updated'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Delete Stock Item
CREATE OR REPLACE FUNCTION delete_stock_item(
  p_item_id UUID,
  p_shop_id UUID,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_item RECORD;
BEGIN
  SELECT * INTO v_item
  FROM stock_items
  WHERE id = p_item_id AND shop_id = p_shop_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock item not found';
  END IF;

  DELETE FROM stock_items
  WHERE id = p_item_id;

  RETURN json_build_object(
    'id', p_item_id,
    'name', v_item.name,
    'quantity', v_item.quantity
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_stock_item TO authenticated;
GRANT EXECUTE ON FUNCTION update_stock_item TO authenticated;
GRANT EXECUTE ON FUNCTION delete_stock_item TO authenticated;
