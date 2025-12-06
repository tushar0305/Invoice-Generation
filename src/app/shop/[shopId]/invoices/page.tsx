/**
 * Invoices Page - Server Component
 * Fetches invoice data server-side for optimal performance
 */

import { Suspense } from 'react';
import { createClient } from '@/supabase/server';
import { InvoicesClient } from './client';
import { Loader2 } from 'lucide-react';
import type { Invoice } from '@/lib/definitions';



// Loading component for Suspense boundary
function InvoicesLoading() {
    return (
        <div className="flex h-[50vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}

export default async function InvoicesPage({
    params,
    searchParams,
}: {
    params: Promise<{ shopId: string }>;
    searchParams: Promise<{ status?: string; q?: string }>;
}) {
    const { shopId } = await params;
    const { status, q } = await searchParams;
    const supabase = await createClient();

    // ✅ Server-side data fetching with filters
    let query = supabase
        .from('invoices')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

    // Apply server-side filters if provided
    if (status && status !== 'all') {
        if (status === 'overdue') {
            const today = new Date().toISOString().split('T')[0];
            query = query.eq('status', 'due').lt('invoice_date', today);
        } else {
            query = query.eq('status', status);
        }
    }

    if (q) {
        query = query.or(`customer_snapshot->>name.ilike.%${q}%,invoice_number.ilike.%${q}%`);
    }

    const { data } = await query;

    // Transform data to match Invoice type
    const invoices: Invoice[] = (data || []).map((r: any) => ({
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
    }));

    return (
        <Suspense fallback={<InvoicesLoading />}>
            <InvoicesClient
                initialInvoices={invoices}
                shopId={shopId}
                initialStatus={status || 'all'}
                initialSearch={q || ''}
            />
        </Suspense>
    );
}
