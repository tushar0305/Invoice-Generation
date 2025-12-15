-- ==========================================
-- Migration: Fix generate_invoice_number_safe
-- Description: Fix "FOR UPDATE is not allowed with aggregate functions" error
-- Date: 2025-12-15
-- ==========================================

CREATE OR REPLACE FUNCTION generate_invoice_number_safe(p_shop_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_count INTEGER;
    v_year TEXT;
    v_invoice_number TEXT;
    v_attempts INTEGER := 0;
    v_max_attempts CONSTANT INTEGER := 5;
BEGIN
    v_year := to_char(current_date, 'YYYY');
    
    -- Retry loop for race condition handling
    LOOP
        v_attempts := v_attempts + 1;
        
        -- Lock the shop row to serialize invoice generation for this shop
        -- This replaces the invalid "MAX(...) FOR UPDATE"
        PERFORM 1 FROM shops WHERE id = p_shop_id FOR UPDATE;
        
        -- Get max invoice number for this year
        SELECT COALESCE(MAX(CAST(substring(invoice_number from 'INV-' || v_year || '-([0-9]+)') AS INTEGER)), 0)
        INTO v_count
        FROM invoices
        WHERE shop_id = p_shop_id 
          AND invoice_number LIKE 'INV-' || v_year || '-%';
        
        v_invoice_number := 'INV-' || v_year || '-' || LPAD((v_count + 1)::TEXT, 4, '0');
        
        -- Attempt to "reserve" this number by checking it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM invoices WHERE shop_id = p_shop_id AND invoice_number = v_invoice_number) THEN
            RETURN v_invoice_number;
        END IF;
        
        -- If we've exceeded max attempts, raise an error
        IF v_attempts >= v_max_attempts THEN
            RAISE EXCEPTION 'Could not generate unique invoice number after % attempts', v_max_attempts;
        END IF;
        
        -- Small wait before retry
        PERFORM pg_sleep(0.05);
    END LOOP;
END;
$$ LANGUAGE plpgsql SET search_path = public, extensions;
