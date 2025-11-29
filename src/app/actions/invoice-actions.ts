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

        // Create invoice
        const { data: invoice, error: invoiceError } = await supabase.from('invoices').insert({
            user_id: formData.userId,
            shop_id: formData.shopId,
            invoice_number: invoiceNumber,
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
        }).select().single();

        if (invoiceError) throw invoiceError;

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
            id: string;
            description: string;
            purity: string;
            grossWeight: number;
            netWeight: number;
            rate: number;
            making: number;
        }>;
    }
) {
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

        await updateInvoiceService(invoiceId, updateData);

        // Handle items if provided
        if (formData.items) {
            const existingItems = await getInvoiceItems(invoiceId);
            const existingIds = new Set(existingItems.map((item) => item.id));
            const newIds = new Set(formData.items.map((item) => item.id));

            // Delete removed items
            const toDelete = [...existingIds].filter((id) => !newIds.has(id));
            if (toDelete.length > 0) {
                await deleteInvoiceItems(toDelete);
            }

            // Upsert all items
            const itemsToUpsert = formData.items.map((item) => ({
                id: item.id,
                invoice_id: invoiceId,
                description: item.description,
                purity: item.purity,
                gross_weight: item.grossWeight,
                net_weight: item.netWeight,
                rate: item.rate,
                making: item.making,
            }));

            await upsertInvoiceItems(itemsToUpsert);
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
