import { supabase } from '@/supabase/client';
import type { Invoice } from '@/lib/definitions';
import { format } from 'date-fns';

/**
 * Service layer for invoice-related database operations
 */

export async function getInvoicesByShop(shopId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((r: any) => ({
        id: r.id,
        shopId: r.shop_id,
        invoiceNumber: r.invoice_number,
        customerId: r.customer_id,
        customerSnapshot: r.customer_snapshot,
        invoiceDate: r.invoice_date,
        status: r.status,
        subtotal: Number(r.subtotal) || 0,
        discount: Number(r.discount) || 0,
        cgstAmount: Number(r.cgst_amount) || 0,
        sgstAmount: Number(r.sgst_amount) || 0,
        grandTotal: Number(r.grand_total) || 0,
        notes: r.notes,
        createdByName: r.created_by_name,
        createdBy: r.created_by,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    } as Invoice));
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
    const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
    }

    return {
        id: data.id,
        shopId: data.shop_id,
        invoiceNumber: data.invoice_number,
        customerId: data.customer_id,
        customerSnapshot: data.customer_snapshot,
        invoiceDate: data.invoice_date,
        status: data.status,
        subtotal: Number(data.subtotal) || 0,
        discount: Number(data.discount) || 0,
        cgstAmount: Number(data.cgst_amount) || 0,
        sgstAmount: Number(data.sgst_amount) || 0,
        grandTotal: Number(data.grand_total) || 0,
        notes: data.notes,
        createdByName: data.created_by_name,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
    } as Invoice;
}

export async function getNextInvoiceNumber(shopId: string): Promise<string> {
    // First check if shop exists and get its creation date
    const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('created_at')
        .eq('id', shopId)
        .single();

    if (shopError) throw new Error('Shop not found');

    const shopCreatedAt = new Date(shopData.created_at);
    const currentYear = new Date().getFullYear();
    const shopYear = shopCreatedAt.getFullYear();

    // Get the latest invoice for this shop
    const { data: latestInvoice, error } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw error;

    let nextNumber = 1;

    if (latestInvoice?.invoice_number) {
        // Extract number from format: INV-2024-0001
        const match = latestInvoice.invoice_number.match(/INV-\d{4}-(\d+)/);
        if (match) {
            const lastNumber = parseInt(match[1], 10);
            nextNumber = lastNumber + 1;
        }
    }

    // Format: INV-YYYY-0001
    const invoiceNumber = `INV-${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
    return invoiceNumber;
}

export async function createInvoice(invoiceData: {
    user_id: string;
    shop_id: string;
    invoice_number: string;
    customer_name: string;
    customer_address?: string;
    customer_state?: string;
    customer_pincode?: string;
    customer_phone?: string;
    invoice_date: string;
    discount: number;
    sgst: number;
    cgst: number;
    status: 'paid' | 'due';
    grand_total: number;
    subtotal: number;
    sgst_amount: number;
    cgst_amount: number;
}) {
    const { data, error } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select('id')
        .single();

    if (error) throw error;
    return data;
}

export async function updateInvoice(
    invoiceId: string,
    invoiceData: {
        customer_name?: string;
        customer_address?: string;
        customer_state?: string;
        customer_pincode?: string;
        customer_phone?: string;
        invoice_date?: string;
        discount?: number;
        sgst?: number;
        cgst?: number;
        status?: 'paid' | 'due';
        grand_total?: number;
        subtotal?: number;
        sgst_amount?: number;
        cgst_amount?: number;
    }
) {
    const { error } = await supabase
        .from('invoices')
        .update(invoiceData)
        .eq('id', invoiceId);

    if (error) throw error;
}

export async function deleteInvoice(invoiceId: string) {
    const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

    if (error) throw error;
}

// Invoice Items operations
export async function getInvoiceItems(invoiceId: string) {
    const { data, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function upsertInvoiceItems(items: any[]) {
    if (items.length === 0) return;

    const { error } = await supabase
        .from('invoice_items')
        .upsert(items, { onConflict: 'id' });

    if (error) throw error;
}

export async function deleteInvoiceItems(itemIds: string[]) {
    if (itemIds.length === 0) return;

    const { error } = await supabase
        .from('invoice_items')
        .delete()
        .in('id', itemIds);

    if (error) throw error;
}
