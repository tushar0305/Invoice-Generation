import { InvoiceForm } from '@/components/invoice-form';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'New Invoice | Saambh Invoice Pro',
};

export default function NewInvoicePage() {
  return (
    <InvoiceForm />
  );
}
