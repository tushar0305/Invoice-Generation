'use client';

import { notFound, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { InvoiceForm } from '@/components/invoice-form';
import type { Invoice } from '@/lib/definitions';
import { useDoc, useMemoFirebase } from '@/firebase';
import { doc, getFirestore } from 'firebase/firestore';

export default function EditInvoicePage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = getFirestore();

  const invoiceRef = useMemoFirebase(() => {
    if (!id) return null;
    return doc(firestore, 'invoices', id);
  }, [firestore, id]);
  
  const { data: invoice, isLoading: loading } = useDoc<Invoice>(invoiceRef);

  if (loading) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  if (!invoice) {
    notFound();
  }

  return <InvoiceForm invoice={invoice} />;
}
