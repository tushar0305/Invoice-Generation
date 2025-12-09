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

    // 3. Execute DB function with correct signature
    const { data, error } = await supabase.rpc('create_customer', {
        p_shop_id: input.shopId,
        p_name: input.name,
        p_phone: input.phone,
        p_email: input.email || null,
        p_address: input.address || null,
        p_gst_number: input.gstNumber || null,
        p_state: input.state || null,
        p_pincode: input.pincode || null,
        p_opening_balance: input.openingBalance ?? 0,
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
    await auditLogger.logCreate('customer', (data?.customer_id ?? data?.id), {
        name: input.name,
        phone: input.phone,
        role,
    });

    // 5. Return success response
    return successResponse({
        id: (data?.customer_id ?? data?.id),
        name: input.name,
        email: input.email || null,
        phone: input.phone,
        address: input.address || null,
        state: input.state || null,
        pincode: input.pincode || null,
        message: 'Customer created successfully',
    }, 201);
});
