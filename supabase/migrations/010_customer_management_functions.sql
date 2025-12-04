-- =============================================
-- CUSTOMER MANAGEMENT FUNCTIONS
-- =============================================

-- 1. Create Customer
CREATE OR REPLACE FUNCTION create_customer(
  p_shop_id UUID,
  p_name TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_address TEXT,
  p_state TEXT,
  p_pincode TEXT,
  p_gst_number TEXT,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  -- Validate Shop
  PERFORM 1 FROM shops WHERE id = p_shop_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Shop not found';
  END IF;

  -- Check for duplicate phone in this shop
  IF p_phone IS NOT NULL AND p_phone <> '' THEN
    PERFORM 1 FROM customers 
    WHERE shop_id = p_shop_id AND phone = p_phone;
    
    IF FOUND THEN
      RAISE EXCEPTION 'Customer with this phone number already exists';
    END IF;
  END IF;

  -- Insert Customer
  INSERT INTO customers (
    shop_id,
    user_id,
    name,
    phone,
    email,
    address,
    state,
    pincode,
    gst_number,
    loyalty_points
  ) VALUES (
    p_shop_id,
    p_user_id,
    p_name,
    NULLIF(p_phone, ''),
    NULLIF(p_email, ''),
    NULLIF(p_address, ''),
    NULLIF(p_state, ''),
    NULLIF(p_pincode, ''),
    NULLIF(p_gst_number, ''),
    0
  )
  RETURNING id INTO v_customer_id;

  RETURN json_build_object(
    'customer_id', v_customer_id,
    'name', p_name,
    'phone', p_phone
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Customer
CREATE OR REPLACE FUNCTION update_customer(
  p_customer_id UUID,
  p_shop_id UUID,
  p_name TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_address TEXT,
  p_state TEXT,
  p_pincode TEXT,
  p_gst_number TEXT,
  p_user_id UUID
)
RETURNS JSON AS $$
BEGIN
  -- Check existence and ownership (shop_id check ensures tenant isolation)
  PERFORM 1 FROM customers 
  WHERE id = p_customer_id AND shop_id = p_shop_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;

  -- Check for duplicate phone (exclude self)
  IF p_phone IS NOT NULL AND p_phone <> '' THEN
    PERFORM 1 FROM customers 
    WHERE shop_id = p_shop_id 
    AND phone = p_phone 
    AND id <> p_customer_id;
    
    IF FOUND THEN
      RAISE EXCEPTION 'Another customer with this phone number already exists';
    END IF;
  END IF;

  -- Update Customer
  UPDATE customers
  SET
    name = COALESCE(p_name, name),
    phone = NULLIF(p_phone, ''),
    email = NULLIF(p_email, ''),
    address = NULLIF(p_address, ''),
    state = NULLIF(p_state, ''),
    pincode = NULLIF(p_pincode, ''),
    gst_number = NULLIF(p_gst_number, ''),
    updated_at = NOW()
  WHERE id = p_customer_id;

  RETURN json_build_object(
    'customer_id', p_customer_id,
    'status', 'updated'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_customer TO authenticated;
GRANT EXECUTE ON FUNCTION update_customer TO authenticated;
