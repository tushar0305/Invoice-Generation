'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/supabase/server';
import {
    deleteInvoice as deleteInvoiceService,
} from '@/services/invoices';

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
        // ===== STEP 1: Get or Create Customer FIRST =====
        let customerId: string | null = null;

        if (formData.customerPhone) {
            const { data: existingCustomer } = await supabase
                .from('customers')
                .select('id, loyalty_points')
                .eq('shop_id', formData.shopId)
                .eq('phone', formData.customerPhone)
                .maybeSingle();

            if (existingCustomer) {
                customerId = existingCustomer.id;

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

        // ===== STEP 2: Call RPC to Create Invoice =====
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
            p_notes: '', // Add notes field to form if needed
            p_status: formData.status
        });

        if (rpcError) throw rpcError;

        // Revalidate relevant paths
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
