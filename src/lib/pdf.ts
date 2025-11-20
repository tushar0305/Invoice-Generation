import type { Invoice, InvoiceItem, UserSettings } from './definitions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// Helper to format currency
const formatCurrency = (amount: number) => {
  return `Rs. ${amount.toFixed(2)}`;
};

// Helper to convert number to words (simplified for now, or copy the logic)
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
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Colors
  const ROYAL_BLUE = '#0F172A';
  const GOLD = '#D4AF37';
  const LIGHT_GRAY = '#F3F4F6';
  const TEXT_GRAY = '#4B5563';

  // Fonts
  doc.setFont('times', 'bold'); // Serif for headings

  // --- Header ---
  // Shop Name
  doc.setTextColor(ROYAL_BLUE);
  doc.setFontSize(24);
  doc.text(settings?.shopName || 'Jewellery Shop', 15, 20);

  // Tax Invoice Label
  doc.setFontSize(16);
  doc.setTextColor(GOLD);
  doc.text('TAX INVOICE', 195, 20, { align: 'right' });

  // Shop Details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(TEXT_GRAY);
  let yPos = 28;
  const addressLines = doc.splitTextToSize(settings?.address || '', 80);
  doc.text(addressLines, 15, yPos);
  yPos += (addressLines.length * 4);

  if (settings?.phoneNumber) {
    doc.text(`Phone: ${settings.phoneNumber}`, 15, yPos);
    yPos += 4;
  }
  if (settings?.email) {
    doc.text(`Email: ${settings.email}`, 15, yPos);
    yPos += 4;
  }

  // Invoice Details (Right side)
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(ROYAL_BLUE);
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 195, 30, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(TEXT_GRAY);
  doc.text(`Date: ${format(new Date(invoice.invoiceDate), 'dd MMM, yyyy')}`, 195, 35, { align: 'right' });

  // Business Identifiers (Right side)
  let metaY = 40;
  if (settings?.gstNumber) {
    doc.setFont('helvetica', 'bold');
    doc.text(`GSTIN: ${settings.gstNumber}`, 195, metaY, { align: 'right' });
    metaY += 5;
  }
  if (settings?.panNumber) {
    doc.setFont('helvetica', 'bold');
    doc.text(`PAN: ${settings.panNumber}`, 195, metaY, { align: 'right' });
    metaY += 5;
  }

  // Divider
  doc.setDrawColor(GOLD);
  doc.setLineWidth(0.5);
  doc.line(15, Math.max(yPos + 2, 55), 195, Math.max(yPos + 2, 55));

  // --- Customer Details ---
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

  // --- Items Table ---
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

  autoTable(doc, {
    startY: 90,
    head: [['#', 'Description', 'Purity', 'G.Wt', 'N.Wt', 'Rate', 'Making', 'Amount']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: ROYAL_BLUE,
      textColor: '#FFFFFF',
      font: 'times',
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      font: 'helvetica',
      fontSize: 9,
      textColor: ROYAL_BLUE,
      halign: 'right' // Default right align for numbers
    },
    columnStyles: {
      0: { halign: 'center' }, // #
      1: { halign: 'left' },   // Description
      2: { halign: 'center' }, // Purity
    },
    alternateRowStyles: {
      fillColor: '#F8FAFC' // Very light blue/gray
    },
    margin: { left: 15, right: 15 },
  });

  // --- Totals ---
  // @ts-ignore
  let finalY = doc.lastAutoTable.finalY + 10;

  // Prevent page break issues for totals
  if (finalY > 250) {
    doc.addPage();
    finalY = 20;
  }

  const rightColX = 140;
  const valueX = 195;
  const lineHeight = 6;

  // Subtotal
  const subtotal = items.reduce((acc, item) => acc + (item.netWeight * item.rate) + (item.netWeight * item.making), 0);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(TEXT_GRAY);
  doc.text('Subtotal:', rightColX, finalY);
  doc.text(formatCurrency(subtotal), valueX, finalY, { align: 'right' });

  finalY += lineHeight;

  // Discount
  if (invoice.discount > 0) {
    doc.text('Discount:', rightColX, finalY);
    doc.text(`- ${formatCurrency(invoice.discount)}`, valueX, finalY, { align: 'right' });
    finalY += lineHeight;
  }

  // Tax
  // Tax
  const totalBeforeTax = subtotal - (invoice.discount || 0);

  // Assuming invoice.cgst and invoice.sgst are AMOUNTS stored in the DB
  const cgstAmount = invoice.cgst || 0;
  const sgstAmount = invoice.sgst || 0;

  // Calculate rates for display if possible, otherwise default
  // If we have settings, use those rates. If not, try to back-calculate or hide rate.
  const cgstRate = settings?.cgstRate || (totalBeforeTax > 0 ? (cgstAmount / totalBeforeTax) * 100 : 0);
  const sgstRate = settings?.sgstRate || (totalBeforeTax > 0 ? (sgstAmount / totalBeforeTax) * 100 : 0);

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

  // Grand Total
  finalY += 2;
  doc.setDrawColor(GOLD);
  doc.setLineWidth(0.5);
  doc.line(rightColX - 5, finalY, 195, finalY);
  finalY += 6;

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(ROYAL_BLUE);
  doc.text('Grand Total:', rightColX, finalY);
  doc.text(formatCurrency(invoice.grandTotal), valueX, finalY, { align: 'right' });

  // Amount in Words
  finalY += 15;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(TEXT_GRAY);
  doc.text(`Amount in Words: ${toWords(Math.round(invoice.grandTotal))} Rupees Only`, 15, finalY);

  // --- Footer ---
  const pageHeight = doc.internal.pageSize.height;
  const footerY = pageHeight - 30;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Terms & Conditions:', 15, footerY);
  doc.text('1. Goods once sold will not be taken back.', 15, footerY + 5);
  doc.text('2. Subject to local jurisdiction.', 15, footerY + 9);

  doc.text('Authorized Signatory', 195, footerY + 15, { align: 'right' });

  return doc.output('blob');
}
