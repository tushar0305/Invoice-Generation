import { createClient } from '@/supabase/server';
import { InsightsClient } from './client';
import type { Invoice } from '@/lib/definitions';
import { Suspense } from 'react';

export default async function InsightsPage({ params }: { params: Promise<{ shopId: string }> }) {
    const { shopId } = await params;
    const supabase = await createClient();

    // Fetch All Data (previously only desktop)
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

    // Fetch invoice items
    const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*, invoices!inner(shop_id)')
        .eq('invoices.shop_id', shopId)
        .limit(500);

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <InsightsClient invoices={mappedInvoices} invoiceItems={itemsData || []} shopId={shopId} />
        </Suspense>
    );
}
