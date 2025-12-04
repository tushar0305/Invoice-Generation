import { NextRequest, NextResponse } from 'next/server';
import { withAuth, checkShopAccess, successResponse, errorResponse } from '@/lib/api/utils';
import { validate, KhataTransactionSchema } from '@/lib/api/validation';
import { createAuditLogger } from '@/lib/api/audit';

/**
 * POST /api/v1/khata/transactions
 * 
 * Adds a new transaction to the customer's khata (ledger).
 */
export const POST = withAuth(async (
    req: NextRequest,
    { user, supabase }
) => {
    // 1. Parse and validate input
    const body = await req.json();
    const input = validate(KhataTransactionSchema, body);

    // 2. Check permissions
    const { hasAccess, role } = await checkShopAccess(
        supabase,
        user.id,
        input.shopId,
        ['owner', 'manager'] // Only owner/manager can manage ledger? Or staff too? Let's say owner/manager for now.
    );

    if (!hasAccess) {
        return errorResponse(
            'You do not have permission to manage khata transactions.',
            403,
            'INSUFFICIENT_PERMISSIONS'
        );
    }

    // 3. Execute transaction via stored procedure
    const { data, error } = await supabase.rpc('add_khata_transaction', {
        p_shop_id: input.shopId,
        p_customer_id: input.customerId,
        p_type: input.type,
        p_amount: input.amount,
        p_description: input.description || null,
        p_due_date: input.dueDate || null,
        p_user_id: user.id,
    });

    if (error) {
        console.error('[Add Khata Transaction Error]', error);
        return errorResponse(
            'Failed to add transaction. Please try again.',
            500,
            'ADD_KHATA_FAILED'
        );
    }

    // 4. Log audit trail
    const auditLogger = createAuditLogger(supabase, user.id, input.shopId);
    await auditLogger.logCreate('khata_transaction', data.transaction_id, {
        customerName: data.customer_name,
        amount: input.amount,
        type: input.type,
        role,
    });

    // 5. Return success response
    return successResponse({
        transactionId: data.transaction_id,
        message: 'Transaction added successfully',
    }, 201);
});
