import { NextRequest, NextResponse } from 'next/server';
import { withAuth, checkShopAccess, successResponse, errorResponse, APIError } from '@/lib/api/utils';
import { validate, PaymentSchema } from '@/lib/api/validation';
import { createAuditLogger } from '@/lib/api/audit';

/**
 * POST /api/v1/loans/[loanId]/payments
 * 
 * Adds a payment to a loan with:
 * - Authentication check
 * - Permission validation (owner/manager only)
 * - Business rule enforcement (via DB function)
 * - Audit logging
 * - Transaction safety (row-level locking in DB)
 */
export const POST = withAuth(async (
    req: NextRequest,
    { user, supabase, params }
) => {
    const { loanId } = params;

    // 1. Parse and validate input
    const body = await req.json();
    const payment = validate(PaymentSchema, body);

    // 2. Fetch loan to get shop_id and verify existence
    const { data: loan, error: loanError } = await supabase
        .from('loans')
        .select('id, shop_id, status, principal_amount, total_amount_paid')
        .eq('id', loanId)
        .single();

    if (loanError || !loan) {
        return errorResponse('Loan not found', 404, 'LOAN_NOT_FOUND');
    }

    // 3. Check user has permission to manage loans in this shop
    const { hasAccess, role } = await checkShopAccess(
        supabase,
        user.id,
        loan.shop_id,
        ['owner', 'manager'] // Only owners and managers can add payments
    );

    if (!hasAccess) {
        return errorResponse(
            'You do not have permission to add payments. Only shop owners and managers can perform this action.',
            403,
            'INSUFFICIENT_PERMISSIONS'
        );
    }

    // 4. Execute transaction via stored procedure
    // This handles all business logic, validation, and atomic updates
    const { data, error } = await supabase.rpc('add_loan_payment', {
        p_loan_id: loanId,
        p_amount: payment.amount,
        p_payment_type: payment.paymentType,
        p_payment_method: payment.paymentMethod,
        p_notes: payment.notes || null,
        p_user_id: user.id,
    });

    if (error) {
        console.error('[Add Payment Error]', error);

        // Parse specific error messages from DB function
        if (error.message?.includes('closed loan')) {
            return errorResponse(
                'Cannot add payment to a closed loan',
                400,
                'LOAN_CLOSED'
            );
        }

        return errorResponse(
            'Failed to add payment. Please try again.',
            500,
            'PAYMENT_FAILED'
        );
    }

    // 5. Log audit trail
    const auditLogger = createAuditLogger(supabase, user.id, loan.shop_id);
    await auditLogger.logCreate('loan_payment', data.payment_id, {
        loanId,
        amount: payment.amount,
        paymentType: payment.paymentType,
        previousTotal: data.previous_total,
        newTotal: data.new_total,
        role,
    });

    // 6. Return success response
    return successResponse({
        paymentId: data.payment_id,
        loanId,
        amount: payment.amount,
        previousTotal: data.previous_total,
        newTotal: data.new_total,
        message: `Payment of ₹${payment.amount.toLocaleString()} added successfully`,
    }, 201);
});
