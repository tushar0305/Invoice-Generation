import { NextRequest, NextResponse } from 'next/server';
import { withAuth, checkShopAccess, successResponse, errorResponse } from '@/lib/api/utils';
import { createAuditLogger } from '@/lib/api/audit';

/**
 * DELETE /api/v1/khata/transactions/[transactionId]
 * 
 * Deletes a khata transaction.
 */
export const DELETE = withAuth(async (
    req: NextRequest,
    { user, supabase, params }
) => {
    const { transactionId } = params;

    // 1. Fetch transaction to check shop access
    const { data: transaction, error: fetchError } = await supabase
        .from('khata_transactions')
        .select('shop_id, customer_id')
        .eq('id', transactionId)
        .single();

    if (fetchError || !transaction) {
        return errorResponse('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
    }

    // 2. Check permissions
    const { hasAccess, role } = await checkShopAccess(
        supabase,
        user.id,
        transaction.shop_id,
        ['owner', 'manager'] // Only owner/manager can delete
    );

    if (!hasAccess) {
        return errorResponse(
            'You do not have permission to delete khata transactions.',
            403,
            'INSUFFICIENT_PERMISSIONS'
        );
    }

    // 3. Execute transaction via stored procedure
    const { data, error } = await supabase.rpc('delete_khata_transaction', {
        p_transaction_id: transactionId,
        p_shop_id: transaction.shop_id,
        p_user_id: user.id,
    });

    if (error) {
        console.error('[Delete Khata Transaction Error]', error);
        return errorResponse('Failed to delete transaction', 500, 'DELETE_FAILED');
    }

    // 4. Log audit trail
    const auditLogger = createAuditLogger(supabase, user.id, transaction.shop_id);
    await auditLogger.logDelete('khata_transaction', transactionId, {
        amount: data.amount,
        type: data.type,
        customerId: data.customer_id,
        role,
    });

    // 5. Return success response
    return successResponse({
        transactionId: transactionId,
        message: 'Transaction deleted successfully',
    }, 200);
});
