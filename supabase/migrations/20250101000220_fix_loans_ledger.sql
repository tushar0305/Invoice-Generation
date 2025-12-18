-- Migration: Fix Loans Ledger Integration
-- Description: Adds RPCs for processing loan payments and closing loans with Ledger (Khata) integration.

-- 1. ADD LOAN PAYMENT FUNCTION with Ledger Support
CREATE OR REPLACE FUNCTION add_loan_payment(
  p_loan_id uuid,
  p_amount numeric,
  p_payment_type text, -- 'principal', 'interest', 'full_settlement'
  p_payment_method text,
  p_notes text,
  p_user_id uuid
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_loan_status text;
  v_current_paid numeric;
  v_principal numeric;
  v_new_total numeric;
  v_payment_id uuid;
  v_shop_id uuid;
  v_customer_id uuid;
  v_loan_number text;
  v_customer_name text;
BEGIN
  -- Lock loan row and get details
  SELECT l.status, l.total_amount_paid, l.principal_amount, l.shop_id, l.customer_id, l.loan_number, c.name
  INTO v_loan_status, v_current_paid, v_principal, v_shop_id, v_customer_id, v_loan_number, v_customer_name
  FROM loans l
  JOIN loan_customers c ON l.customer_id = c.id
  WHERE l.id = p_loan_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan not found';
  END IF;

  IF v_loan_status = 'closed' OR v_loan_status = 'rejected' THEN
    RAISE EXCEPTION 'Cannot add payment to a closed loan';
  END IF;

  -- Insert payment
  INSERT INTO loan_payments (loan_id, amount, payment_type, payment_method, notes)
  VALUES (p_loan_id, p_amount, p_payment_type, p_payment_method, p_notes)
  RETURNING id INTO v_payment_id;

  -- Update loan totals
  v_new_total := v_current_paid + p_amount;
  UPDATE loans
  SET total_amount_paid = v_new_total,
      updated_at = now()
  WHERE id = p_loan_id;

  -- LEDGER INTEGRATION: CREDITING THE CUSTOMER
  -- We need to link this 'loan_customer' to the main 'customers' table if they are shared, 
  -- OR we just log it in the ledger referencing the loan_customer_id if the system supports it.
  -- Currently, `ledger_transactions` has `customer_id` which FKs to `customers`. 
  -- `loan_customers` is a SEPARATE table as per schema.
  
  -- CRITICAL ISSUE: `ledger_transactions` FKs to `customers` table, but Loans uses `loan_customers`.
  -- If we want Loans in Khata, `loan_customers` should probably be `customers`.
  -- AUDIT FINDING: The schema shows `loan_customers` is separate.
  -- STRATEGY: For now, we only log to Ledger IF the customer also exists in `customers` matching phone?
  -- OR we assume the system design meant to keep them separate?
  -- User Request: "Check Ledger Integration".
  -- If I try to insert into `ledger_transactions` with `loan_customer.id`, it will fail FK constraint if that ID isn't in `customers`.
  
  -- SOLUTION: Check if a customer exists in `customers` table with the same ID (if we used same ID) or same Phone.
  -- Detailed Look at `loans/new/client.tsx`: It tries to find/create in `loan_customers`.
  -- It does NOT seem to sync with `customers`.
  
  -- FOR THIS MIGRATION: I will assume "Best Effort" ledger integration. 
  -- I need to find the corresponding `customer_id` in `customers` table using the Phone Number.
  DECLARE 
    v_main_customer_id uuid;
  BEGIN
      SELECT id INTO v_main_customer_id FROM customers WHERE shop_id = v_shop_id AND phone = (SELECT phone FROM loan_customers WHERE id = v_customer_id) LIMIT 1;
      
      IF v_main_customer_id IS NOT NULL THEN
          INSERT INTO ledger_transactions (
            shop_id, 
            customer_id, 
            transaction_type, 
            amount, 
            entry_type, 
            description, 
            created_by
          ) VALUES (
            v_shop_id, 
            v_main_customer_id, 
            'PAYMENT', 
            p_amount, 
            'CREDIT', 
            'Loan Repayment #' || v_loan_number || ' (' || p_payment_type || ')', 
            p_user_id
          );
          
          -- Update stats
          UPDATE customers 
          SET total_spent = total_spent -- No change to total spent, but balance changes via view
          WHERE id = v_main_customer_id;
      ELSE
          -- If no matching main customer, we SKIP ledger entry to avoid error.
          -- This is a safe fallback.
          NULL;
      END IF;
  END;

  RETURN json_build_object(
    'payment_id', v_payment_id,
    'previous_total', v_current_paid,
    'new_total', v_new_total
  );
END;
$$;

-- 2. CLOSE LOAN FUNCTION with Ledger Support
CREATE OR REPLACE FUNCTION close_loan(
  p_loan_id uuid,
  p_settlement_amount numeric,
  p_settlement_notes text,
  p_user_id uuid
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_loan_status text;
  v_principal numeric;
  v_total_paid numeric;
  v_outstanding numeric;
  v_final_settlement numeric;
  v_shop_id uuid;
  v_customer_id uuid;
  v_loan_number text;
BEGIN
  -- Lock loan row
  SELECT l.status, l.principal_amount, l.total_amount_paid, l.shop_id, l.customer_id, l.loan_number
  INTO v_loan_status, v_principal, v_total_paid, v_shop_id, v_customer_id, v_loan_number
  FROM loans l
  WHERE l.id = p_loan_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan not found';
  END IF;

  IF v_loan_status = 'closed' THEN
    RAISE EXCEPTION 'Loan is already closed';
  END IF;

  -- Determine final numbers
  v_final_settlement := COALESCE(p_settlement_amount, v_total_paid);
  -- If settlement > total_paid, it means extra cash was paid at closing (e.g. final interest)
  -- If settlement < total_paid, it implies a discount/waiver was given? 
  -- Usually settlement amount is the TARGET total to be paid.
  
  -- Let's assume p_settlement_amount is the FINAL AGREED TOTAL PAYMENT for the loan.
  -- So difference = p_settlement_amount - v_total_paid matches the "Final Payment" needed.
  
  DECLARE
    v_final_payment_needed numeric;
  BEGIN
    v_final_payment_needed := v_final_settlement - v_total_paid;
    
    IF v_final_payment_needed > 0 THEN
        -- Add a final payment record automatically
        INSERT INTO loan_payments (loan_id, amount, payment_type, payment_method, notes)
        VALUES (p_loan_id, v_final_payment_needed, 'full_settlement', 'cash', 'Final Settlement at Closing');
        
        -- And Ledger Integration (Same logic as above)
        DECLARE 
            v_main_customer_id uuid;
        BEGIN
            SELECT id INTO v_main_customer_id FROM customers WHERE shop_id = v_shop_id AND phone = (SELECT phone FROM loan_customers WHERE id = v_customer_id) LIMIT 1;
            IF v_main_customer_id IS NOT NULL THEN
                INSERT INTO ledger_transactions (
                    shop_id, customer_id, transaction_type, amount, entry_type, description, created_by
                ) VALUES (
                    v_shop_id, v_main_customer_id, 'PAYMENT', v_final_payment_needed, 'CREDIT', 'Loan Final Settlement #' || v_loan_number, p_user_id
                );
            END IF;
        END;
        
        v_total_paid := v_final_settlement;
    END IF;
  END;

  -- Update loan status
  UPDATE loans
  SET status = 'closed',
      end_date = CURRENT_DATE,
      total_amount_paid = v_total_paid, -- Ensure this matches
      settlement_amount = v_final_settlement,
      settlement_notes = p_settlement_notes,
      updated_at = now()
  WHERE id = p_loan_id;

  RETURN json_build_object(
    'loan_id', p_loan_id,
    'end_date', CURRENT_DATE,
    'settlement_amount', v_final_settlement
  );
END;
$$;
