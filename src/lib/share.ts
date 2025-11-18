import type { Invoice, InvoiceItem, UserSettings } from './definitions';
import { format } from 'date-fns';
import { formatCurrency } from './utils';
import { generateInvoicePdfTailwind } from './pdf';
import { supabase } from '@/supabase/client';

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
    const pdfBlob = await generateInvoicePdfTailwind({ invoice, items, settings: settings || undefined });
    
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
    console.error('Failed to share PDF natively:', err); // Log the error
    // Fallback 2: on any error, just open WhatsApp with text
    openWhatsAppWithText(message);
    return false;
  }
}

let isSharing = false; // Add a global or module-level flag

// Share by invoiceId only (loads the print route and captures it). Optionally include invoice/settings for message text.
export async function shareInvoicePdfById(
  invoiceId: string,
  invoiceForMessage?: Invoice,
  settings?: Partial<UserSettings> | null
) {
  if (isSharing) {
    console.warn('Share operation already in progress');
    return false; // Prevent concurrent share requests
  }

  isSharing = true; // Set the flag to true when starting a share operation

  const message = invoiceForMessage
    ? composeWhatsAppInvoiceMessage(invoiceForMessage, settings || undefined)
    : `Invoice ${invoiceId}`;
  try {
    // Fetch invoice, items and settings; then render Tailwind template PDF
    const { data: inv, error: invErr } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();
    if (invErr || !inv) throw new Error('Invoice not found');

    const { data: its, error: itErr } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('id');
    if (itErr) throw itErr;

    const invoice: Invoice = {
      id: inv.id,
      userId: inv.user_id,
      invoiceNumber: inv.invoice_number,
      customerName: inv.customer_name,
      customerAddress: inv.customer_address || '',
      customerState: inv.customer_state || '',
      customerPincode: inv.customer_pincode || '',
      customerPhone: inv.customer_phone || '',
      invoiceDate: inv.invoice_date,
      discount: Number(inv.discount) || 0,
      sgst: Number(inv.sgst) || 0,
      cgst: Number(inv.cgst) || 0,
      status: inv.status,
      grandTotal: Number(inv.grand_total) || 0,
      createdAt: inv.created_at,
      updatedAt: inv.updated_at,
    };
    const items: InvoiceItem[] = (its ?? []).map((r: any) => ({
      id: r.id,
      description: r.description,
      purity: r.purity,
      grossWeight: Number(r.gross_weight) || 0,
      netWeight: Number(r.net_weight) || 0,
      rate: Number(r.rate) || 0,
      making: Number(r.making) || 0,
    }));

    let resolvedSettings: Partial<UserSettings> | null = settings || null;
    if (!resolvedSettings) {
      const { data: userSettings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', inv.user_id)
        .single();
      if (userSettings) {
        resolvedSettings = {
          id: userSettings.user_id,
          userId: userSettings.user_id,
          cgstRate: Number(userSettings.cgst_rate) || 0,
          sgstRate: Number(userSettings.sgst_rate) || 0,
          shopName: userSettings.shop_name || 'Jewellers Store',
          gstNumber: userSettings.gst_number || '',
          panNumber: userSettings.pan_number || '',
          address: userSettings.address || '',
          state: userSettings.state || '',
          pincode: userSettings.pincode || '',
          phoneNumber: userSettings.phone_number || '',
          email: userSettings.email || '',
        } as Partial<UserSettings>;
      }
    }

    const pdfBlob = await generateInvoicePdfTailwind({ invoice, items, settings: resolvedSettings || undefined });
    const filename = `Invoice-${invoice.invoiceNumber}.pdf`;
    const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });
    const navAny = navigator as any;
    const canShareFiles = !!(navAny?.canShare ? navAny.canShare({ files: [pdfFile] }) : navAny?.share);
    if (canShareFiles && navAny?.share) {
      await navAny.share({ title: filename, text: message, files: [pdfFile] });
      return true;
    }
    openWhatsAppWithText(message);
    return false;
  } catch (err) {
    console.error('Failed to share PDF by ID natively:', err);
    openWhatsAppWithText(message);
    return false;
  } finally {
    isSharing = false; // Reset the flag after the operation completes
  }
}

