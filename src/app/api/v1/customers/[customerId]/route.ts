import { NextRequest, NextResponse } from 'next/server';
import { withAuth, checkShopAccess, successResponse, errorResponse } from '@/lib/api/utils';
import { validate, UpdateCustomerSchema } from '@/lib/api/validation';
import { createAuditLogger } from '@/lib/api/audit';

/**
 * PUT /api/v1/customers/[customerId]
 * 
 * Updates an existing customer.
 */
export const PUT = withAuth(async (
    req: NextRequest,
    { user, supabase, params }
) => {
    const { customerId } = params;

    // 1. Parse and validate input
    const body = await req.json();
    // We need shopId to check permissions, but it might not be in the update body if we are just updating name
    // However, our UpdateCustomerSchema might expect it or we need to fetch the customer first to know the shopId.
    // Let's assume the client sends shopId for permission check context, or we fetch the customer.
    // Fetching customer is safer to ensure we check the right shop permissions.

    const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('shop_id')
        .eq('id', customerId)
        .single();

    if (fetchError || !customer) {
        return errorResponse('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
    }

    const input = validate(UpdateCustomerSchema, body);

    // 2. Check permissions
    const { hasAccess, role } = await checkShopAccess(
        supabase,
        user.id,
        customer.shop_id,
        ['owner', 'manager', 'staff']
    );

    if (!hasAccess) {
        return errorResponse(
            'You do not have permission to update customers.',
            403,
            'INSUFFICIENT_PERMISSIONS'
        );
    }

    // 3. Execute transaction via stored procedure
    const { data, error } = await supabase.rpc('update_customer', {
        p_customer_id: customerId,
        p_shop_id: customer.shop_id,
        p_name: input.name,
        p_phone: input.phone || null,
        p_email: input.email || null,
        p_address: input.address || null,
        p_state: null,
        p_pincode: null,
        p_gst_number: input.gstNumber || null,
        p_user_id: user.id,
    });

    if (error) {
        console.error('[Update Customer Error]', error);
        if (error.message?.includes('already exists')) {
            return errorResponse('Another customer with this phone number already exists', 409, 'DUPLICATE_PHONE');
        }
        return errorResponse('Failed to update customer', 500, 'UPDATE_CUSTOMER_FAILED');
    }

    // 4. Log audit trail
    const auditLogger = createAuditLogger(supabase, user.id, customer.shop_id);
    await auditLogger.logUpdate('customer', customerId, {
        name: input.name,
        phone: input.phone,
        role,
    });

    // 5. Return success response
    return successResponse({
        customerId: customerId,
        message: 'Customer updated successfully',
    }, 200);
});
