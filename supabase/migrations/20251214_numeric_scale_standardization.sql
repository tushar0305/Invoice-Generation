DO $$
BEGIN
  -- Invoices totals
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'grand_total'
  ) THEN
    ALTER TABLE invoices ALTER COLUMN grand_total TYPE NUMERIC(12,2) USING grand_total::numeric;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'subtotal'
  ) THEN
    ALTER TABLE invoices ALTER COLUMN subtotal TYPE NUMERIC(12,2) USING subtotal::numeric;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'discount'
  ) THEN
    ALTER TABLE invoices ALTER COLUMN discount TYPE NUMERIC(12,2) USING discount::numeric;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'cgst_amount'
  ) THEN
    ALTER TABLE invoices ALTER COLUMN cgst_amount TYPE NUMERIC(12,2) USING cgst_amount::numeric;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'sgst_amount'
  ) THEN
    ALTER TABLE invoices ALTER COLUMN sgst_amount TYPE NUMERIC(12,2) USING sgst_amount::numeric;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'paid_amount'
  ) THEN
    ALTER TABLE invoices ALTER COLUMN paid_amount TYPE NUMERIC(12,2) USING paid_amount::numeric;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'due_amount'
  ) THEN
    ALTER TABLE invoices ALTER COLUMN due_amount TYPE NUMERIC(12,2) USING due_amount::numeric;
  END IF;
END $$;

DO $$
BEGIN
  -- Invoice items pricing
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'unit_price'
  ) THEN
    ALTER TABLE invoice_items ALTER COLUMN unit_price TYPE NUMERIC(12,2) USING unit_price::numeric;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'line_total'
  ) THEN
    ALTER TABLE invoice_items ALTER COLUMN line_total TYPE NUMERIC(12,2) USING line_total::numeric;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'tax_amount'
  ) THEN
    ALTER TABLE invoice_items ALTER COLUMN tax_amount TYPE NUMERIC(12,2) USING tax_amount::numeric;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'discount_amount'
  ) THEN
    ALTER TABLE invoice_items ALTER COLUMN discount_amount TYPE NUMERIC(12,2) USING discount_amount::numeric;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'amount'
  ) THEN
    ALTER TABLE invoice_items ALTER COLUMN amount TYPE NUMERIC(12,2) USING amount::numeric;
  END IF;
END $$;

DO $$
BEGIN
  -- Inventory monetary fields
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'making_charge_value'
  ) THEN
    ALTER TABLE inventory_items ALTER COLUMN making_charge_value TYPE NUMERIC(12,2) USING making_charge_value::numeric;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'stone_value'
  ) THEN
    ALTER TABLE inventory_items ALTER COLUMN stone_value TYPE NUMERIC(12,2) USING stone_value::numeric;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'purchase_cost'
  ) THEN
    ALTER TABLE inventory_items ALTER COLUMN purchase_cost TYPE NUMERIC(12,2) USING purchase_cost::numeric;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'selling_price'
  ) THEN
    ALTER TABLE inventory_items ALTER COLUMN selling_price TYPE NUMERIC(12,2) USING selling_price::numeric;
  END IF;
END $$;

DO $$
BEGIN
  -- Ledger transactions amounts
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'ledger_transactions' AND column_name = 'amount'
  ) THEN
    BEGIN
      ALTER TABLE ledger_transactions ALTER COLUMN amount TYPE NUMERIC(12,2) USING amount::numeric;
    EXCEPTION
      WHEN feature_not_supported OR dependent_objects_still_exist OR insufficient_privilege THEN
        RAISE NOTICE 'Skipping ledger_transactions.amount type change due to dependency (views/rules).';
    WHEN OTHERS THEN
        RAISE NOTICE 'Skipping ledger_transactions.amount type change: %', SQLERRM;
    END;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'ledger_transactions' AND column_name = 'balance_after'
  ) THEN
    BEGIN
      ALTER TABLE ledger_transactions ALTER COLUMN balance_after TYPE NUMERIC(12,2) USING balance_after::numeric;
    EXCEPTION
      WHEN feature_not_supported OR dependent_objects_still_exist OR insufficient_privilege THEN
        RAISE NOTICE 'Skipping ledger_transactions.balance_after type change due to dependency (views/rules).';
      WHEN OTHERS THEN
        RAISE NOTICE 'Skipping ledger_transactions.balance_after type change: %', SQLERRM;
    END;
  END IF;
END $$;

DO $$
BEGIN
  -- Market rates
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'market_rates' AND column_name = 'gold_24k'
  ) THEN
    ALTER TABLE market_rates ALTER COLUMN gold_24k TYPE NUMERIC(12,2) USING gold_24k::numeric;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'market_rates' AND column_name = 'gold_22k'
  ) THEN
    ALTER TABLE market_rates ALTER COLUMN gold_22k TYPE NUMERIC(12,2) USING gold_22k::numeric;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'market_rates' AND column_name = 'silver'
  ) THEN
    ALTER TABLE market_rates ALTER COLUMN silver TYPE NUMERIC(12,2) USING silver::numeric;
  END IF;
END $$;

DO $$
BEGIN
  -- Schemes and enrollments
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'scheme_enrollments' AND column_name = 'total_paid'
  ) THEN
    ALTER TABLE scheme_enrollments ALTER COLUMN total_paid TYPE NUMERIC(12,2) USING total_paid::numeric;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'schemes' AND column_name = 'monthly_amount'
  ) THEN
    ALTER TABLE schemes ALTER COLUMN monthly_amount TYPE NUMERIC(12,2) USING monthly_amount::numeric;
  END IF;
END $$;

DO $$
BEGIN
  -- Customers total_spent aggregation
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'total_spent'
  ) THEN
    ALTER TABLE customers ALTER COLUMN total_spent TYPE NUMERIC(12,2) USING total_spent::numeric;
  END IF;
END $$;
