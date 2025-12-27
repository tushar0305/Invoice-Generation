-- Migration: stock_tally_mode
-- Description: Adds tables for inventory auditing and RPCs for session management.

-- 1. Create inventory_audits table
CREATE TABLE IF NOT EXISTS public.inventory_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'CANCELLED')) DEFAULT 'IN_PROGRESS',
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    total_items_snapshot INTEGER DEFAULT 0,
    verified_items_count INTEGER DEFAULT 0,
    missing_items_count INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create inventory_audit_items table
CREATE TABLE IF NOT EXISTS public.inventory_audit_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES public.inventory_audits(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('VERIFIED', 'EXTRA', 'MISSING')) DEFAULT 'VERIFIED',
    scanned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(audit_id, inventory_item_id)
);

-- 3. Indexes
CREATE INDEX idx_inventory_audits_shop_id ON public.inventory_audits(shop_id);
CREATE INDEX idx_inventory_audit_items_audit_id ON public.inventory_audit_items(audit_id);
CREATE INDEX idx_inventory_audit_items_item_id ON public.inventory_audit_items(inventory_item_id);

-- 4. RPC: Create Audit Session
CREATE OR REPLACE FUNCTION public.create_audit_session(p_shop_id UUID, p_notes TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_audit_id UUID;
    v_total_items INTEGER;
BEGIN
    -- Get current IN_STOCK count
    SELECT COUNT(*) INTO v_total_items
    FROM public.inventory_items
    WHERE shop_id = p_shop_id AND status = 'IN_STOCK' AND deleted_at IS NULL;

    -- Create Audit Record
    INSERT INTO public.inventory_audits (shop_id, total_items_snapshot, notes)
    VALUES (p_shop_id, v_total_items, p_notes)
    RETURNING id INTO v_audit_id;

    RETURN jsonb_build_object(
        'id', v_audit_id,
        'total_items_snapshot', v_total_items
    );
END;
$$;

-- 5. RPC: Scan Item
CREATE OR REPLACE FUNCTION public.scan_audit_item(p_audit_id UUID, p_tag_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_audit RECORD;
    v_existing_scan UUID;
BEGIN
    -- Get Audit Info
    SELECT * INTO v_audit FROM public.inventory_audits WHERE id = p_audit_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Audit session not found';
    END IF;

    IF v_audit.status != 'IN_PROGRESS' THEN
        RAISE EXCEPTION 'Audit session is not in progress';
    END IF;

    -- Find Item
    SELECT * INTO v_item 
    FROM public.inventory_items 
    WHERE shop_id = v_audit.shop_id 
      AND tag_id = p_tag_id 
      AND deleted_at IS NULL;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('status', 'NOT_FOUND', 'message', 'Item not found in inventory');
    END IF;

    -- Check if already scanned
    SELECT id INTO v_existing_scan 
    FROM public.inventory_audit_items 
    WHERE audit_id = p_audit_id AND inventory_item_id = v_item.id;

    IF v_existing_scan IS NOT NULL THEN
         RETURN jsonb_build_object('status', 'DUPLICATE', 'item', row_to_json(v_item));
    END IF;

    -- Record Scan
    INSERT INTO public.inventory_audit_items (audit_id, inventory_item_id, status)
    VALUES (p_audit_id, v_item.id, 'VERIFIED');

    -- Update counts
    UPDATE public.inventory_audits
    SET verified_items_count = verified_items_count + 1,
        updated_at = now()
    WHERE id = p_audit_id;

    RETURN jsonb_build_object('status', 'VERIFIED', 'item', row_to_json(v_item));
END;
$$;

-- 6. RPC: Complete Audit Session
CREATE OR REPLACE FUNCTION public.complete_audit_session(p_audit_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_audit RECORD;
    v_missing_count INTEGER;
BEGIN
    -- Get Audit
    SELECT * INTO v_audit FROM public.inventory_audits WHERE id = p_audit_id;
    
    -- Calculate Missing Items (In Stock but NOT scanned)
    SELECT COUNT(*) INTO v_missing_count
    FROM public.inventory_items i
    WHERE i.shop_id = v_audit.shop_id 
      AND i.status = 'IN_STOCK' 
      AND i.deleted_at IS NULL
      AND NOT EXISTS (
          SELECT 1 FROM public.inventory_audit_items ai 
          WHERE ai.audit_id = p_audit_id AND ai.inventory_item_id = i.id
      );

    -- Update Audit
    UPDATE public.inventory_audits
    SET status = 'COMPLETED',
        completed_at = now(),
        missing_items_count = v_missing_count,
        updated_at = now()
    WHERE id = p_audit_id;

    RETURN jsonb_build_object('success', true, 'missing_count', v_missing_count);
END;
$$;

-- Enable RLS
ALTER TABLE public.inventory_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_audit_items ENABLE ROW LEVEL SECURITY;

-- Policies (Simple for now, matching existing shop policies)
CREATE POLICY "Enable all for authenticated users" ON public.inventory_audits FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON public.inventory_audit_items FOR ALL USING (auth.role() = 'authenticated');
