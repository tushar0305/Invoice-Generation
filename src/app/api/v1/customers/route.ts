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

    // [NEW] Rate Limiting
    const { checkRateLimit, rateLimitResponse } = await import('@/lib/rate-limit');
    const { allowed: rateLimited } = await checkRateLimit(req);
    if (!rateLimited) return rateLimitResponse();

    // [NEW] Check Subscription Limits
    const { checkUsageLimit } = await import('@/lib/subscription-gate');
    const { allowed, limit, used } = await checkUsageLimit(input.shopId, 'customers', 1);

    if (!allowed) {
        return errorResponse(
            `Plan limit reached. You have added ${used}/${limit} customers. Please upgrade your plan.`,
            403,
            'PLAN_LIMIT_EXCEEDED'
        );
    }

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
    
    // Ensure we have an ID before logging
    const customerId = data?.customer_id ?? data?.id;
    if (customerId) {
        // [NEW] Handle Referral Logic
        try {
            const newReferralCode = (input.name.substring(0, 4).toUpperCase() + Math.floor(1000 + Math.random() * 9000)).replace(/[^A-Z0-9]/g, '');
            let referrerId = null;

            if (input.referralCode) {
                const { data: referrer } = await supabase
                    .from('customers')
                    .select('id')
                    .eq('shop_id', input.shopId)
                    .eq('referral_code', input.referralCode)
                    .single();
                
                if (referrer) {
                    referrerId = referrer.id;
                }
            }

            await supabase
                .from('customers')
                .update({ 
                    referral_code: newReferralCode,
                    referred_by: referrerId
                })
                .eq('id', customerId);

        } catch (refError) {
            console.error('Error processing referral:', refError);
            // Don't fail the request if referral fails
        }

        await auditLogger.logCreate('customer', customerId, {
            name: input.name,
            phone: input.phone,
            role,
        });
    } else {
        console.warn('[Create Customer] Audit log skipped: No customer ID returned', data);
    }

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
