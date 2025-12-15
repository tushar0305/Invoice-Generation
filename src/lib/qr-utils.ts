import jsPDF from 'jspdf';
import QRCode from 'qrcode';

import { InventoryItem } from './inventory-types';

export async function generateBulkQRPdf(items: InventoryItem[], shopName: string) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Config
    const margin = 10;
    const qrSize = 30; // mm
    const cellWidth = 50; // mm
    const cellHeight = 55; // mm
    const cols = Math.floor((pageWidth - margin * 2) / cellWidth);
    const rows = Math.floor((pageHeight - margin * 2) / cellHeight);

    let currentCol = 0;
    let currentRow = 0;

    // Title
    doc.setFontSize(16);
    doc.text(`${shopName} - Inventory QR Codes`, pageWidth / 2, margin, { align: 'center' });

    // Start grid below title
    let yOffset = margin + 10;

    for (const item of items) {
        if (currentRow >= rows) {
            doc.addPage();
            currentRow = 0;
            currentCol = 0;
            yOffset = margin + 10; // Reset offset for new page
            // Re-add title on new pages? Optional. let's keep it simple.
        }

        const x = margin + (currentCol * cellWidth);
        const y = yOffset + (currentRow * cellHeight);

        // Border for cutting (optional)
        doc.setDrawColor(200);
        doc.rect(x, y, cellWidth - 2, cellHeight - 2);

        try {
            // Generate QR
            const qrDataUrl = await QRCode.toDataURL(item.tag_id, {
                width: 100,
                margin: 0,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            });

            // Add QR Image
            doc.addImage(qrDataUrl, 'PNG', x + (cellWidth - qrSize) / 2, y + 2, qrSize, qrSize);

            // Add Text Details
            doc.setFontSize(8);
            doc.setTextColor(0);

            // Tag ID
            doc.setFont("helvetica", "bold");
            doc.text(item.tag_id, x + cellWidth / 2, y + qrSize + 6, { align: 'center' });

            // Name (Truncate if too long)
            doc.setFont("helvetica", "normal");
            const itemName = item.name || '';
            const name = itemName.length > 20 ? itemName.substring(0, 18) + '...' : itemName;
            doc.text(name, x + cellWidth / 2, y + qrSize + 10, { align: 'center' });

            // Weight & Purity
            doc.text(`${item.net_weight}g • ${item.purity}`, x + cellWidth / 2, y + qrSize + 14, { align: 'center' });

        } catch (error) {
            console.error(`Failed to generate QR for ${item.tag_id}`, error);
        }

        currentCol++;
        if (currentCol >= cols) {
            currentCol = 0;
            currentRow++;
        }
    }

    return doc.output('blob');
}
