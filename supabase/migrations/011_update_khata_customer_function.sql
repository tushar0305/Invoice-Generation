-- =============================================
-- KHATA CUSTOMER UPDATE FUNCTION
-- =============================================
-- Updates khata customer details (name, phone, address)

CREATE OR REPLACE FUNCTION update_khata_customer(
  p_customer_id UUID,
  p_shop_id UUID,
  p_name TEXT,
  p_phone TEXT,
  p_address TEXT,
  p_user_id UUID
)
RETURNS JSON AS $$
BEGIN
  -- Check existence and ownership
  PERFORM 1 FROM khata_customers 
  WHERE id = p_customer_id AND shop_id = p_shop_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Khata customer not found';
  END IF;

  -- Update Customer
  UPDATE khata_customers
  SET
    name = COALESCE(p_name, name),
    phone = NULLIF(p_phone, ''),
    address = NULLIF(p_address, ''),
    updated_at = NOW()
  WHERE id = p_customer_id;

  RETURN json_build_object(
    'customer_id', p_customer_id,
    'status', 'updated'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_khata_customer TO authenticated;
