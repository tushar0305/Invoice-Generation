import type { Invoice, InvoiceItem, UserSettings } from './definitions';
import { format } from 'date-fns';
import { formatCurrency } from './utils';

// Dynamic import caches
let JsPdfModule: any;
let AutoTableModule: any;

async function getJsPdf() {
  if (!JsPdfModule) {
    const mod = await import('jspdf');
    JsPdfModule = mod.default || mod;
  }
  return JsPdfModule;
}

async function getAutoTable() {
  if (!AutoTableModule) {
    const mod = await import('jspdf-autotable');
    AutoTableModule = mod.default || mod;
  }
  return AutoTableModule;
}

interface GenerateInvoicePdfParams {
  invoice: Invoice;
  items: InvoiceItem[];
  settings?: Partial<UserSettings> | null;
}

export async function generateInvoicePdf({ invoice, items, settings }: GenerateInvoicePdfParams): Promise<Blob> {
  const jsPDF = await getJsPdf();
  const autoTable = await getAutoTable();
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header
  doc.setFontSize(18);
  doc.text(settings?.shopName || 'Jewellers Store', 14, 20);
  doc.setFontSize(10);
  doc.text((settings?.address || 'Address Not Set'), 14, 26);
  const gstPanLine = [settings?.gstNumber ? `GST: ${settings.gstNumber}` : null, settings?.panNumber ? `PAN: ${settings.panNumber}` : null].filter(Boolean).join('  |  ');
  if (gstPanLine) doc.text(gstPanLine, 14, 31);

  // Invoice meta
  const rightX = pageWidth - 14;
  doc.setFontSize(14);
  doc.text(`Invoice ${invoice.invoiceNumber}`, rightX, 20, { align: 'right' });
  doc.setFontSize(10);
  doc.text(`Date: ${format(new Date(invoice.invoiceDate), 'dd MMM, yyyy')}`, rightX, 26, { align: 'right' });
  doc.text(`Status: ${invoice.status.toUpperCase()}`, rightX, 31, { align: 'right' });

  // Customer
  doc.setFontSize(12);
  doc.text('Bill To:', 14, 42);
  doc.setFontSize(10);
  const customerLines = [invoice.customerName, invoice.customerAddress, invoice.customerPhone].filter(Boolean);
  customerLines.forEach((l, i) => doc.text(l, 14, 48 + i * 5));

  // Items table
  let subtotal = 0;
  const tableHeaders = ['#', 'Description', 'Gross', 'Net', 'Rate', 'Making', 'Amount'];
  const tableBody: any[] = [];

  items.forEach((item, idx) => {
    const makingTotal = item.netWeight * item.making; // per net gram
    const lineTotal = (item.netWeight * item.rate) + makingTotal;
    subtotal += lineTotal;
    tableBody.push([
      String(idx + 1),
      item.description || '',
      String(item.grossWeight),
      String(item.netWeight),
      formatCurrency(item.rate),
      formatCurrency(makingTotal),
      formatCurrency(lineTotal)
    ]);
  });

  autoTable(doc, {
    head: [tableHeaders],
    body: tableBody,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [240, 240, 240] },
    startY: 60,
  });

  let cursorY = (doc as any).lastAutoTable?.finalY || 60;
  cursorY += 8;

  const totalBeforeTax = subtotal - invoice.discount;
  const sgstRate = invoice.sgst ?? ((invoice.tax || 0) / 2);
  const cgstRate = invoice.cgst ?? ((invoice.tax || 0) / 2);
  const sgstAmount = totalBeforeTax * (sgstRate / 100);
  const cgstAmount = totalBeforeTax * (cgstRate / 100);
  const grandTotal = totalBeforeTax + sgstAmount + cgstAmount;

  doc.setFontSize(10);
  doc.text(`Subtotal: ${formatCurrency(subtotal)}`, 14, cursorY); cursorY += 5;
  doc.text(`Discount: - ${formatCurrency(invoice.discount)}` , 14, cursorY); cursorY += 5;
  doc.text(`Total Before Tax: ${formatCurrency(totalBeforeTax)}` , 14, cursorY); cursorY += 5;
  doc.text(`SGST (${sgstRate}%): + ${formatCurrency(sgstAmount)}` , 14, cursorY); cursorY += 5;
  doc.text(`CGST (${cgstRate}%): + ${formatCurrency(cgstAmount)}` , 14, cursorY); cursorY += 5;
  doc.setFontSize(12);
  doc.text(`Grand Total: ${formatCurrency(grandTotal)}`, 14, cursorY); cursorY += 8;

  // Watermark (faint, rotated if supported)
  doc.saveGraphicsState?.();
  try {
    doc.setTextColor(220);
    doc.setFontSize(60);
    (doc as any).text((settings?.shopName || 'INVOICE').toUpperCase(), pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
  } catch {
    doc.text((settings?.shopName || 'INVOICE').toUpperCase(), pageWidth / 2, pageHeight / 2, { align: 'center' });
  }
  doc.restoreGraphicsState?.();

  return new Blob([doc.output('arraybuffer')], { type: 'application/pdf' });
}
