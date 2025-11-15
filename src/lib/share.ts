import type { Invoice, InvoiceItem, UserSettings } from './definitions';
import { format } from 'date-fns';
import { formatCurrency } from './utils';
import { generateInvoicePdf } from './pdf';

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

/**
 * Attempt to share a generated PDF via the native share sheet (e.g., WhatsApp) without uploading.
 * Requirements:
 * - Runs in a user gesture (click/tap)
 * - Over HTTPS (or localhost)
 * - Mobile browsers that support Web Share Level 2 (files)
 * Fallback: opens WhatsApp with a prefilled text message.
 */
export async function shareInvoicePdf(
  invoice: Invoice,
  items: InvoiceItem[],
  settings?: Partial<UserSettings> | null
) {
  // Guard: only run in the browser
  if (typeof window === 'undefined') {
    throw new Error('Sharing is only available in the browser');
  }

  const message = composeWhatsAppInvoiceMessage(invoice, settings || undefined);

  try {
    // Generate the PDF as a Blob in-memory
    const pdfBlob = await generateInvoicePdf({ invoice, items, settings: settings || undefined });
    const filename = `Invoice-${invoice.invoiceNumber}.pdf`;
    const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

    // Check support for file sharing
    const navAny = navigator as any;
    const canShareFiles = !!(navAny?.canShare ? navAny.canShare({ files: [pdfFile] }) : navAny?.share);

    if (canShareFiles && navAny?.share) {
      const shareData: any = {
        title: `Invoice ${invoice.invoiceNumber}`,
        text: message,
        files: [pdfFile],
      };
      await navAny.share(shareData);
      return true;
    }

    // Fallback 1: try opening WhatsApp with text
    openWhatsAppWithText(message);
    return false;
  } catch (err) {
    // Fallback 2: on any error, just open WhatsApp with text
    openWhatsAppWithText(message);
    return false;
  }
}

