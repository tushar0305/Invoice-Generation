import { NextRequest, NextResponse } from 'next/server';
import { withAuth, checkShopAccess, successResponse, errorResponse } from '@/lib/api/utils';
import { validate, CreateCustomerSchema } from '@/lib/api/validation';
import { createAuditLogger } from '@/lib/api/audit';

/**
 * POST /api/v1/customers
 * 
 * Creates a new customer.
 */
export const POST = withAuth(async (
    req: NextRequest,
    { user, supabase }
) => {
    // 1. Parse and validate input
    const body = await req.json();
    const input = validate(CreateCustomerSchema, body);

    // 2. Check permissions
    const { hasAccess, role } = await checkShopAccess(
        supabase,
        user.id,
        input.shopId,
        ['owner', 'manager', 'staff']
    );

    if (!hasAccess) {
        return errorResponse(
            'You do not have permission to create customers.',
            403,
            'INSUFFICIENT_PERMISSIONS'
        );
    }

    // 3. Execute transaction via stored  // Execute DB function
    const { data, error } = await supabase.rpc('create_customer', {
        p_shop_id: input.shopId,
        p_user_id: user.id,
        p_name: input.name,
        p_phone: input.phone,
        p_email: input.email || null,
        p_address: input.address || null,
        p_gst_number: input.gstNumber || null,
    });

    if (error) {
        console.error('[Create Customer Error]', error);

        // Check for unique constraint violation (duplicate phone)
        if (error.code === '23505' || error.message?.includes('unique_customer_phone_per_shop')) {
            return errorResponse(
                `A customer with phone number ${input.phone} already exists in this shop.`,
                409,
                'DUPLICATE_PHONE_NUMBER'
            );
        }

        // Check for custom duplicate error from DB function
        if (error.message?.includes('already exists')) {
            return errorResponse(
                error.message,
                409,
                'DUPLICATE_CUSTOMER'
            );
        }

        return errorResponse(
            'Failed to create customer',
            500,
            'CREATE_FAILED'
        );
    }  // 4. Log audit trail
    const auditLogger = createAuditLogger(supabase, user.id, input.shopId);
    await auditLogger.logCreate('customer', data.customer_id, {
        name: input.name,
        phone: input.phone,
        role,
    });

    // 5. Return success response
    return successResponse({
        customerId: data.customer_id,
        message: 'Customer created successfully',
    }, 201);
});
