DO $$ 
BEGIN 
    -- 1. Add Missing Columns to invoice_items
    -- Core Identity
    ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS metal_type text;
    ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS category text;
    ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS hsn_code text;
    
    -- Weight & Value Details
    ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS stone_weight numeric(10, 3) DEFAULT 0;
    ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS stone_amount numeric(12, 2) DEFAULT 0;
    ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS wastage_percent numeric(5, 2) DEFAULT 0;
    ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS making_rate numeric(10, 2) DEFAULT 0;

    -- 2. Drop the generated expression on 'amount' if it exists
    -- The error "column 'amount' is a generated column" means we must use DROP EXPRESSION
    -- We want application logic to control the exact amount
    BEGIN
        ALTER TABLE invoice_items ALTER COLUMN amount DROP EXPRESSION;
    EXCEPTION
        WHEN undefined_column THEN 
            -- If it wasn't a generated column, try dropping default just in case
            ALTER TABLE invoice_items ALTER COLUMN amount DROP DEFAULT;
        WHEN OTHERS THEN
            NULL; -- Ignore other errors (like if it's already a normal column)
    END;

    -- 3. Ensure Precision for existing weight columns
    ALTER TABLE invoice_items ALTER COLUMN gross_weight TYPE numeric(10, 3);
    ALTER TABLE invoice_items ALTER COLUMN net_weight TYPE numeric(10, 3);

    RAISE NOTICE 'Schema successfully updated for invoice_items alignment.';
END $$;
