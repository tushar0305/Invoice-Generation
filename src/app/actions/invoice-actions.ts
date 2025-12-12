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
        description: string;
        purity: string;
        grossWeight: number;
        netWeight: number;
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

        // ===== STEP 3: Call RPC to Create Invoice =====
        const { data: invoiceId, error: rpcError } = await supabase.rpc('create_invoice_with_items', {
            p_shop_id: formData.shopId,
            p_customer_id: customerId,
            p_customer_snapshot: {
                name: formData.customerName,
                phone: formData.customerPhone || '',
                address: formData.customerAddress || '',
                state: formData.customerState || '',
                pincode: formData.customerPincode || ''
            },
            p_items: formData.items,
            p_discount: formData.discount,
            p_notes: '',
            p_status: formData.status,
            p_loyalty_points_earned: pointsToEarn,
            p_loyalty_points_redeemed: pointsToRedeem
        });

        if (rpcError) throw rpcError;

        // Update Stock Quantities
        for (const item of formData.items) {
            if (item.stockId) {
                const { data: stockItem } = await supabase
                    .from('stock_items')
                    .select('quantity, unit')
                    .eq('id', item.stockId)
                    .single();

                if (stockItem) {
                    let decrementAmount = 1;
                    const unit = stockItem.unit?.toLowerCase() || 'pieces';

                    // If unit is weight-based, decrement by net weight
                    if (['grams', 'g', 'kg', 'mg'].includes(unit)) {
                        decrementAmount = item.netWeight;
                    }

                    const newQuantity = (stockItem.quantity || 0) - decrementAmount;

                    await supabase
                        .from('stock_items')
                        .update({ quantity: newQuantity })
                        .eq('id', item.stockId);
                }
            }
        }

        // Revalidate caches (paths for both server-side cache and client)
        revalidatePath(`/shop/${formData.shopId}/invoices`);
        revalidatePath(`/shop/${formData.shopId}/dashboard`);
        revalidatePath(`/shop/${formData.shopId}/insights`);

        return { success: true, invoiceId: (invoiceId as any)?.id };
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
        status?: 'paid' | 'due';
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
            rate: number;
            making: number;
        }>;
    }
) {
    // Use server-side Supabase to bypass RLS
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
            updated_at: new Date().toISOString()
        };

        if (formData.invoiceDate !== undefined) updateData.invoice_date = formData.invoiceDate.toISOString().split('T')[0];
        if (formData.discount !== undefined) updateData.discount = formData.discount;
        if (formData.status !== undefined) updateData.status = formData.status;
        if (formData.grandTotal !== undefined) updateData.grand_total = formData.grandTotal;
        if (formData.subtotal !== undefined) updateData.subtotal = formData.subtotal;
        if (formData.sgstAmount !== undefined) updateData.sgst_amount = formData.sgstAmount;
        if (formData.cgstAmount !== undefined) updateData.cgst_amount = formData.cgstAmount;

        // Update invoice using server-side supabase
        const { error: updateError } = await supabase
            .from('invoices')
            .update(updateData)
            .eq('id', invoiceId);

        if (updateError) throw updateError;

        // Handle items if provided - use server-side supabase
        if (formData.items) {
            // Get existing items
            const { data: existingItems, error: fetchError } = await supabase
                .from('invoice_items')
                .select('id')
                .eq('invoice_id', invoiceId);

            if (fetchError) throw fetchError;

            const existingIds = new Set((existingItems || []).map((item) => item.id));
            const newIds = new Set(formData.items.map((item) => item.id).filter(Boolean));

            // Prepare operations
            const toDelete = [...existingIds].filter((id) => !newIds.has(id));

            const itemsToUpsert = formData.items.map((item) => {
                const itemData: any = {
                    invoice_id: invoiceId,
                    description: item.description,
                    purity: item.purity,
                    gross_weight: item.grossWeight,
                    net_weight: item.netWeight,
                    rate: item.rate,
                    making: item.making,
                };
                if (item.id) itemData.id = item.id;
                return itemData;
            });

            // Execute operations in parallel
            const promises = [];

            if (toDelete.length > 0) {
                promises.push(
                    supabase.from('invoice_items').delete().in('id', toDelete)
                );
            }

            if (itemsToUpsert.length > 0) {
                promises.push(
                    supabase.from('invoice_items').upsert(itemsToUpsert, { onConflict: 'id' })
                );
            }

            if (promises.length > 0) {
                const results = await Promise.all(promises);
                const errors = results.map(r => r.error).filter(Boolean);
                if (errors.length > 0) throw errors[0];
            }
        }

        // Revalidate relevant paths
        // Use Promise.allSettled to ensure revalidation doesn't block response if it fails (though it shouldn't)
        // But revalidatePath is sync-ish in Next.js logic, so we just call them.
        revalidatePath(`/shop/${shopId}/invoices`);
        revalidatePath(`/shop/${shopId}/dashboard`);
        revalidatePath(`/shop/${shopId}/insights`);
        revalidatePath(`/shop/${shopId}/invoices/${invoiceId}`);

        return { success: true };
    } catch (error: any) {
        console.error('updateInvoiceAction error:', error);
        return { success: false, error: error.message || 'Failed to update invoice' };
    }
}

export async function deleteInvoiceAction(invoiceId: string, shopId: string) {
    const supabase = await createClient();
    try {
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

export async function updateInvoiceStatusAction(invoiceId: string, shopId: string, newStatus: 'paid' | 'due') {
    const supabase = await createClient();
    try {
        // 1. Fetch Invoice to get details + loyalty points earned (assuming column exists or we calc)
        // We need customer_id and current status (though we have newStatus)
        const { data: invoice, error: fetchError } = await supabase
            .from('invoices')
            .select('id, customer_id, status, grand_total, loyalty_points_earned')
            .eq('id', invoiceId)
            .single();

        if (fetchError || !invoice) throw new Error('Invoice not found');

        const pointsEarned = invoice.loyalty_points_earned || 0;
        const customerId = invoice.customer_id;

        // 2. Loyalty Logic
        // Only adjust if there are points and a customer
        if (customerId && pointsEarned > 0) {
            if (newStatus === 'due' && invoice.status === 'paid') {
                // Changing Paid -> Due: Deduct points
                // We use RPC or raw SQL to decrement safely
                const { error: deductError } = await supabase.rpc('decrement_loyalty_points', {
                    p_customer_id: customerId,
                    p_points: pointsEarned
                });

                // Fallback to manual update if RPC missing (less safe but works for now)
                if (deductError) {
                    const { data: cust } = await supabase.from('customers').select('loyalty_points').eq('id', customerId).single();
                    if (cust) {
                        await supabase.from('customers')
                            .update({ loyalty_points: Math.max(0, (cust.loyalty_points || 0) - pointsEarned) })
                            .eq('id', customerId);
                    }
                }

            } else if (newStatus === 'paid' && invoice.status === 'due') {
                // Changing Due -> Paid: Add points
                const { error: addError } = await supabase.rpc('increment_loyalty_points', {
                    p_customer_id: customerId,
                    p_points: pointsEarned
                });
                if (addError) {
                    const { data: cust } = await supabase.from('customers').select('loyalty_points').eq('id', customerId).single();
                    if (cust) {
                        await supabase.from('customers')
                            .update({ loyalty_points: (cust.loyalty_points || 0) + pointsEarned })
                            .eq('id', customerId);
                    }
                }
            }
        }

        // 3. Update Status
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
