import { createClient } from '@/supabase/server';
import { InsightsClient } from './client';
import type { Invoice } from '@/lib/definitions';

export default async function InsightsPage({ params }: { params: Promise<{ shopId: string }> }) {
    const { shopId } = await params;
    const supabase = await createClient();

    // Fetch invoices
    const { data: invData, error: invError } = await supabase
        .from('invoices')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

    if (invError) {
        console.error('Error fetching invoices:', invError);
        return <div className="p-8 text-center text-destructive">Error loading insights data. Please try refreshing.</div>;
    }

    // Map invoices
    const mappedInvoices = (invData || []).map((r: any) => ({
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

    // Fetch invoice items
    // Limit to recent 500 items to avoid payload issues
    const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*, invoices!inner(shop_id)')
        .eq('invoices.shop_id', shopId)
        .limit(500);

    if (itemsError) {
        console.error('Error fetching items:', itemsError);
        return <div className="p-8 text-center text-destructive">Error loading insights data. Please try refreshing.</div>;
    }

    return <InsightsClient invoices={mappedInvoices} invoiceItems={itemsData || []} />;
}
