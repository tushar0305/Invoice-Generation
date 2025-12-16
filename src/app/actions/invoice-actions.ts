'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/supabase/server';
import { Customer } from '@/lib/definitions';

/**
 * Server Actions for invoice mutations
 * These run on the server and provide automatic serialization and revalidation
 */

import { checkSubscriptionLimit } from '@/lib/subscription-utils';

export async function createInvoiceAction(formData: {
    shopId: string;
    userId: string;
    customerName: string;
    customerAddress?: string;
    customerState?: string;
    customerPincode?: string;
    customerPhone?: string;
    invoiceDate: Date;
    discount: number;
    sgst: number;
    cgst: number;
    status: 'paid' | 'due';
    grandTotal: number;
    subtotal: number;
    sgstAmount: number;
    cgstAmount: number;
    loyaltyPointsEarned?: number;
    loyaltyPointsRedeemed?: number;
    loyaltyDiscountAmount?: number;
    items: Array<{
        id: string;
        stockId?: string;
        tagId?: string;
        description: string;
        purity: string;
        hsnCode?: string;
        metalType?: string;
        grossWeight: number;
        netWeight: number;
        stoneWeight?: number;
        stoneAmount?: number;
        wastagePercent?: number;
        makingRate?: number;
        rate: number;
        making: number;
    }>;
}) {
    // 0. Check Limits
    const limitCheck = await checkSubscriptionLimit(formData.shopId, 'invoices');
    if (!limitCheck.allowed) {
        return { success: false, error: limitCheck.message };
    }

    const supabase = await createClient();

    try {
        // ===== STEP 1: Get or Create Customer FIRST =====
        let customerId: string | null = null;
        let customerCurrentPoints = 0;

        if (formData.customerPhone) {
            // Atomic Upsert using authenticated client
            const { data: upsertResult, error: upsertError } = await supabase
                .from('customers')
                .upsert(
                    {
                        shop_id: formData.shopId,
                        phone: formData.customerPhone,
                        name: formData.customerName,
                        address: formData.customerAddress,
                        state: formData.customerState,
                        pincode: formData.customerPincode,
                        updated_at: new Date().toISOString(),
                    },
                    {
                        onConflict: 'shop_id, phone',
                        ignoreDuplicates: false,
                    }
                )
                .select('id')
                .single();

            if (upsertError) {
                console.error('Error upserting customer:', upsertError);
                // Fallback: try to find existing
                const { data: existing } = await supabase
                    .from('customers')
                    .select('id')
                    .eq('shop_id', formData.shopId)
                    .eq('phone', formData.customerPhone)
                    .maybeSingle();

                if (existing) {
                    customerId = existing.id;
                    // Update details
                    await supabase.from('customers').update({
                        name: formData.customerName,
                        address: formData.customerAddress,
                        state: formData.customerState,
                        pincode: formData.customerPincode,
                    }).eq('id', customerId);
                } else {
                    // Try insert if upsert failed (e.g. constraint issue)
                    const { data: newC, error: insertError } = await supabase.from('customers').insert({
                        shop_id: formData.shopId,
                        phone: formData.customerPhone,
                        name: formData.customerName,
                        address: formData.customerAddress,
                        state: formData.customerState,
                        pincode: formData.customerPincode,
                    }).select('id').single();
                    if (insertError) throw insertError;
                    customerId = newC?.id || null;
                }
            } else {
                customerId = upsertResult?.id || null;
            }

            if (customerId) {
                // Fetch current points for validation if redeeming
                const { data: custData } = await supabase
                    .from('customers')
                    .select('loyalty_points')
                    .eq('id', customerId)
                    .single();
                if (custData) customerCurrentPoints = custData.loyalty_points || 0;
            } else {
                console.warn('Customer upsert returned null, invoice will be created without linking to customer ID');
            }
        }

        // ===== STEP 2: Logic for Loyalty Points (Server-Side Security) =====
        let pointsToEarn = 0;
        let pointsToRedeem = formData.loyaltyPointsRedeemed || 0;

        // Fetch Settings
        const { data: loyaltySettings } = await supabase
            .from('shop_loyalty_settings')
            .select('*')
            .eq('shop_id', formData.shopId)
            .single();

        if (loyaltySettings && loyaltySettings.is_enabled && customerId) {
            // 1. Validate Redemption
            if (pointsToRedeem > 0) {
                if (pointsToRedeem > customerCurrentPoints) {
                    throw new Error(`Insufficient loyalty points. Available: ${customerCurrentPoints}, Requested: ${pointsToRedeem}`);
                }
                // Additional checks (min points, max percentage) could go here
            }

            // 2. Calculate Earned Points
            // Logic mirrors client side for consistency
            if (loyaltySettings.earning_type === 'flat' && loyaltySettings.flat_points_ratio) {
                pointsToEarn = Math.floor(formData.grandTotal * loyaltySettings.flat_points_ratio);
            } else if (loyaltySettings.earning_type === 'percentage' && loyaltySettings.percentage_back) {
                pointsToEarn = Math.floor(formData.grandTotal * (loyaltySettings.percentage_back / 100));
            }
        } else {
            // Loyalty disabled or no customer -> Reset to 0 to be safe
            pointsToEarn = 0;
            pointsToRedeem = 0;
        }

        // ===== STEP 3: Call RPC to Create Invoice (V2 with Stones/Making Rate) =====
        const { data: invoiceId, error: rpcError } = await supabase.rpc('create_invoice_v2', {
            p_shop_id: formData.shopId,
            p_customer_id: customerId,
            p_customer_snapshot: {
                name: formData.customerName,
                phone: formData.customerPhone || '',
                address: formData.customerAddress || '',
                state: formData.customerState || '',
                pincode: formData.customerPincode || ''
            },
            p_items: formData.items.map(item => ({
                ...item,
                // FIX: Convert empty string to undefined to avoid "invalid input syntax for type uuid" error
                stockId: (item.stockId && item.stockId.trim() !== '') ? item.stockId : undefined,
                tagId: (item.tagId && item.tagId.trim() !== '') ? item.tagId : undefined
            })),
            p_discount: formData.discount,
            p_notes: '',
            p_status: formData.status,
            p_loyalty_points_earned: pointsToEarn,
            p_loyalty_points_redeemed: pointsToRedeem
        });

        if (rpcError) throw rpcError;

        // Normalize RPC result to a plain invoice UUID
        // Function returns table(invoice_id uuid), so data is array of { invoice_id: uuid }
        const normalizedInvoiceId: string = Array.isArray(invoiceId)
            ? (invoiceId[0]?.invoice_id ?? invoiceId[0]?.id ?? (invoiceId[0] as any))
            : ((invoiceId as any)?.invoice_id ?? (invoiceId as any)?.id ?? (invoiceId as any));

        // 4. Inventory Updates handled by RPC Transaction (v2)
        // No manual update loop needed here anymore.

        // Revalidate caches (paths for both server-side cache and client)
        revalidatePath(`/shop/${formData.shopId}/invoices`);
        revalidatePath(`/shop/${formData.shopId}/dashboard`);
        revalidatePath(`/shop/${formData.shopId}/insights`);

        return { success: true, invoiceId: normalizedInvoiceId };
    } catch (error: any) {
        console.error('createInvoiceAction error:', error);
        return { success: false, error: error.message || 'Failed to create invoice' };
    }

}

export async function updateInvoiceAction(
    invoiceId: string,
    shopId: string,
    formData: {
        customerName?: string;
        customerAddress?: string;
        customerState?: string;
        customerPincode?: string;
        customerPhone?: string;
        invoiceDate?: Date;
        discount?: number;
        sgst?: number;
        cgst?: number;
        status?: 'paid' | 'due' | 'cancelled';
        grandTotal?: number;
        subtotal?: number;
        sgstAmount?: number;
        cgstAmount?: number;
        items?: Array<{
            id?: string;
            description: string;
            purity: string;
            grossWeight: number;
            netWeight: number;
            stoneWeight?: number;
            stoneAmount?: number;
            wastagePercent?: number;
            rate: number;
            making: number;
            total: number;
            stockId?: string;
        }>;
    }
) {
    const supabase = await createClient();

    try {
        // Fetch existing snapshot to merge updates
        const { data: existingInvoice, error: fetchError } = await supabase
            .from('invoices')
            .select('customer_snapshot')
            .eq('id', invoiceId)
            .single();

        if (fetchError) throw fetchError;

        const currentSnapshot = existingInvoice.customer_snapshot as any || {};
        const newSnapshot = {
            ...currentSnapshot,
            ...(formData.customerName !== undefined && { name: formData.customerName }),
            ...(formData.customerAddress !== undefined && { address: formData.customerAddress }),
            ...(formData.customerState !== undefined && { state: formData.customerState }),
            ...(formData.customerPincode !== undefined && { pincode: formData.customerPincode }),
            ...(formData.customerPhone !== undefined && { phone: formData.customerPhone }),
        };

        const updateData: any = {
            customer_snapshot: newSnapshot,
        };

        if (formData.invoiceDate !== undefined) updateData.invoice_date = formData.invoiceDate.toISOString().split('T')[0];
        if (formData.discount !== undefined) updateData.discount = formData.discount;
        if (formData.status !== undefined) updateData.status = formData.status;
        if (formData.grandTotal !== undefined) updateData.grand_total = formData.grandTotal;
        if (formData.subtotal !== undefined) updateData.subtotal = formData.subtotal;
        if (formData.sgstAmount !== undefined) updateData.sgst_amount = formData.sgstAmount;
        if (formData.cgstAmount !== undefined) updateData.cgst_amount = formData.cgstAmount;

        // Prepare Items payload for RPC
        const itemsPayload = (formData.items || []).map(item => ({
            id: item.id,
            stockId: item.stockId,
            description: item.description,
            purity: item.purity,
            grossWeight: item.grossWeight,
            netWeight: item.netWeight,
            wastage: item.wastagePercent || 0,
            rate: item.rate,
            making: item.making,
            total: item.total,
            stoneWeight: item.stoneWeight || 0,
            stoneAmount: item.stoneAmount || 0
        }));

        const { data, error: rpcError } = await supabase.rpc('update_invoice_v2', {
            p_invoice_id: invoiceId,
            p_shop_id: shopId,
            p_update_data: updateData,
            p_items: itemsPayload
        });

        if (rpcError) throw rpcError;
        if (data && !data.success) throw new Error(data.error || 'Failed to update invoice');

        revalidatePath(`/shop/${shopId}/invoices`);
        revalidatePath(`/shop/${shopId}/dashboard`);
        // revalidatePath(`/shop/${shopId}/invoices/${invoiceId}`); // Optional specific page revalidation

        return { success: true };
    } catch (error: any) {
        console.error('updateInvoiceAction error:', error);
        return { success: false, error: error.message || 'Failed to update invoice' };
    }
}

export async function deleteInvoiceAction(invoiceId: string, shopId: string) {
    if (!invoiceId) return { success: false, error: "Invalid Invoice ID" };
    const supabase = await createClient();
    try {
        // 1. Fetch Invoice Details for Loyalty Reversion
        const { data: invoice } = await supabase
            .from('invoices')
            .select('customer_id, loyalty_points_earned, loyalty_points_redeemed, invoice_number')
            .eq('id', invoiceId)
            .single();

        // 2. Revert Loyalty Points (Atomic)
        if (invoice && invoice.customer_id) {
            // A. Remove Earned Points (If they were earned)
            // Note: If invoice was 'due', points_earned might be stored but not applied.
            // However, our new RPC only apples if PAID. But we don't know the status history perfectly here without checking status.
            // Let's assume if points_earned > 0 in DB and we delete, we should revert ONLY if status was PAID.
            // Better: The RPC stores 'loyalty_points_earned' regardless? NO, the RPC stores it. 
            // BUT we only applied it if PAID.
            // Conservative Approach: Check Status.

            const { data: statusCheck } = await supabase.from('invoices').select('status').eq('id', invoiceId).single();
            const wasPaid = statusCheck?.status === 'paid';

            if (wasPaid && (invoice.loyalty_points_earned || 0) > 0) {
                await supabase.rpc('decrement_loyalty_points', {
                    p_customer_id: invoice.customer_id,
                    p_points: invoice.loyalty_points_earned
                });
            }

            // B. Refund Redeemed Points (Always)
            if ((invoice.loyalty_points_redeemed || 0) > 0) {
                await supabase.rpc('increment_loyalty_points', {
                    p_customer_id: invoice.customer_id,
                    p_points: invoice.loyalty_points_redeemed
                });
            }
        }

        // 3. Revert Inventory Items to IN_STOCK
        const { error: inventoryError } = await supabase
            .from('inventory_items')
            .update({
                status: 'IN_STOCK',
                sold_invoice_id: null,
                sold_at: null
            })
            .eq('sold_invoice_id', invoiceId);

        if (inventoryError) {
            console.error('Error reverting inventory items:', inventoryError);
            throw new Error('Failed to revert inventory items');
        }

        // 4. Delete Invoice
        const { error } = await supabase
            .from('invoices')
            .delete()
            .eq('id', invoiceId);

        if (error) throw error;

        // Revalidate relevant paths
        revalidatePath(`/shop/${shopId}/invoices`);
        revalidatePath(`/shop/${shopId}/dashboard`);
        revalidatePath(`/shop/${shopId}/insights`);

        return { success: true };
    } catch (error: any) {
        console.error('deleteInvoiceAction error:', error);
        return { success: false, error: error.message || 'Failed to delete invoice' };
    }
}

export async function updateInvoiceStatusAction(invoiceId: string, shopId: string, newStatus: 'paid' | 'due' | 'cancelled') {
    const supabase = await createClient();
    try {
        if (newStatus === 'cancelled') {
            const { data, error } = await supabase.rpc('cancel_invoice', {
                p_invoice_id: invoiceId,
                p_shop_id: shopId
            });
            if (error) throw error;
            if (data && !data.success) throw new Error(data.error || 'Failed to cancel invoice');

            revalidatePath(`/shop/${shopId}/invoices`);
            revalidatePath(`/shop/${shopId}/dashboard`);
            return { success: true };
        }

        // Existing logic for toggle (Paid/Due)
        const { data: invoice, error: fetchError } = await supabase
            .from('invoices')
            .select('id, customer_id, status, grand_total, loyalty_points_earned')
            .eq('id', invoiceId)
            .single();

        if (fetchError || !invoice) throw new Error('Invoice not found');

        const pointsEarned = invoice.loyalty_points_earned || 0;
        const customerId = invoice.customer_id;

        if (customerId && pointsEarned > 0) {
            if (newStatus === 'due' && invoice.status === 'paid') {
                await supabase.rpc('decrement_loyalty_points', {
                    p_customer_id: customerId,
                    p_points: pointsEarned
                });
            } else if (newStatus === 'paid' && invoice.status === 'due') {
                await supabase.rpc('increment_loyalty_points', {
                    p_customer_id: customerId,
                    p_points: pointsEarned
                });
            }
        }

        const { error: updateError } = await supabase
            .from('invoices')
            .update({ status: newStatus })
            .eq('id', invoiceId);

        if (updateError) throw updateError;

        revalidatePath(`/shop/${shopId}/invoices`);
        revalidatePath(`/shop/${shopId}/dashboard`);
        revalidatePath(`/shop/${shopId}/insights`);

        return { success: true };
    } catch (error: any) {
        console.error('updateInvoiceStatusAction error:', error);
        return { success: false, error: error.message || 'Failed to update status' };
    }
}

export async function cancelInvoiceAction(invoiceId: string, shopId: string) {
    return updateInvoiceStatusAction(invoiceId, shopId, 'cancelled');
}

