import type { Invoice, InvoiceItem, UserSettings } from './definitions';
import { format } from 'date-fns';
import { formatCurrency } from './utils';
import html2canvas from 'html2canvas';

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

  return new Blob([doc.output('arraybuffer')], { type: 'application/pdf' });
}

// Generate a PDF Blob by rendering the existing print route inside an iframe and capturing it.
// Produces a visually identical PDF to the print layout.
export async function generatePdfFromPrintPage(invoiceId: string): Promise<Blob> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('PDF generation must run in the browser');
  }

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  iframe.style.width = '1024px';
  iframe.style.height = '1448px'; // Roughly A4 px at 96dpi
  iframe.style.visibility = 'hidden';
  iframe.style.display = 'block';
  iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms');
  iframe.src = `/dashboard/invoices/${invoiceId}/print?embed=1&_=${Date.now()}`;

  const done = new Promise<HTMLDivElement>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timed out loading print view')), 20000);
    iframe.onload = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) throw new Error('No iframe document');
        console.log('Iframe document loaded:', doc);

        // Wait a tick for fonts/styles
        setTimeout(() => {
          const root = doc.getElementById('print-root') as HTMLDivElement | null;
          if (!root) {
            console.error('Printable root not found in iframe document:', doc);
            clearTimeout(timeout);
            reject(new Error('Printable root not found'));
            return;
          }
          console.log('Printable root found:', root);
          clearTimeout(timeout);
          resolve(root);
        }, 4000); // Increased timeout to 4 seconds
      } catch (e) {
        console.error('Error loading iframe content:', e);
        reject(e as any);
      }
    };
    iframe.onerror = () => reject(new Error('Failed loading print view'));
  });

  document.body.appendChild(iframe);
  try {
    const root = await done;

    // Use html2canvas to rasterize the element
    const canvas = await html2canvas(root, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      allowTaint: true,
      windowWidth: root.offsetWidth || root.scrollWidth,
      windowHeight: root.offsetHeight || root.scrollHeight,
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // Prepare jsPDF page with A4 size in mm
    const jsPDF = await getJsPdf();
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10; // mm
    const printableWidth = pageWidth - margin * 2;
    const printableHeight = pageHeight - margin * 2;

    // Image dimensions in px
    const imgPxWidth = canvas.width;
    const imgPxHeight = canvas.height;
    // Convert px to mm at 96dpi: 1in = 25.4mm, 96px = 1in => 1px = 25.4/96 mm
    const pxToMm = 25.4 / 96;
    const imgMmWidth = imgPxWidth * pxToMm;
    const imgMmHeight = imgPxHeight * pxToMm;

    // Scale to fit within printable area, preserving aspect ratio
    const scale = Math.min(printableWidth / imgMmWidth, printableHeight / imgMmHeight);
    const renderWidth = imgMmWidth * scale;
    const renderHeight = imgMmHeight * scale;
    const x = (pageWidth - renderWidth) / 2;
    const y = (pageHeight - renderHeight) / 2;

    pdf.addImage(imgData, 'JPEG', x, y, renderWidth, renderHeight, undefined, 'FAST');
    return new Blob([pdf.output('arraybuffer')], { type: 'application/pdf' });
  } finally {
    iframe.remove();
  }
}
