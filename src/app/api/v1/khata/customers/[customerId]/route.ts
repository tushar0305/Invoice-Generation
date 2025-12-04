import { NextRequest, NextResponse } from 'next/server';
import { withAuth, checkShopAccess, successResponse, errorResponse } from '@/lib/api/utils';
import { validate } from '@/lib/api/validation';
import { z } from 'zod';
import { createAuditLogger } from '@/lib/api/audit';

// Schema for updating khata customer
const UpdateKhataCustomerSchema = z.object({
    name: z.string().min(1),
    phone: z.string().optional(),
    address: z.string().optional(),
});

/**
 * PUT /api/v1/khata/customers/[customerId]
 * 
 * Updates a khata customer.
 */
export const PUT = withAuth(async (
    req: NextRequest,
    { user, supabase, params }
) => {
    const { customerId } = params;

    // 1. Parse and validate input
    const body = await req.json();
    const input = validate(UpdateKhataCustomerSchema, body);

    // 2. Fetch customer to check shop access
    const { data: customer, error: fetchError } = await supabase
        .from('khata_customers')
        .select('shop_id')
        .eq('id', customerId)
        .single();

    if (fetchError || !customer) {
        return errorResponse('Khata customer not found', 404, 'CUSTOMER_NOT_FOUND');
    }

    // 3. Check permissions
    const { hasAccess, role } = await checkShopAccess(
        supabase,
        user.id,
        customer.shop_id,
        ['owner', 'manager']
    );

    if (!hasAccess) {
        return errorResponse(
            'You do not have permission to update khata customers.',
            403,
            'INSUFFICIENT_PERMISSIONS'
        );
    }

    // 4. Execute transaction via stored procedure
    const { data, error } = await supabase.rpc('update_khata_customer', {
        p_customer_id: customerId,
        p_shop_id: customer.shop_id,
        p_name: input.name,
        p_phone: input.phone || null,
        p_address: input.address || null,
        p_user_id: user.id,
    });

    if (error) {
        console.error('[Update Khata Customer Error]', error);
        return errorResponse('Failed to update khata customer', 500, 'UPDATE_FAILED');
    }

    // 5. Log audit trail
    const auditLogger = createAuditLogger(supabase, user.id, customer.shop_id);
    await auditLogger.logUpdate('khata_customer', customerId, {
        name: input.name,
        phone: input.phone,
        role,
    });

    // 6. Return success response
    return successResponse({
        customerId: customerId,
        message: 'Customer updated successfully',
    }, 200);
});
