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
        p_customer_name: input.customerName,
        p_customer_phone: input.customerPhone || null,
        p_customer_address: input.customerAddress || null,
        p_customer_snapshot: customerSnapshot,
        p_items: input.items,
        p_discount: input.discount,
        p_notes: input.notes || null,
        p_user_id: user.id,
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

    // 5. Handle Loyalty Points (Async - non-blocking for response, but good to await for consistency)
    if (customerId && (input.loyaltyPointsEarned || input.loyaltyPointsRedeemed)) {
        await handleLoyalty(supabase, input.shopId, customerId, data.invoice_id, data.invoice_number, input);
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
        const { data: existing } = await supabase
            .from('customers')
            .select('id')
            .eq('shop_id', input.shopId)
            .eq('phone', input.customerPhone)
            .maybeSingle();

        if (existing) {
            // Update details
            await supabase
                .from('customers')
                .update({
                    name: input.customerName,
                    address: input.customerAddress,
                    state: input.customerState,
                    pincode: input.customerPincode,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id);
            return existing.id;
        } else {
            // Create new
            const { data: newCustomer } = await supabase
                .from('customers')
                .insert({
                    user_id: userId,
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
            return newCustomer?.id;
        }
    } catch (err) {
        console.error('Error upserting customer:', err);
        return null;
    }
}

// Helper: Handle Loyalty
async function handleLoyalty(supabase: any, shopId: string, customerId: string, invoiceId: string, invoiceNumber: string, input: any) {
    try {
        const pointsEarned = input.loyaltyPointsEarned || 0;
        const pointsRedeemed = input.loyaltyPointsRedeemed || 0;
        const netChange = pointsEarned - pointsRedeemed;

        if (netChange === 0) return;

        // Get current points
        const { data: customer } = await supabase
            .from('customers')
            .select('loyalty_points')
            .eq('id', customerId)
            .single();

        const currentPoints = customer?.loyalty_points || 0;
        const newBalance = currentPoints + netChange;

        if (newBalance < 0) {
            console.warn(`Loyalty update skipped: Negative balance would result (${newBalance})`);
            return;
        }

        // Update customer points
        await supabase
            .from('customers')
            .update({ loyalty_points: newBalance })
            .eq('id', customerId);

        // Log transaction
        await supabase.from('customer_loyalty_logs').insert({
            customer_id: customerId,
            shop_id: shopId,
            invoice_id: invoiceId,
            points_change: netChange,
            reason: `Invoice ${invoiceNumber} - Earned: ${pointsEarned}, Redeemed: ${pointsRedeemed}`,
        });

    } catch (err) {
        console.error('Error handling loyalty:', err);
    }
}
