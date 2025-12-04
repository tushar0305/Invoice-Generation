-- =============================================
-- INVOICE CREATION TRANSACTION FUNCTION
-- =============================================
-- Handles creating an invoice with items atomically
-- 1. Creates invoice header
-- 2. Creates invoice items
-- 3. Updates stock quantities (optional, if we track stock)
-- 4. Updates customer stats (optional)

CREATE OR REPLACE FUNCTION create_invoice_with_items(
  p_shop_id UUID,
  p_customer_id UUID,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_customer_address TEXT,
  p_items JSONB,  -- Array of items
  p_discount DECIMAL(10,2),
  p_notes TEXT,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_invoice_id UUID;
  v_invoice_number TEXT;
  v_item JSONB;
  v_subtotal DECIMAL(10,2) := 0;
  v_cgst_rate DECIMAL(5,2);
  v_sgst_rate DECIMAL(5,2);
  v_cgst_amount DECIMAL(10,2);
  v_sgst_amount DECIMAL(10,2);
  v_total_amount DECIMAL(10,2);
  v_grand_total DECIMAL(10,2);
  v_shop_name TEXT;
BEGIN
  -- Get shop details (tax rates)
  SELECT 
    cgst_rate, sgst_rate, shop_name 
  INTO 
    v_cgst_rate, v_sgst_rate, v_shop_name
  FROM shops 
  WHERE id = p_shop_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Shop not found';
  END IF;

  -- Generate Invoice Number (Simple auto-increment logic for now)
  -- In production, this should be more robust or use a sequence per shop
  SELECT 
    COALESCE(MAX(CAST(REGEXP_REPLACE(invoice_number, '\D', '', 'g') AS INTEGER)), 0) + 1
  INTO v_invoice_number
  FROM invoices
  WHERE shop_id = p_shop_id;
  
  v_invoice_number := 'INV-' || v_invoice_number;

  -- Create Invoice Header
  INSERT INTO invoices (
    shop_id,
    user_id,
    customer_id,
    customer_name,
    customer_phone,
    customer_address,
    invoice_number,
    status,
    invoice_date,
    discount,
    notes,
    created_by_name
  ) VALUES (
    p_shop_id,
    p_user_id,
    p_customer_id,
    p_customer_name,
    p_customer_phone,
    p_customer_address,
    v_invoice_number,
    'due',  -- Default status
    CURRENT_DATE,
    p_discount,
    p_notes,
    (SELECT email FROM auth.users WHERE id = p_user_id) -- Or fetch name from profile
  )
  RETURNING id INTO v_invoice_id;

  -- Process Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Insert Item
    INSERT INTO invoice_items (
      invoice_id,
      description,
      purity,
      gross_weight,
      net_weight,
      rate,
      making
    ) VALUES (
      v_invoice_id,
      v_item->>'description',
      v_item->>'purity',
      (v_item->>'grossWeight')::NUMERIC,
      (v_item->>'netWeight')::NUMERIC,
      (v_item->>'rate')::NUMERIC,
      (v_item->>'making')::NUMERIC
    );
    
    -- Calculate Item Total (Net Weight * Rate + Making)
    v_subtotal := v_subtotal + (
      (v_item->>'netWeight')::NUMERIC * (v_item->>'rate')::NUMERIC + (v_item->>'making')::NUMERIC
    );
  END LOOP;

  -- Calculate Taxes
  v_cgst_amount := (v_subtotal - COALESCE(p_discount, 0)) * (COALESCE(v_cgst_rate, 1.5) / 100);
  v_sgst_amount := (v_subtotal - COALESCE(p_discount, 0)) * (COALESCE(v_sgst_rate, 1.5) / 100);
  v_total_amount := (v_subtotal - COALESCE(p_discount, 0)) + v_cgst_amount + v_sgst_amount;
  v_grand_total := v_total_amount; -- Can add other charges here if needed

  -- Update Invoice Totals
  UPDATE invoices
  SET 
    subtotal = v_subtotal,
    cgst_amount = v_cgst_amount,
    sgst_amount = v_sgst_amount,
    total_amount = v_total_amount,
    grand_total = v_grand_total
  WHERE id = v_invoice_id;

  -- Return Created Invoice
  RETURN json_build_object(
    'invoice_id', v_invoice_id,
    'invoice_number', v_invoice_number,
    'grand_total', v_grand_total,
    'customer_name', p_customer_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_invoice_with_items TO authenticated;
