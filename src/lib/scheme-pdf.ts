import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { SchemeEnrollment, SchemeTransaction } from './scheme-types';
import { Shop } from './definitions';

interface GenerateReceiptParams {
    transaction: SchemeTransaction;
    enrollment: SchemeEnrollment;
    shop: Partial<Shop>;
}

export async function generateSchemeReceiptPdf({ transaction, enrollment, shop }: GenerateReceiptParams): Promise<Blob> {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5', // A5 is good for receipts
    });

    const pageWidth = doc.internal.pageSize.width;
    const centerX = pageWidth / 2;

    // --- Header ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(shop.shopName || 'Jewellery Shop', centerX, 15, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80);

    let yPos = 22;
    if (shop.address) {
        const addressLines = doc.splitTextToSize(shop.address, pageWidth - 30);
        doc.text(addressLines, centerX, yPos, { align: 'center' });
        yPos += (addressLines.length * 4);
    }

    const contactLine = [shop.phoneNumber, shop.email].filter(Boolean).join(' | ');
    if (contactLine) {
        doc.text(contactLine, centerX, yPos, { align: 'center' });
        yPos += 6;
    }

    doc.setLineWidth(0.5);
    doc.line(10, yPos, pageWidth - 10, yPos);

    // --- Title ---
    yPos += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('PAYMENT RECEIPT', centerX, yPos, { align: 'center' });

    // --- Details Box ---
    yPos += 10;
    const boxTop = yPos;
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(10, yPos, pageWidth - 20, 65, 3, 3, 'F');

    yPos += 8;
    const labelX = 15;
    const valueX = 70;
    const lineHeight = 7;

    doc.setFontSize(10);

    // Receipt No
    doc.setFont('helvetica', 'normal');
    doc.text('Receipt No:', labelX, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(`#${transaction.id.slice(0, 8).toUpperCase()}`, valueX, yPos);

    // Date
    yPos += lineHeight;
    doc.setFont('helvetica', 'normal');
    doc.text('Date:', labelX, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(format(new Date(transaction.payment_date || transaction.created_at), 'dd MMM yyyy, h:mm a'), valueX, yPos);

    // Customer
    yPos += lineHeight;
    doc.setFont('helvetica', 'normal');
    doc.text('Customer Name:', labelX, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(enrollment.customer?.name || 'Unknown', valueX, yPos);

    // Account
    yPos += lineHeight;
    doc.setFont('helvetica', 'normal');
    doc.text('Scheme Account:', labelX, yPos);
    doc.text(enrollment.account_number || '-', valueX, yPos);

    // Scheme
    yPos += lineHeight;
    doc.text('Scheme Name:', labelX, yPos);
    doc.text(enrollment.scheme?.name || '-', valueX, yPos);

    // Mode
    yPos += lineHeight;
    doc.text('Payment Mode:', labelX, yPos);
    doc.text(transaction.payment_mode || 'CASH', valueX, yPos);

    // Gold Rate (if applicable)
    if (transaction.gold_rate) {
        yPos += lineHeight;
        doc.text('Gold Rate:', labelX, yPos);
        doc.text(`Rs. ${transaction.gold_rate}/g`, valueX, yPos);
    }

    // --- Amount Badge ---
    yPos += 15;
    doc.setFillColor(240, 240, 240);
    doc.rect(10, yPos, pageWidth - 20, 20, 'F');

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`Amount Received: Rs. ${transaction.amount.toFixed(2)}`, centerX, yPos + 13, { align: 'center' });

    // Gold Weight (if applicable)
    if (transaction.gold_weight) {
        yPos += 25;
        doc.setFontSize(10);
        doc.setTextColor(0, 100, 0); // Dark Green
        doc.text(`Gold Credited: ${transaction.gold_weight.toFixed(3)} grams`, centerX, yPos, { align: 'center' });
    }

    // --- Footer ---
    const footerY = doc.internal.pageSize.height - 20;
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text('This is a computer generated receipt.', centerX, footerY, { align: 'center' });
    doc.text('Thank you for saving with us!', centerX, footerY + 5, { align: 'center' });

    return doc.output('blob');
}
