-- Fix: generate_inventory_tag_id references wrong column name in shops table
-- The shops table has 'shop_name' not 'name'

CREATE OR REPLACE FUNCTION generate_inventory_tag_id(
  p_shop_id UUID,
  p_metal_type TEXT,
  p_purity TEXT
) RETURNS TEXT AS $$
DECLARE
  v_shop_prefix TEXT;
  v_metal_code TEXT;
  v_purity_code TEXT;
  v_sequence INTEGER;
  v_tag_id TEXT;
BEGIN
  -- Get shop prefix (first 2 chars of shop_name, uppercased)
  SELECT UPPER(SUBSTRING(shop_name FROM 1 FOR 2)) INTO v_shop_prefix FROM shops WHERE id = p_shop_id;
  IF v_shop_prefix IS NULL THEN
    v_shop_prefix := 'XX';
  END IF;

  -- Metal code
  v_metal_code := CASE p_metal_type
    WHEN 'GOLD' THEN 'G'
    WHEN 'SILVER' THEN 'S'
    WHEN 'DIAMOND' THEN 'D'
    WHEN 'PLATINUM' THEN 'P'
    ELSE 'X'
  END;

  -- Purity code (first 2 digits)
  v_purity_code := REGEXP_REPLACE(p_purity, '[^0-9]', '', 'g');
  IF LENGTH(v_purity_code) > 2 THEN
    v_purity_code := SUBSTRING(v_purity_code FROM 1 FOR 2);
  END IF;
  IF LENGTH(v_purity_code) < 2 THEN
    v_purity_code := LPAD(v_purity_code, 2, '0');
  END IF;

  -- Get and increment sequence
  INSERT INTO inventory_tag_sequences (shop_id, metal_type, last_sequence)
  VALUES (p_shop_id, p_metal_type, 1)
  ON CONFLICT (shop_id, metal_type)
  DO UPDATE SET last_sequence = inventory_tag_sequences.last_sequence + 1
  RETURNING last_sequence INTO v_sequence;

  -- Build tag: XX-G22-000001
  v_tag_id := v_shop_prefix || '-' || v_metal_code || v_purity_code || '-' || LPAD(v_sequence::TEXT, 6, '0');

  RETURN v_tag_id;
END;
$$ LANGUAGE plpgsql;

-- Update trigger to auto-generate name if not provided
CREATE OR REPLACE FUNCTION set_inventory_tag_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tag_id IS NULL OR NEW.tag_id = '' THEN
    NEW.tag_id := generate_inventory_tag_id(NEW.shop_id, NEW.metal_type, NEW.purity);
  END IF;
  NEW.qr_data := NEW.tag_id;
  
  -- Auto-generate name if not provided
  IF NEW.name IS NULL OR NEW.name = '' THEN
    NEW.name := COALESCE(NEW.category, NEW.metal_type) || ' ' || NEW.tag_id;
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
