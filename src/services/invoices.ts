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
        userId: r.user_id,
        shopId: r.shop_id,
        createdBy: r.user_id,
        invoiceNumber: r.invoice_number,
        customerName: r.customer_name,
        customerAddress: r.customer_address || '',
        customerPhone: r.customer_phone || '',
        invoiceDate: r.invoice_date,
        status: r.status,
        grandTotal: Number(r.grand_total) || 0,
        createdAt: r.created_at,
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
        userId: data.user_id,
        shopId: data.shop_id,
        createdBy: data.user_id,
        invoiceNumber: data.invoice_number,
        customerName: data.customer_name,
        customerAddress: data.customer_address || '',
        customerPhone: data.customer_phone || '',
        invoiceDate: data.invoice_date,
        status: data.status,
        grandTotal: Number(data.grand_total) || 0,
        createdAt: data.created_at,
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
