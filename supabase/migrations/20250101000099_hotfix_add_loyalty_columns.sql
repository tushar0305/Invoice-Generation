-- Hotfix: Add missing loyalty columns to invoices table
-- This is required because the consolidated schema migration might not have been re-applied to the existing DB.

DO $$
BEGIN
    -- 1. loyalty_points_earned
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'invoices' 
        AND column_name = 'loyalty_points_earned'
    ) THEN
        ALTER TABLE public.invoices ADD COLUMN loyalty_points_earned INTEGER DEFAULT 0;
    END IF;

    -- 2. loyalty_points_redeemed
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'invoices' 
        AND column_name = 'loyalty_points_redeemed'
    ) THEN
        ALTER TABLE public.invoices ADD COLUMN loyalty_points_redeemed INTEGER DEFAULT 0;
    END IF;
END $$;
