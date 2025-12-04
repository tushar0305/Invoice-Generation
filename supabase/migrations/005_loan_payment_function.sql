-- =============================================
-- LOAN PAYMENT TRANSACTION FUNCTION
-- =============================================
-- This function handles adding a payment to a loan with:
-- 1. Row-level locking to prevent race conditions
-- 2. Atomic updates to prevent data corruption
-- 3. Business rule validation
-- 4. Transaction safety

CREATE OR REPLACE FUNCTION add_loan_payment(
  p_loan_id UUID,
  p_amount DECIMAL(12,2),
  p_payment_type TEXT,
  p_payment_method TEXT,
  p_notes TEXT,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_payment_id UUID;
  v_shop_id UUID;
  v_current_total DECIMAL(12,2);
  v_new_total DECIMAL(12,2);
  v_loan_status TEXT;
BEGIN
  -- Lock the loan row to prevent concurrent updates (CRITICAL for race condition prevention)
  SELECT 
    total_amount_paid, 
    shop_id, 
    status 
  INTO 
    v_current_total, 
    v_shop_id, 
    v_loan_status
  FROM loans
  WHERE id = p_loan_id
  FOR UPDATE;  -- 🔒 Row-level lock until transaction commits
  
  -- Validate loan exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan not found: %', p_loan_id;
  END IF;
  
  -- Business rule: Cannot add payment to closed loan
  IF v_loan_status = 'closed' THEN
    RAISE EXCEPTION 'Cannot add payment to closed loan';
  END IF;
  
  -- Business rule: Amount must be positive
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be positive';
  END IF;
  
  -- Insert payment record
  INSERT INTO loan_payments (
    loan_id,
    amount,
    payment_type,
    payment_method,
    notes,
    payment_date
  ) VALUES (
    p_loan_id,
    p_amount,
    p_payment_type,
    p_payment_method,
    p_notes,
    CURRENT_DATE
  )
  RETURNING id INTO v_payment_id;
  
  -- Calculate new total (atomic operation)
  v_new_total := COALESCE(v_current_total, 0) + p_amount;
  
  -- Update loan total
  UPDATE loans
  SET 
    total_amount_paid = v_new_total,
    updated_at = NOW()
  WHERE id = p_loan_id;
  
  -- Return success with details
  RETURN json_build_object(
    'payment_id', v_payment_id,
    'shop_id', v_shop_id,
    'previous_total', COALESCE(v_current_total, 0),
    'new_total', v_new_total,
    'amount_added', p_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_loan_payment TO authenticated;

-- Add comment
COMMENT ON FUNCTION add_loan_payment IS 'Atomically adds a payment to a loan with row-level locking to prevent race conditions';
