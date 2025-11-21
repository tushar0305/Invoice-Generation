import type { Invoice, InvoiceItem, UserSettings } from './definitions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// Helper to format currency
const formatCurrency = (amount: number) => {
  return `Rs. ${amount.toFixed(2)}`;
};

// Helper to convert number to words
function toWords(num: number): string {
  const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  function inWords(n: number): string {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit ? '-' : '') + a[digit];
  }
  if (num === 0) return 'zero';
  let str = '';
  let n = Math.floor(num);
  const crores = Math.floor(n / 10000000);
  if (crores > 0) { str += inWords(crores) + ' crore '; n %= 10000000; }
  const lakhs = Math.floor(n / 100000);
  if (lakhs > 0) { str += inWords(lakhs) + ' lakh '; n %= 100000; }
  const thousands = Math.floor(n / 1000);
  if (thousands > 0) { str += inWords(thousands) + ' thousand '; n %= 1000; }
  const hundreds = Math.floor(n / 100);
  if (hundreds > 0) { str += inWords(hundreds) + ' hundred '; n %= 100; }
  if (n > 0) { str += inWords(n); }
  return str.trim().replace(/\s+/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

interface GenerateInvoicePdfParams {
  invoice: Invoice;
  items: InvoiceItem[];
  settings?: Partial<UserSettings> | null;
}

export async function generateInvoicePdf({ invoice, items, settings }: GenerateInvoicePdfParams): Promise<Blob> {
  const templateId = settings?.templateId || 'classic';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Common Data Preparation
  const shopName = settings?.shopName || 'Jewellery Shop';
  const addressLines = doc.splitTextToSize(settings?.address || '', 80);
  const invoiceDate = format(new Date(invoice.invoiceDate), 'dd MMM, yyyy');

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + (item.netWeight * item.rate) + (item.netWeight * item.making), 0);
  const totalBeforeTax = subtotal - (invoice.discount || 0);
  const cgstAmount = invoice.cgst || 0;
  const sgstAmount = invoice.sgst || 0;
  const cgstRate = settings?.cgstRate || (totalBeforeTax > 0 ? (cgstAmount / totalBeforeTax) * 100 : 0);
  const sgstRate = settings?.sgstRate || (totalBeforeTax > 0 ? (sgstAmount / totalBeforeTax) * 100 : 0);

  const tableBody = items.map((item, index) => {
    const makingTotal = item.netWeight * item.making;
    const lineTotal = (item.netWeight * item.rate) + makingTotal;
    return [
      index + 1,
      item.description,
      item.purity,
      item.grossWeight.toFixed(3),
      item.netWeight.toFixed(3),
      formatCurrency(item.rate),
      formatCurrency(makingTotal),
      formatCurrency(lineTotal)
    ];
  });

  // --- TEMPLATE LOGIC ---

  if (templateId === 'modern') {
    // === MODERN TEMPLATE ===
    const PRIMARY_COLOR = '#1e293b'; // Slate 800
    const ACCENT_COLOR = '#f1f5f9'; // Slate 100

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(PRIMARY_COLOR);
    doc.text(shopName, 15, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor('#64748b'); // Slate 500
    let yPos = 28;
    doc.text(addressLines, 15, yPos);
    yPos += (addressLines.length * 4);
    if (settings?.phoneNumber) { doc.text(settings.phoneNumber, 15, yPos); yPos += 4; }
    if (settings?.email) { doc.text(settings.email, 15, yPos); }

    // Invoice Badge
    doc.setFillColor(ACCENT_COLOR);
    doc.roundedRect(150, 12, 45, 12, 2, 2, 'F');
    doc.setFontSize(14);
    doc.setTextColor(PRIMARY_COLOR);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 172.5, 20, { align: 'center' });

    // Meta
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#475569');
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 195, 32, { align: 'right' });
    doc.text(`Date: ${invoiceDate}`, 195, 37, { align: 'right' });
    if (settings?.gstNumber) doc.text(`GSTIN: ${settings.gstNumber}`, 195, 42, { align: 'right' });

    // Bill To Box
    doc.setFillColor('#f8fafc');
    doc.roundedRect(15, 55, 180, 25, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(PRIMARY_COLOR);
    doc.text('BILL TO', 20, 62);

    doc.setFontSize(10);
    doc.text(invoice.customerName, 20, 68);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor('#475569');
    if (invoice.customerAddress) doc.text(invoice.customerAddress, 20, 73);
    if (invoice.customerPhone) doc.text(`Phone: ${invoice.customerPhone}`, 150, 68);

    // Table
    autoTable(doc, {
      startY: 85,
      head: [['#', 'Description', 'Purity', 'G.Wt', 'N.Wt', 'Rate', 'Making', 'Amount']],
      body: tableBody,
      theme: 'plain',
      headStyles: { fillColor: '#f1f5f9', textColor: PRIMARY_COLOR, fontStyle: 'bold' },
      bodyStyles: { textColor: '#334155' },
      columnStyles: { 0: { halign: 'center' }, 7: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: 15, right: 15 },
    });

  } else if (templateId === 'minimal') {
    // === MINIMAL TEMPLATE ===

    // Header Center
    doc.setFont('courier', 'bold');
    doc.setFontSize(18);
    doc.setTextColor('#000000');
    doc.text(shopName.toUpperCase(), 105, 20, { align: 'center' });

    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    let yPos = 26;
    doc.text(addressLines, 105, yPos, { align: 'center' });
    yPos += (addressLines.length * 4);
    if (settings?.phoneNumber) doc.text(settings.phoneNumber, 105, yPos, { align: 'center' });

    // Divider
    doc.setLineWidth(0.5);
    doc.line(15, yPos + 5, 195, yPos + 5);

    // Info Grid
    yPos += 15;
    doc.setFontSize(10);
    doc.text(`BILLED TO: ${invoice.customerName.toUpperCase()}`, 15, yPos);
    doc.text(`INVOICE NO: ${invoice.invoiceNumber}`, 195, yPos, { align: 'right' });

    yPos += 5;
    if (invoice.customerAddress) doc.text(invoice.customerAddress, 15, yPos);
    doc.text(`DATE: ${invoiceDate}`, 195, yPos, { align: 'right' });

    // Table
    autoTable(doc, {
      startY: yPos + 15,
      head: [['ITEM', 'PURITY', 'NET WT', 'RATE', 'MAKING', 'TOTAL']],
      body: items.map(item => [
        item.description,
        item.purity,
        item.netWeight.toFixed(3),
        formatCurrency(item.rate),
        formatCurrency(item.netWeight * item.making),
        formatCurrency((item.netWeight * item.rate) + (item.netWeight * item.making))
      ]),
      theme: 'plain',
      styles: { font: 'courier', fontSize: 9 },
      headStyles: { fontStyle: 'bold' },
      margin: { left: 15, right: 15 },
    });

  } else {
    // === CLASSIC TEMPLATE (Default) ===
    const ROYAL_BLUE = '#0F172A';
    const GOLD = '#D4AF37';
    const TEXT_GRAY = '#4B5563';

    doc.setFont('times', 'bold');
    doc.setTextColor(ROYAL_BLUE);
    doc.setFontSize(24);
    doc.text(shopName, 15, 20);

    doc.setFontSize(16);
    doc.setTextColor(GOLD);
    doc.text('TAX INVOICE', 195, 20, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(TEXT_GRAY);
    let yPos = 28;
    doc.text(addressLines, 15, yPos);
    yPos += (addressLines.length * 4);
    if (settings?.phoneNumber) { doc.text(`Phone: ${settings.phoneNumber}`, 15, yPos); yPos += 4; }
    if (settings?.email) { doc.text(`Email: ${settings.email}`, 15, yPos); }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(ROYAL_BLUE);
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 195, 30, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(TEXT_GRAY);
    doc.text(`Date: ${invoiceDate}`, 195, 35, { align: 'right' });

    let metaY = 40;
    if (settings?.gstNumber) {
      doc.setFont('helvetica', 'bold');
      doc.text(`GSTIN: ${settings.gstNumber}`, 195, metaY, { align: 'right' });
      metaY += 5;
    }
    if (settings?.panNumber) {
      doc.setFont('helvetica', 'bold');
      doc.text(`PAN: ${settings.panNumber}`, 195, metaY, { align: 'right' });
    }

    doc.setDrawColor(GOLD);
    doc.setLineWidth(0.5);
    doc.line(15, Math.max(yPos + 2, 55), 195, Math.max(yPos + 2, 55));

    yPos = 65;
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(ROYAL_BLUE);
    doc.text('Bill To:', 15, yPos);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(invoice.customerName, 15, yPos + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(TEXT_GRAY);
    if (invoice.customerAddress) doc.text(invoice.customerAddress, 15, yPos + 11);
    if (invoice.customerPhone) doc.text(`Phone: ${invoice.customerPhone}`, 15, yPos + 16);

    autoTable(doc, {
      startY: 90,
      head: [['#', 'Description', 'Purity', 'G.Wt', 'N.Wt', 'Rate', 'Making', 'Amount']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: ROYAL_BLUE, textColor: '#FFFFFF', font: 'times', fontSize: 9, fontStyle: 'bold', halign: 'center' },
      bodyStyles: { font: 'helvetica', fontSize: 9, textColor: ROYAL_BLUE, halign: 'right' },
      columnStyles: { 0: { halign: 'center' }, 1: { halign: 'left' }, 2: { halign: 'center' } },
      alternateRowStyles: { fillColor: '#F8FAFC' },
      margin: { left: 15, right: 15 },
    });
  }

  // --- TOTALS (Common Logic with Style Tweaks) ---
  // @ts-ignore
  let finalY = doc.lastAutoTable.finalY + 10;
  if (finalY > 250) { doc.addPage(); finalY = 20; }

  const rightColX = 140;
  const valueX = 195;
  const lineHeight = 6;

  doc.setFont(templateId === 'minimal' ? 'courier' : 'helvetica', 'normal');
  doc.setTextColor(templateId === 'modern' ? '#475569' : '#4B5563');
  if (templateId === 'minimal') doc.setTextColor('#000000');

  doc.text('Subtotal:', rightColX, finalY);
  doc.text(formatCurrency(subtotal), valueX, finalY, { align: 'right' });
  finalY += lineHeight;

  if (invoice.discount > 0) {
    doc.text('Discount:', rightColX, finalY);
    doc.text(`- ${formatCurrency(invoice.discount)}`, valueX, finalY, { align: 'right' });
    finalY += lineHeight;
  }

  if (cgstAmount > 0) {
    doc.text(`CGST (${cgstRate.toFixed(1)}%):`, rightColX, finalY);
    doc.text(formatCurrency(cgstAmount), valueX, finalY, { align: 'right' });
    finalY += lineHeight;
  }
  if (sgstAmount > 0) {
    doc.text(`SGST (${sgstRate.toFixed(1)}%):`, rightColX, finalY);
    doc.text(formatCurrency(sgstAmount), valueX, finalY, { align: 'right' });
    finalY += lineHeight;
  }

  finalY += 2;
  if (templateId === 'classic') {
    doc.setDrawColor('#D4AF37');
    doc.setLineWidth(0.5);
    doc.line(rightColX - 5, finalY, 195, finalY);
  } else if (templateId === 'modern') {
    doc.setDrawColor('#1e293b');
    doc.setLineWidth(0.5);
    doc.line(rightColX - 5, finalY, 195, finalY);
  } else {
    // Minimal
    doc.setDrawColor('#000000');
    doc.setLineWidth(0.5);
    doc.line(rightColX - 5, finalY, 195, finalY);
  }
  finalY += 6;

  doc.setFont(templateId === 'minimal' ? 'courier' : 'times', 'bold');
  if (templateId === 'modern') doc.setFont('helvetica', 'bold');

  doc.setFontSize(12);
  doc.setTextColor(templateId === 'modern' ? '#1e293b' : '#0F172A');
  if (templateId === 'minimal') doc.setTextColor('#000000');

  doc.text('Grand Total:', rightColX, finalY);
  doc.text(formatCurrency(invoice.grandTotal), valueX, finalY, { align: 'right' });

  // Words
  finalY += 15;
  doc.setFont(templateId === 'minimal' ? 'courier' : 'helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor('#4B5563');
  if (templateId === 'minimal') doc.setTextColor('#000000');
  doc.text(`Amount in Words: ${toWords(Math.round(invoice.grandTotal))} Rupees Only`, 15, finalY);

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  const footerY = pageHeight - 30;
  doc.setFont(templateId === 'minimal' ? 'courier' : 'helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Terms & Conditions:', 15, footerY);
  doc.text('1. Goods once sold will not be taken back.', 15, footerY + 5);
  doc.text('2. Subject to local jurisdiction.', 15, footerY + 9);
  doc.text('Authorized Signatory', 195, footerY + 15, { align: 'right' });

  return doc.output('blob');
}
