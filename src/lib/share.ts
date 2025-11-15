import type { Invoice, UserSettings } from './definitions';
import { format } from 'date-fns';
import { formatCurrency } from './utils';

export function composeWhatsAppInvoiceMessage(
  invoice: Invoice,
  settings?: Partial<UserSettings>
) {
  const dateStr = format(new Date(invoice.invoiceDate), 'dd MMM, yyyy');
  const shop = settings?.shopName || 'Jewellers Store';
  const phone = settings?.phoneNumber;
  const header = `Invoice ${invoice.invoiceNumber}`;
  const customer = invoice.customerName ? `for ${invoice.customerName}` : '';
  const amount = formatCurrency(invoice.grandTotal);
  const lines = [
    `${header} ${customer}`.trim(),
    `Date: ${dateStr}`,
    `Amount: ${amount}`,
    `Status: ${invoice.status.toUpperCase()}`,
    '',
    `— ${shop}${phone ? ` \u2022 ${phone}` : ''}`,
  ];
  return lines.join('\n');
}

export function openWhatsAppWithText(message: string) {
  const encoded = encodeURIComponent(message);
  // Prefer wa.me when available, fall back to whatsapp:// scheme
  const webUrl = `https://wa.me/?text=${encoded}`;
  const appUrl = `whatsapp://send?text=${encoded}`;
  // Try opening the web URL in a new tab; most environments redirect to app if installed
  const win = window.open(webUrl, '_blank');
  if (!win) {
    // As a fallback (e.g., popup blocked), try app scheme
    window.location.href = appUrl;
  }
}
