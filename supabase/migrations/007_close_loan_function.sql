-- =============================================
-- CLOSE LOAN TRANSACTION FUNCTION
-- =============================================
-- Handles loan closure with:
-- 1. Status validation
-- 2. Settlement amount tracking
-- 3. Atomic updates
-- 4. Collateral tracking

CREATE OR REPLACE FUNCTION close_loan(
  p_loan_id UUID,
  p_settlement_amount DECIMAL(12,2),
  p_settlement_notes TEXT,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_shop_id UUID;
  v_loan_status TEXT;
  v_current_total_paid DECIMAL(12,2);
  v_principal_amount DECIMAL(12,2);
  v_final_settlement DECIMAL(12,2);
BEGIN
  -- Lock the loan row to prevent concurrent operations
  SELECT 
    shop_id, 
    status, 
    total_amount_paid,
    principal_amount
  INTO 
    v_shop_id, 
    v_loan_status,
    v_current_total_paid,
    v_principal_amount
  FROM loans
  WHERE id = p_loan_id
  FOR UPDATE;  -- 🔒 Lock until transaction commits
  
  -- Validate loan exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan not found: %', p_loan_id;
  END IF;
  
  -- Business rule: Cannot close already closed loan
  IF v_loan_status = 'closed' THEN
    RAISE EXCEPTION 'Loan is already closed';
  END IF;
  
  -- Determine final settlement amount
  -- If provided, use it; otherwise use total amount paid
  v_final_settlement := COALESCE(p_settlement_amount, v_current_total_paid);
  
  -- Update loan status to closed
  UPDATE loans
  SET 
    status = 'closed',
    end_date = CURRENT_DATE,
    settlement_amount = v_final_settlement,
    settlement_notes = p_settlement_notes,
    updated_at = NOW()
  WHERE id = p_loan_id;
  
  -- Return success details
  RETURN json_build_object(
    'loan_id', p_loan_id,
    'shop_id', v_shop_id,
    'status', 'closed',
    'end_date', CURRENT_DATE,
    'settlement_amount', v_final_settlement,
    'principal_amount', v_principal_amount,
    'total_paid', v_current_total_paid,
    'outstanding', GREATEST(0, v_principal_amount - v_final_settlement)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION close_loan TO authenticated;

COMMENT ON FUNCTION close_loan IS 'Closes a loan with settlement tracking and atomic status update';
