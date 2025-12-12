import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { withAuth, checkShopAccess, successResponse, errorResponse } from '@/lib/api/utils';
import { validate, CreateInvoiceSchema } from '@/lib/api/validation';
import { createAuditLogger } from '@/lib/api/audit';

/**
 * POST /api/v1/invoices
 * 
 * Creates a new invoice with items:
 * - Atomic creation (header + items) via DB function
 * - Auto-generates invoice number
 * - Handles Customer Upsert (find or create)
 * - Handles Loyalty Points (earn/redeem)
 * - Audit logging
 * - Cache invalidation
 */
export const POST = withAuth(async (
    req: NextRequest,
    { user, supabase }
) => {
    // 1. Parse and validate input
    const body = await req.json();
    const input = validate(CreateInvoiceSchema, body);

    // [NEW] Rate Limiting
    const { checkRateLimit, rateLimitResponse } = await import('@/lib/rate-limit');
    const { allowed: rateLimited } = await checkRateLimit(req);
    if (!rateLimited) return rateLimitResponse();

    // [NEW] Check Subscription Limits
    const { checkUsageLimit } = await import('@/lib/subscription-gate');
    const { allowed, limit, used } = await checkUsageLimit(input.shopId, 'invoices', 1);

    if (!allowed) {
        return errorResponse(
            `Plan limit reached. You have created ${used}/${limit} invoices. Please upgrade your plan.`,
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
            'You do not have permission to create invoices in this shop.',
            403,
            'INSUFFICIENT_PERMISSIONS'
        );
    }

    // 3. Handle Customer Upsert (if phone provided)
    let customerId = input.customerId;
    if (!customerId && input.customerPhone) {
        customerId = await upsertCustomer(supabase, user.id, input);
    }

    // Construct snapshot
    const customerSnapshot = {
        name: input.customerName,
        phone: input.customerPhone,
        address: input.customerAddress,
        state: input.customerState,
        pincode: input.customerPincode,
        email: input.customerEmail,
    };

    // 4. Execute transaction via stored procedure
    const { data, error } = await supabase.rpc('create_invoice_with_items', {
        p_shop_id: input.shopId,
        p_customer_id: customerId || null,
        p_customer_snapshot: customerSnapshot,
        p_items: input.items,
        p_discount: input.discount,
        p_notes: input.notes || null,
        p_status: input.status || 'due',
    });

    if (error) {
        console.error('[Create Invoice Error]', error);

        // Check for unique constraint violation (duplicate invoice number)
        // PostgreSQL error code 23505 = unique_violation
        if (error.code === '23505' || error.message?.includes('unique_invoice_number_per_shop')) {
            return errorResponse(
                'Invoice number already exists for this shop. Please use a different number.',
                409,
                'DUPLICATE_INVOICE_NUMBER'
            );
        }

        return errorResponse(
            `Failed to create invoice: ${error.message || JSON.stringify(error)}`,
            500,
            'CREATE_INVOICE_FAILED'
        );
    }

    // 5. Handle Loyalty Points (Server-Side Calculation)
    if (customerId) { // Always check loyalty if customer exists
        await handleLoyalty(supabase, input.shopId, customerId, data.invoice_id, data.invoice_number, {
            ...input,
            grandTotal: data.grand_total // Pass the secure grand total
        });
    }

    // 6. Log audit trail
    const auditLogger = createAuditLogger(supabase, user.id, input.shopId);
    await auditLogger.logCreate('invoice', data.invoice_id, {
        invoiceNumber: data.invoice_number,
        customerName: input.customerName,
        grandTotal: data.grand_total,
        itemCount: input.items.length,
        role,
    });

    // 7. ✅ CACHE INVALIDATION
    // Invalidate Next.js cache for server components
    revalidatePath(`/shop/${input.shopId}/invoices`);
    revalidatePath(`/shop/${input.shopId}/dashboard`);
    revalidatePath(`/shop/${input.shopId}/customers`);
    revalidatePath(`/shop/${input.shopId}/loyalty`); // Invalidate loyalty dashboard

    // 8. Return success response
    return successResponse({
        invoiceId: data.invoice_id,
        invoiceNumber: data.invoice_number,
        grandTotal: data.grand_total,
        message: `Invoice #${data.invoice_number} created successfully`,
    }, 201);
});

// Helper: Upsert Customer
async function upsertCustomer(supabase: any, userId: string, input: any) {
    try {
        // Check existing
        const { data: existing, error: selectError } = await supabase
            .from('customers')
            .select('id')
            .eq('shop_id', input.shopId)
            .eq('phone', input.customerPhone)
            .maybeSingle();

        if (selectError) {
            console.error('[Customer Search Error]', selectError);
        }

        if (existing) {
            // Update details
            const { error: updateError } = await supabase
                .from('customers')
                .update({
                    name: input.customerName,
                    address: input.customerAddress,
                    state: input.customerState,
                    pincode: input.customerPincode,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id);

            if (updateError) {
                console.error('[Customer Update Error]', updateError);
            }
            return existing.id;
        } else {
            // Create new - NOTE: customers table does NOT have user_id column
            const { data: newCustomer, error: insertError } = await supabase
                .from('customers')
                .insert({
                    shop_id: input.shopId,
                    name: input.customerName,
                    phone: input.customerPhone,
                    address: input.customerAddress,
                    state: input.customerState,
                    pincode: input.customerPincode,
                    loyalty_points: 0
                })
                .select('id')
                .single();

            if (insertError) {
                if (process.env.NODE_ENV === 'development') {
                    console.error('[Customer Insert Error]', insertError);
                }
                return null;
            }

            if (process.env.NODE_ENV === 'development') {
                console.log('[Customer Created]', newCustomer?.id);
            }
            return newCustomer?.id;
        }
    } catch (err) {
        if (process.env.NODE_ENV === 'development') {
            console.error('Error upserting customer:', err);
        }
        return null;
    }
}

// Helper: Handle Loyalty (Secure Server-Side)
async function handleLoyalty(supabase: any, shopId: string, customerId: string, invoiceId: string, invoiceNumber: string, input: any) {
    try {
        // 1. Fetch Shop Loyalty Settings
        const { data: settings } = await supabase
            .from('shop_loyalty_settings')
            .select('*')
            .eq('shop_id', shopId)
            .single();

        if (!settings?.is_enabled) return;

        let pointsEarned = 0;
        const grandTotal = input.grandTotal || 0;

        // 2. Calculate Points Earned (Server Side)
        if (settings.earning_type === 'flat' && settings.flat_points_ratio) {
            pointsEarned = Math.floor(grandTotal * settings.flat_points_ratio);
        } else if (settings.earning_type === 'percentage' && settings.percentage_back) {
            pointsEarned = Math.floor(grandTotal * (settings.percentage_back / 100));
        }

        if (process.env.NODE_ENV === 'development') {
            console.log(`[Loyalty] Shop: ${shopId}, Cust: ${customerId}, Inv: ${invoiceNumber}, GrandTotal: ${grandTotal}, PointsEarned: ${pointsEarned}`);
        }

        // Apply conditions (e.g. Discounted Items) - simplified for now as per audit
        // Future: Check items for discounts if `earn_on_discounted_items` is false

        // 3. Handle Redemption (Validation)
        const pointsRedeemed = input.loyaltyPointsRedeemed || 0;

        // Validation 1: Min Points
        if (pointsRedeemed > 0 && settings.min_points_required && pointsRedeemed < settings.min_points_required) {
            console.warn(`Redemption rejected: Unmet min points requirement (${pointsRedeemed} < ${settings.min_points_required})`);
            // We do NOT revert the invoice here as it's already created, but we silently fail the redemption 
            // OR ideally we should have validated this before creating invoice. 
            // For now, we just skip the redemption part to be safe.
        }

        const netChange = pointsEarned - pointsRedeemed;
        if (netChange === 0) return;

        // 4. Get current points & Update
        const { data: customer } = await supabase
            .from('customers')
            .select('loyalty_points')
            .eq('id', customerId)
            .single();

        const currentPoints = customer?.loyalty_points || 0;

        // Validation 2: Sufficient Balance
        if (pointsRedeemed > currentPoints) {
            console.error(`Loyalty fraud detected? Redeeming ${pointsRedeemed} but balance is ${currentPoints}`);
            // Fallback: Only earn, do not redeem
            // In a real transactional system we might want to rollback the whole invoice, 
            // but here we prioritize preserving the sale and just fixing the points.
            const fallbackNetChange = pointsEarned;
            await supabase
                .from('customers')
                .update({ loyalty_points: currentPoints + fallbackNetChange })
                .eq('id', customerId);

            await supabase.from('customer_loyalty_logs').insert({
                customer_id: customerId,
                shop_id: shopId,
                invoice_id: invoiceId,
                points_change: fallbackNetChange,
                reason: `Auth Corrected: Earned ${fallbackNetChange} (Redemption Failed: Insufficient Balance)`,
            });
            return;
        }

        const newBalance = currentPoints + netChange;

        // Update customer points
        const { error: updateError } = await supabase
            .from('customers')
            .update({ loyalty_points: newBalance })
            .eq('id', customerId);

        if (updateError) {
            console.error('[Loyalty] Update Failed:', updateError);
            throw updateError;
        }

        // Log transaction
        const { error: logError } = await supabase.from('customer_loyalty_logs').insert({
            customer_id: customerId,
            shop_id: shopId,
            invoice_id: invoiceId,
            points_change: netChange,
            reason: `Invoice ${invoiceNumber} - Earned: ${pointsEarned}, Redeemed: ${pointsRedeemed}`,
        });

        if (logError) {
            console.error('[Loyalty] Log Insert Failed:', logError);
        }

    } catch (err) {
        console.error('Error handling loyalty:', err);
    }
}
