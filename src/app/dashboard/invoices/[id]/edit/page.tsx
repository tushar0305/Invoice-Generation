'use client';

import { notFound, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { InvoiceForm } from '@/components/invoice-form';
import type { Invoice, InvoiceItem } from '@/lib/definitions';
import { useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, getFirestore } from 'firebase/firestore';

export default function EditInvoicePage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = getFirestore();

  const invoiceRef = useMemoFirebase(() => {
    if (!id) return null;
    return doc(firestore, 'invoices', id);
  }, [firestore, id]);

  const itemsRef = useMemoFirebase(() => {
    if (!id) return null;
    return collection(firestore, `invoices/${id}/invoiceItems`);
  }, [firestore, id]);
  
  const { data: invoice, isLoading: loadingInvoice } = useDoc<Invoice>(invoiceRef);
  const { data: items, isLoading: loadingItems } = useCollection<InvoiceItem>(itemsRef);

  const isLoading = loadingInvoice || loadingItems;

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
