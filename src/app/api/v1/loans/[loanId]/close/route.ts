import { NextRequest, NextResponse } from 'next/server';
import { withAuth, checkShopAccess, successResponse, errorResponse } from '@/lib/api/utils';
import { validate, CloseLoanSchema } from '@/lib/api/validation';
import { createAuditLogger } from '@/lib/api/audit';

/**
 * POST /api/v1/loans/[loanId]/close
 * 
 * Closes a loan with:
 * - Settlement amount tracking
 * - Collateral confirmation requirement
 * - Atomic status update
 * - Complete audit trail
 */
export const POST = withAuth(async (
    req: NextRequest,
    { user, supabase, params }
) => {
    const { loanId } = params;

    // 1. Parse and validate input
    const body = await req.json();
    const input = validate(CloseLoanSchema, body);

    // 2. Fetch loan details
    const { data: loan, error: loanError } = await supabase
        .from('loans')
        .select(`
      id, 
      shop_id, 
      loan_number,
      status, 
      principal_amount, 
      total_amount_paid,
      customer:loan_customers(name)
    `)
        .eq('id', loanId)
        .single();

    if (loanError || !loan) {
        return errorResponse('Loan not found', 404, 'LOAN_NOT_FOUND');
    }

    // 3. Check permissions (only owner/manager can close loans)
    const { hasAccess, role } = await checkShopAccess(
        supabase,
        user.id,
        loan.shop_id,
        ['owner', 'manager']
    );

    if (!hasAccess) {
        return errorResponse(
            'You do not have permission to close loans. Only shop owners and managers can perform this action.',
            403,
            'INSUFFICIENT_PERMISSIONS'
        );
    }

    // 4. Validate collateral confirmation
    if (!input.collateralConfirmed) {
        return errorResponse(
            'You must confirm that all collateral has been returned to the customer',
            400,
            'COLLATERAL_NOT_CONFIRMED'
        );
    }

    // 5. Execute transaction via stored procedure
    const { data, error } = await supabase.rpc('close_loan', {
        p_loan_id: loanId,
        p_settlement_amount: input.settlementAmount || null,
        p_settlement_notes: input.settlementNotes || null,
        p_user_id: user.id,
    });

    if (error) {
        console.error('[Close Loan Error]', error);

        // Parse specific error messages
        if (error.message?.includes('already closed')) {
            return errorResponse(
                'This loan is already closed',
                400,
                'LOAN_ALREADY_CLOSED'
            );
        }

        return errorResponse(
            'Failed to close loan. Please try again.',
            500,
            'CLOSE_LOAN_FAILED'
        );
    }

    // 6. Log audit trail
    const auditLogger = createAuditLogger(supabase, user.id, loan.shop_id);
    await auditLogger.logUpdate('loan', loanId, {
        action: 'close',
        loanNumber: loan.loan_number,
        settlementAmount: data.settlement_amount,
        outstanding: data.outstanding,
        role,
    });

    // 7. Return success response
    return successResponse({
        loanId: data.loan_id,
        loanNumber: loan.loan_number,
        status: 'closed',
        endDate: data.end_date,
        settlementAmount: data.settlement_amount,
        outstanding: data.outstanding,
        message: `Loan #${loan.loan_number} closed successfully${data.outstanding > 0 ? ` with ₹${data.outstanding.toLocaleString()} outstanding balance` : ''}`,
    }, 200);
});
