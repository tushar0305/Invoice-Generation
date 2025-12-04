/**
 * Invoices Page - Server Component
 * Fetches invoice data server-side for optimal performance
 */

import { Suspense } from 'react';
import { createClient } from '@/supabase/server';
import { InvoicesClient } from './client';
import { Loader2 } from 'lucide-react';
import type { Invoice } from '@/lib/definitions';

import { MobileInvoiceList } from '@/components/mobile/mobile-invoice-list';

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
        query = query.or(`customer_name.ilike.%${q}%,invoice_number.ilike.%${q}%`);
    }

    const { data } = await query;

    // Transform data to match Invoice type
    const invoices: Invoice[] = (data || []).map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        shopId: r.shop_id,
        createdBy: r.created_by,
        invoiceNumber: r.invoice_number,
        customerName: r.customer_name,
        customerAddress: r.customer_address || '',
        customerState: r.customer_state || '',
        customerPincode: r.customer_pincode || '',
        customerPhone: r.customer_phone || '',
        invoiceDate: r.invoice_date,
        discount: Number(r.discount) || 0,
        sgst: Number(r.sgst) || 0,
        cgst: Number(r.cgst) || 0,
        status: r.status,
        grandTotal: Number(r.grand_total) || 0,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    }));

    return (
        <Suspense fallback={<InvoicesLoading />}>
            <MobileInvoiceList shopId={shopId} invoices={invoices} />
            <div className="hidden md:block">
                <InvoicesClient
                    initialInvoices={invoices}
                    shopId={shopId}
                    initialStatus={status || 'all'}
                    initialSearch={q || ''}
                />
            </div>
        </Suspense>
    );
}
