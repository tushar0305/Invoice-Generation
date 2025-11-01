'use client';

import { useState, useEffect } from 'react';
import { InvoiceForm } from '@/components/invoice-form';
import { getInvoiceById } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import type { Invoice } from '@/lib/definitions';
import { Loader2 } from 'lucide-react';

export default function EditInvoicePage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const id = params.id;

  useEffect(() => {
    async function fetchInvoice() {
      const fetchedInvoice = await getInvoiceById(id);
      if (fetchedInvoice) {
        setInvoice(fetchedInvoice);
      }
      setLoading(false);
    }

    fetchInvoice();
  }, [id]);

  if (loading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  if (!invoice) {
    notFound();
  }

  return <InvoiceForm invoice={invoice} />;
}
