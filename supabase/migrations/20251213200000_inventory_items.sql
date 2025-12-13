-- Migration: Add Unique Product Tagging (inventory_items)
-- This replaces the quantity-based stock_items with unit-based inventory

-- ============================================
-- 1. Create new inventory_items table
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_items (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id TEXT UNIQUE NOT NULL,           -- Human-readable: "SV-G22-001234"
  qr_data TEXT,                           -- Compact data for QR code (just tag_id)

  -- Ownership
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,

  -- Product Classification
  metal_type TEXT NOT NULL,               -- 'GOLD', 'SILVER', 'DIAMOND', 'PLATINUM'
  purity TEXT NOT NULL,                   -- '22K', '18K', '24K', '916', '999', 'Silver'
  category TEXT,                          -- 'Ring', 'Necklace', 'Bangle', etc.
  subcategory TEXT,                       -- 'Engagement', 'Traditional', etc.
  hsn_code TEXT,                          -- GST HSN code

  -- Physical Properties (per-item, not template)
  gross_weight DECIMAL(10,3) NOT NULL,    -- Weight with stones, kundan, etc.
  net_weight DECIMAL(10,3) NOT NULL,      -- Pure metal weight
  stone_weight DECIMAL(10,3) DEFAULT 0,
  wastage_percent DECIMAL(5,2) DEFAULT 0,

  -- Pricing
  making_charge_type TEXT DEFAULT 'PER_GRAM' CHECK (making_charge_type IN ('PER_GRAM', 'FIXED', 'PERCENT')),
  making_charge_value DECIMAL(10,2) DEFAULT 0,
  stone_value DECIMAL(10,2) DEFAULT 0,
  purchase_cost DECIMAL(10,2),            -- What shop paid for it
  selling_price DECIMAL(10,2),            -- Tagged MRP (optional)

  -- Lifecycle & Status
  status TEXT NOT NULL DEFAULT 'IN_STOCK' CHECK (status IN ('IN_STOCK', 'RESERVED', 'SOLD', 'EXCHANGED', 'LOANED', 'MELTED', 'DAMAGED')),
  location TEXT DEFAULT 'SHOWCASE',       -- 'SHOWCASE', 'VAULT', 'SENT_FOR_REPAIR'
  reserved_for_customer_id UUID REFERENCES customers(id),
  reserved_until TIMESTAMPTZ,

  -- Source Tracking
  source_type TEXT NOT NULL DEFAULT 'VENDOR_PURCHASE' CHECK (source_type IN ('VENDOR_PURCHASE', 'CUSTOMER_EXCHANGE', 'MELT_REMAKE', 'GIFT_RECEIVED')),
  source_notes TEXT,
  vendor_name TEXT,                       -- If purchased from vendor

  -- Disposition Tracking (when item leaves inventory)
  sold_invoice_id UUID REFERENCES invoices(id),
  sold_at TIMESTAMPTZ,

  -- Images & Certification
  images JSONB DEFAULT '[]'::jsonb,       -- Array of image URLs
  certification_info JSONB,               -- Hallmark, BIS, etc.

  -- Description & Notes
  name TEXT NOT NULL,                     -- "Antique Temple Necklace"
  description TEXT,
  internal_notes TEXT,                    -- Staff-only notes

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 2. Create tag sequence table (per shop)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_tag_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  metal_type TEXT NOT NULL,
  last_sequence INTEGER DEFAULT 0,
  UNIQUE(shop_id, metal_type)
);

-- ============================================
-- 3. Create status history table (audit trail)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  old_location TEXT,
  new_location TEXT,
  reason TEXT,
  reference_id UUID,                      -- Invoice, loan, exchange ID
  reference_type TEXT,                    -- 'INVOICE', 'LOAN', 'EXCHANGE'
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 4. Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_inventory_items_shop_id ON inventory_items(shop_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_inventory_items_metal_type ON inventory_items(metal_type);
CREATE INDEX IF NOT EXISTS idx_inventory_items_purity ON inventory_items(purity);
CREATE INDEX IF NOT EXISTS idx_inventory_items_tag_id ON inventory_items(tag_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_status_history_item_id ON inventory_status_history(item_id);

-- ============================================
-- 5. Enable RLS
-- ============================================
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_tag_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_status_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS Policies (using existing helper functions)
-- ============================================

-- inventory_items policies
DROP POLICY IF EXISTS "inventory_items_shop_access" ON inventory_items;
CREATE POLICY "inventory_items_shop_access" ON inventory_items
  FOR ALL
  USING (public.is_shop_member(shop_id))
  WITH CHECK (public.is_shop_member(shop_id));

-- inventory_tag_sequences policies
DROP POLICY IF EXISTS "inventory_tag_sequences_shop_access" ON inventory_tag_sequences;
CREATE POLICY "inventory_tag_sequences_shop_access" ON inventory_tag_sequences
  FOR ALL
  USING (public.is_shop_member(shop_id))
  WITH CHECK (public.is_shop_member(shop_id));

-- inventory_status_history policies
DROP POLICY IF EXISTS "inventory_status_history_access" ON inventory_status_history;
CREATE POLICY "inventory_status_history_access" ON inventory_status_history
  FOR ALL
  USING (
    item_id IN (
      SELECT id FROM inventory_items WHERE public.is_shop_member(shop_id)
    )
  );


-- ============================================
-- 7. Function to generate next tag_id
-- ============================================
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
  -- Get shop prefix (first 2 chars of shop name, uppercased)
  SELECT UPPER(SUBSTRING(name FROM 1 FOR 2)) INTO v_shop_prefix FROM shops WHERE id = p_shop_id;
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

-- ============================================
-- 8. Trigger to auto-generate tag_id
-- ============================================
CREATE OR REPLACE FUNCTION set_inventory_tag_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tag_id IS NULL OR NEW.tag_id = '' THEN
    NEW.tag_id := generate_inventory_tag_id(NEW.shop_id, NEW.metal_type, NEW.purity);
  END IF;
  NEW.qr_data := NEW.tag_id;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_inventory_tag_id ON inventory_items;
CREATE TRIGGER trigger_set_inventory_tag_id
  BEFORE INSERT ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION set_inventory_tag_id();

-- ============================================
-- 9. Trigger for status history tracking
-- ============================================
CREATE OR REPLACE FUNCTION track_inventory_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status OR OLD.location IS DISTINCT FROM NEW.location THEN
    INSERT INTO inventory_status_history (item_id, old_status, new_status, old_location, new_location, created_by)
    VALUES (NEW.id, OLD.status, NEW.status, OLD.location, NEW.location, auth.uid());
  END IF;
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_track_inventory_status ON inventory_items;
CREATE TRIGGER trigger_track_inventory_status
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION track_inventory_status_change();

-- ============================================
-- 10. DEPRECATE old stock_items table
-- Note: We keep table but mark as deprecated
-- Drop after confirming migration complete
-- ============================================
COMMENT ON TABLE stock_items IS 'DEPRECATED: Use inventory_items for unique product tagging. This table will be removed in future.';
