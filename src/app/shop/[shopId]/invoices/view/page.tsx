import { ViewInvoiceClient } from './client';

export async function generateStaticParams() {
    return [];
}

export default function ViewInvoicePage() {
    return <ViewInvoiceClient />;
}
