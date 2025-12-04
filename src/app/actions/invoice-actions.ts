'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/supabase/server';
import {
    updateInvoice as updateInvoiceService,
    deleteInvoice as deleteInvoiceService,
    upsertInvoiceItems,
    deleteInvoiceItems,
    getInvoiceItems,
} from '@/services/invoices';
import type { LoyaltySettings } from '@/lib/loyalty-types';

/**
 * Server Actions for invoice mutations
 * These run on the server and provide automatic serialization and revalidation
 */

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
        description: string;
        purity: string;
        grossWeight: number;
        netWeight: number;
        rate: number;
        making: number;
    }>;
}) {
    const supabase = await createClient();
    try {
        // Get next invoice number logic (Server Side)
        const { data: shopData, error: shopError } = await supabase
            .from('shops')
            .select('created_at')
            .eq('id', formData.shopId)
            .single();

        if (shopError) throw new Error('Shop not found: ' + shopError.message);

        const currentYear = new Date().getFullYear();

        // Get the latest invoice for this shop
        const { data: latestInvoice } = await supabase
            .from('invoices')
            .select('invoice_number')
            .eq('shop_id', formData.shopId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        let nextNumber = 1;
        if (latestInvoice?.invoice_number) {
            const match = latestInvoice.invoice_number.match(/INV-\d{4}-(\d+)/);
            if (match) {
                nextNumber = parseInt(match[1], 10) + 1;
            }
        }

        const invoiceNumber = `INV-${currentYear}-${nextNumber.toString().padStart(4, '0')}`;

        // ===== STEP 1: Get or Create Customer FIRST =====
        let customerId: string | null = null;
        let currentPoints = 0;

        if (formData.customerPhone) {
            const { data: existingCustomer } = await supabase
                .from('customers')
                .select('id, loyalty_points')
                .eq('shop_id', formData.shopId)
                .eq('phone', formData.customerPhone)
                .maybeSingle();

            if (existingCustomer) {
                customerId = existingCustomer.id;
                currentPoints = existingCustomer.loyalty_points || 0;

                // Update existing customer details
                await supabase
                    .from('customers')
                    .update({
                        name: formData.customerName,
                        address: formData.customerAddress,
                        state: formData.customerState,
                        pincode: formData.customerPincode,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', customerId);
            } else {
                // Create new customer
                const { data: newCustomer, error: createError } = await supabase
                    .from('customers')
                    .insert({
                        user_id: formData.userId,
                        shop_id: formData.shopId,
                        name: formData.customerName,
                        phone: formData.customerPhone,
                        address: formData.customerAddress,
                        state: formData.customerState,
                        pincode: formData.customerPincode,
                        loyalty_points: 0
                    })
                    .select('id')
                    .single();

                if (createError) {
                    console.error('Error creating customer:', createError);
                    throw new Error('Failed to create customer: ' + (createError.message || 'Unknown error'));
                } else if (newCustomer) {
                    customerId = newCustomer.id;
                }
            }
        }

        // ===== STEP 2: Create Invoice with customer_id AND customer_snapshot =====
        const { data: invoice, error: invoiceError } = await supabase.from('invoices').insert({
            user_id: formData.userId,
            shop_id: formData.shopId,
            invoice_number: invoiceNumber,

            // ✅ NEW: Link to customer table
            customer_id: customerId,

            // ✅ NEW: Snapshot for historical accuracy
            customer_snapshot: {
                name: formData.customerName,
                phone: formData.customerPhone || '',
                address: formData.customerAddress || '',
                state: formData.customerState || '',
                pincode: formData.customerPincode || ''
            },

            // OLD: Keep for backward compatibility (can be removed later)
            customer_name: formData.customerName,
            customer_address: formData.customerAddress,
            customer_state: formData.customerState,
            customer_pincode: formData.customerPincode,
            customer_phone: formData.customerPhone,

            invoice_date: formData.invoiceDate.toISOString().split('T')[0],
            discount: formData.discount,
            sgst: formData.sgst,
            cgst: formData.cgst,
            status: formData.status,
            grand_total: formData.grandTotal,
            subtotal: formData.subtotal,
            sgst_amount: formData.sgstAmount,
            cgst_amount: formData.cgstAmount,
            loyalty_points_earned: formData.loyaltyPointsEarned || 0,
            loyalty_points_redeemed: formData.loyaltyPointsRedeemed || 0,
            loyalty_discount_amount: formData.loyaltyDiscountAmount || 0,
        }).select().single();

        if (invoiceError) throw invoiceError;

        // ===== STEP 3: Handle Loyalty Points Validation & Update =====
        if (customerId && (formData.loyaltyPointsRedeemed || formData.loyaltyPointsEarned)) {
            // Load loyalty settings for validation
            const { data: loyaltySettings } = await supabase
                .from('shop_loyalty_settings')
                .select('*')
                .eq('shop_id', formData.shopId)
                .single();

            // VALIDATION 1: Check customer has enough points for redemption
            if (formData.loyaltyPointsRedeemed && formData.loyaltyPointsRedeemed > 0) {
                if (formData.loyaltyPointsRedeemed > currentPoints) {
                    throw new Error(
                        `Insufficient loyalty points. Customer has ${currentPoints} points but trying to redeem ${formData.loyaltyPointsRedeemed}.`
                    );
                }

                // VALIDATION 2: Check minimum points required
                if (loyaltySettings?.min_points_required && currentPoints < loyaltySettings.min_points_required) {
                    throw new Error(
                        `Customer needs at least ${loyaltySettings.min_points_required} points to redeem. Current: ${currentPoints}.`
                    );
                }

                // VALIDATION 3: Check max redemption percentage
                if (loyaltySettings?.max_redemption_percentage) {
                    const maxRedeemableValue = (formData.subtotal * loyaltySettings.max_redemption_percentage) / 100;
                    const conversionRate = loyaltySettings.redemption_conversion_rate || 1;
                    const actualRedemptionValue = formData.loyaltyPointsRedeemed * conversionRate;

                    if (actualRedemptionValue > maxRedeemableValue) {
                        throw new Error(
                            `Redemption exceeds maximum allowed (${loyaltySettings.max_redemption_percentage}% of invoice). Max: ₹${maxRedeemableValue.toFixed(2)}, Requested: ₹${actualRedemptionValue.toFixed(2)}.`
                        );
                    }
                }

                // VALIDATION 4: Verify discount matches expected value
                const expectedDiscount = formData.loyaltyPointsRedeemed * (loyaltySettings?.redemption_conversion_rate || 1);
                if (Math.abs((formData.loyaltyDiscountAmount || 0) - expectedDiscount) > 0.01) {
                    console.warn(
                        `Loyalty discount mismatch. Expected: ${expectedDiscount}, Received: ${formData.loyaltyDiscountAmount}`
                    );
                }
            }

            // Calculate points change
            let pointsChange = 0;
            if (formData.loyaltyPointsEarned) pointsChange += formData.loyaltyPointsEarned;
            if (formData.loyaltyPointsRedeemed) pointsChange -= formData.loyaltyPointsRedeemed;

            const newBalance = currentPoints + pointsChange;

            // VALIDATION 5: Ensure balance doesn't go negative
            if (newBalance < 0) {
                throw new Error(
                    `Invalid loyalty transaction would result in negative balance. Current: ${currentPoints}, Change: ${pointsChange}.`
                );
            }

            if (pointsChange !== 0) {
                // Update customer points
                await supabase
                    .from('customers')
                    .update({ loyalty_points: newBalance })
                    .eq('id', customerId);

                // Log loyalty transaction
                await supabase.from('customer_loyalty_logs').insert({
                    customer_id: customerId,
                    shop_id: formData.shopId,
                    invoice_id: invoice.id,
                    points_change: pointsChange,
                    reason: `Invoice ${invoiceNumber} - Earned: ${formData.loyaltyPointsEarned || 0}, Redeemed: ${formData.loyaltyPointsRedeemed || 0}`,
                });
            }
        }

        // Create invoice items
        const itemsToInsert = formData.items.map((item) => ({
            id: item.id,
            invoice_id: invoice.id,
            description: item.description,
            purity: item.purity,
            gross_weight: item.grossWeight,
            net_weight: item.netWeight,
            rate: item.rate,
            making: item.making,
        }));

        if (itemsToInsert.length > 0) {
            const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert);
            if (itemsError) throw itemsError;
        }

        // ===== STEP 4: Update Customer Analytics =====
        if (customerId) {
            try {
                // Fetch current customer data to increment total_spent
                const { data: currentCustomer, error: fetchError } = await supabase
                    .from('customers')
                    .select('total_spent')
                    .eq('id', customerId)
                    .single();

                if (fetchError) {
                    console.error('Error fetching customer data:', fetchError);
                    // Continue with invoice creation even if customer update fails
                } else {
                    const { error: updateError } = await supabase
                        .from('customers')
                        .update({
                            last_visit_at: new Date().toISOString(),
                            total_spent: (currentCustomer?.total_spent || 0) + formData.grandTotal,
                        })
                        .eq('id', customerId);

                    if (updateError) {
                        console.error('Error updating customer analytics:', updateError);
                        // Continue with invoice creation even if customer update fails
                    }
                }
            } catch (err) {
                console.error('Unexpected error updating customer:', err);
                // Continue with invoice creation even if customer update fails
            }
        }

        // Revalidate relevant paths
        revalidatePath(`/shop/${formData.shopId}/invoices`);
        revalidatePath(`/shop/${formData.shopId}/dashboard`);
        revalidatePath(`/shop/${formData.shopId}/insights`);

        return { success: true, invoiceId: invoice.id };
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
        const updateData: any = {};
        if (formData.customerName !== undefined) updateData.customer_name = formData.customerName;
        if (formData.customerAddress !== undefined) updateData.customer_address = formData.customerAddress;
        if (formData.customerState !== undefined) updateData.customer_state = formData.customerState;
        if (formData.customerPincode !== undefined) updateData.customer_pincode = formData.customerPincode;
        if (formData.customerPhone !== undefined) updateData.customer_phone = formData.customerPhone;
        if (formData.invoiceDate !== undefined) updateData.invoice_date = formData.invoiceDate.toISOString().split('T')[0];
        if (formData.discount !== undefined) updateData.discount = formData.discount;
        if (formData.sgst !== undefined) updateData.sgst = formData.sgst;
        if (formData.cgst !== undefined) updateData.cgst = formData.cgst;
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

            // Delete removed items
            const toDelete = [...existingIds].filter((id) => !newIds.has(id));
            if (toDelete.length > 0) {
                const { error: deleteError } = await supabase
                    .from('invoice_items')
                    .delete()
                    .in('id', toDelete);
                if (deleteError) throw deleteError;
            }

            // Upsert all items
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

            if (itemsToUpsert.length > 0) {
                const { error: upsertError } = await supabase
                    .from('invoice_items')
                    .upsert(itemsToUpsert, { onConflict: 'id' });
                if (upsertError) throw upsertError;
            }
        }

        // Revalidate relevant paths
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
    try {
        await deleteInvoiceService(invoiceId);

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
