// Web-only sharing implementation
// Capacitor has been removed - mobile app will be handled separately

import { generateInvoicePdf } from './pdf';
import { supabase } from '@/supabase/client';
import { formatCurrency } from './utils';
import type { Invoice, InvoiceItem } from './definitions';

// Web-only sharing implementation
// Capacitor has been removed - mobile app will be handled separately

export const shareInvoice = async (invoice: Invoice) => {
  try {
    // 1. Fetch Items & Settings
    const [itemsResult, shopResult] = await Promise.all([
      supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id)
        .order('id'),
      supabase
        .from('shops')
        .select('*')
        .eq('id', invoice.shopId)
        .single()
    ]);

    if (itemsResult.error) throw itemsResult.error;

    const items: InvoiceItem[] = (itemsResult.data || []).map((r: any) => ({
      id: r.id,
      description: r.description,
      purity: r.purity,
      grossWeight: Number(r.gross_weight) || 0,
      netWeight: Number(r.net_weight) || 0,
      stoneWeight: Number(r.stone_weight) || 0,
      stoneAmount: Number(r.stone_amount) || 0,
      wastagePercent: Number(r.wastage_percent) || 0,
      rate: Number(r.rate) || 0,
      makingRate: Number(r.making_rate) || 0,
      making: Number(r.making) || 0,
    }));

    const shopDetails = shopResult.data;
    const settings = shopDetails ? {
      id: shopDetails.id,
      cgstRate: Number(shopDetails.cgst_rate) || 0,
      sgstRate: Number(shopDetails.sgst_rate) || 0,
      shopName: shopDetails.shop_name || 'Jewellers Store',
      gstNumber: shopDetails.gst_number || '',
      panNumber: shopDetails.pan_number || '',
      address: shopDetails.address || '',
      state: shopDetails.state || '',
      pincode: shopDetails.pincode || '',
      phoneNumber: shopDetails.phone_number || '',
      email: shopDetails.email || '',
      templateId: shopDetails.template_id || 'classic',
    } : undefined;

    const title = `Invoice #${invoice.invoiceNumber}`;
    const text = `Invoice for ${invoice.customerSnapshot?.name || 'Customer'} from ${settings?.shopName || 'SwarnaVyapar'}`;
    const viewUrl = `${window.location.origin}/shop/${invoice.shopId}/invoices/view?id=${invoice.id}`;

    // 2. Generate PDF for Sharing (Primary Method)
    let file: File | null = null;
    try {
      const pdfBlob = await generateInvoicePdf({ invoice, items, settings });
      file = new File([pdfBlob], `Invoice-${invoice.invoiceNumber}.pdf`, { type: 'application/pdf' });
    } catch (e) {
      console.warn("PDF generation for share failed, falling back to link", e);
    }

    // 3. Attempt Sharing
    if (navigator.share) {
      // Method A: Share File (Best UX)
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title,
            text,
          });
          return { success: true, message: 'Invoice PDF shared successfully' };
        } catch (error: any) {
          // Ignore AbortError (User cancelled share sheet)
          if (error.name === 'AbortError') return { success: false, aborted: true };
          console.warn("File share failed, attempting text share...", error);
        }
      }

      // Method B: Share Link (Fallback)
      try {
        await navigator.share({
          title,
          text: `${text}\nView Invoice: ${viewUrl}`,
          url: viewUrl
        });
        return { success: true, message: 'Invoice link shared' };
      } catch (error: any) {
        if (error.name === 'AbortError') return { success: false, aborted: true };
        console.warn("Link share failed", error);
      }
    }

    // Method C: Clipboard (Last Resort)
    try {
      await navigator.clipboard.writeText(viewUrl);
      return { success: true, message: 'Link copied to clipboard (Share unavailable)' };
    } catch (e) {
      return { success: false, error: 'Could not share or copy link' };
    }

  } catch (error) {
    console.error('Share process failed:', error);
    return { success: false, error };
  }
};

// Download blob function remains the same
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadInvoiceAction = async (pdfBlob: Blob, filename: string) => {
  downloadBlob(pdfBlob, filename);
  return { success: true };
};

export const shareImageAction = async (canvas: HTMLCanvasElement, filename: string) => {
  return new Promise<{ success: boolean, error?: string }>((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve({ success: false, error: 'Failed to create image' });
        return;
      }

      // Use Web Share API if available
      if (navigator.share && navigator.canShare) {
        try {
          const file = new File([blob], filename, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: filename,
            });
            resolve({ success: true });
            return;
          }
        } catch (error) {
          console.error('Share failed, falling back to download:', error);
        }
      }

      // Fallback: download
      downloadBlob(blob, filename);
      resolve({ success: true });
    }, 'image/png');
  });
};
