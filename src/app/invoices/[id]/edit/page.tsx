import { InvoiceForm } from '@/components/invoice-form';
import { getInvoiceById } from '@/lib/data';
import { notFound } from 'next/navigation';

export const metadata = {
    title: 'Edit Invoice | Saambh Invoice Pro',
};

export default async function EditInvoicePage({ params }: { params: { id: string } }) {
  const id = params.id;
  const invoice = await getInvoiceById(id);

  if (!invoice) {
    notFound();
  }

  return <InvoiceForm invoice={invoice} />;
}
