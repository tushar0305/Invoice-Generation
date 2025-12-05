'use client';

import { notFound, useParams, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { InvoiceForm } from '@/components/invoice-form';
import type { Invoice, InvoiceItem } from '@/lib/definitions';
import { supabase } from '@/supabase/client';
import { useEffect, useState } from 'react';

export function EditInvoiceClient() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id') as string;
    const params = useParams(); // Keep for compatibility
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [items, setItems] = useState<InvoiceItem[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setIsLoading(true);
            const { data: inv, error: invErr } = await supabase.from('invoices').select('*').eq('id', id).single();
            if (invErr) { setInvoice(null); setItems(null); setIsLoading(false); return; }
            const mappedInv: Invoice = {
                id: inv.id,
                shopId: inv.shop_id,
                invoiceNumber: inv.invoice_number,
                customerId: inv.customer_id,
                customerSnapshot: inv.customer_snapshot,
                invoiceDate: inv.invoice_date,
                status: inv.status,
                subtotal: Number(inv.subtotal) || 0,
                discount: Number(inv.discount) || 0,
                cgstAmount: Number(inv.cgst_amount) || 0,
                sgstAmount: Number(inv.sgst_amount) || 0,
                grandTotal: Number(inv.grand_total) || 0,
                notes: inv.notes,
                createdByName: inv.created_by_name,
                createdBy: inv.created_by,
                createdAt: inv.created_at,
                updatedAt: inv.updated_at,
            };
            const { data: its, error: itErr } = await supabase.from('invoice_items').select('*').eq('invoice_id', id).order('id');
            if (itErr) { setInvoice(mappedInv); setItems([]); setIsLoading(false); return; }
            const mappedItems: InvoiceItem[] = (its ?? []).map((r: any) => ({
                id: r.id,
                description: r.description,
                purity: r.purity.replace(/K/g, ''),
                grossWeight: Number(r.gross_weight) || 0,
                netWeight: Number(r.net_weight) || 0,
                rate: Number(r.rate) || 0,
                making: Number(r.making) || 0,
            }));
            if (!cancelled) {
                setInvoice(mappedInv);
                setItems(mappedItems);
                setIsLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!invoice || !items) {
        notFound();
    }

    return <InvoiceForm invoice={{ ...invoice, items }} />;
}
