'use client';

import { Invoice, InvoiceItem } from '@/lib/definitions';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

interface PrintInvoiceParams {
    invoice: Invoice;
    items: InvoiceItem[];
    settings?: {
        shopName?: string;
        address?: string;
        state?: string;
        pincode?: string;
        phoneNumber?: string;
        email?: string;
        gstNumber?: string;
        panNumber?: string;
        cgstRate?: number;
        sgstRate?: number;
        logoUrl?: string;
    };
}

// Number to words converter for INR
function toWords(num: number): string {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function inWords(n: number): string {
        if (n < 20) return a[n];
        let digit = n % 10;
        return b[Math.floor(n / 10)] + (digit ? '-' : '') + a[digit];
    }

    if (num === 0) return 'Zero';
    let str = '';
    const crores = Math.floor(num / 10000000);
    if (crores > 0) {
        str += inWords(crores) + ' Crore ';
        num %= 10000000;
    }
    const lakhs = Math.floor(num / 100000);
    if (lakhs > 0) {
        str += inWords(lakhs) + ' Lakh ';
        num %= 100000;
    }
    const thousands = Math.floor(num / 1000);
    if (thousands > 0) {
        str += inWords(thousands) + ' Thousand ';
        num %= 1000;
    }
    const hundreds = Math.floor(num / 100);
    if (hundreds > 0) {
        str += inWords(hundreds) + ' Hundred ';
        num %= 100;
    }
    if (num > 0) {
        str += inWords(num);
    }
    return str.trim();
}

/**
 * Print invoice using iframe method (same-page print dialog, no redirect)
 * Works well on mobile devices
 */
export function printInvoice({ invoice, items, settings }: PrintInvoiceParams): void {
    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.left = '-9999px';
    document.body.appendChild(iframe);

    // Generate items HTML
    const itemsHtml = items.map(item => {
        const makingTotal = (item.makingRate * item.netWeight) + item.making;
        const lineTotal = (item.netWeight * item.rate) + makingTotal + item.stoneAmount;
        return `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <div style="font-weight: 500;">${item.description}</div>
                    ${item.tagId ? `<div style="font-size: 11px; color: #666;">Tag: ${item.tagId}</div>` : ''}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.hsnCode || '-'}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.netWeight}g</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.rate)}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(makingTotal)}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: 500;">${formatCurrency(lineTotal)}</td>
            </tr>
        `;
    }).join('');

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Invoice #${invoice.invoiceNumber}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    padding: 20px;
                    font-size: 13px;
                    color: #333;
                    line-height: 1.5;
                }
                .invoice-container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #d4af37;
                }
                .shop-info h1 {
                    font-size: 24px;
                    color: #d4af37;
                    margin-bottom: 5px;
                }
                .shop-info p {
                    color: #666;
                    font-size: 12px;
                }
                .invoice-info {
                    text-align: right;
                }
                .invoice-info h2 {
                    font-size: 20px;
                    margin-bottom: 5px;
                }
                .invoice-info p {
                    color: #666;
                    font-size: 12px;
                }
                .customer-info {
                    margin-bottom: 25px;
                    padding: 15px;
                    background: #f9f9f9;
                    border-radius: 8px;
                }
                .customer-info h3 {
                    color: #666;
                    font-size: 12px;
                    text-transform: uppercase;
                    margin-bottom: 8px;
                }
                .customer-info p {
                    font-size: 14px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 25px;
                }
                th {
                    background: #f9f9f9;
                    padding: 12px 10px;
                    text-align: left;
                    font-size: 11px;
                    text-transform: uppercase;
                    color: #666;
                    border-bottom: 2px solid #eee;
                }
                .totals {
                    display: flex;
                    justify-content: flex-end;
                }
                .totals-box {
                    width: 300px;
                }
                .totals-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                }
                .totals-row.grand {
                    font-size: 18px;
                    font-weight: bold;
                    color: #d4af37;
                    border-top: 2px solid #d4af37;
                    margin-top: 10px;
                    padding-top: 15px;
                }
                .in-words {
                    margin-top: 20px;
                    padding: 15px;
                    background: #f9f9f9;
                    border-radius: 8px;
                }
                .in-words span {
                    font-weight: 600;
                }
                @media print {
                    body {
                        padding: 0;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .invoice-container {
                        max-width: 100%;
                    }
                }
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <div class="header">
                    <div class="shop-info">
                        <h1>${settings?.shopName || 'Jewellers Store'}</h1>
                        <p>${settings?.address || ''}</p>
                        <p>${[settings?.state, settings?.pincode].filter(Boolean).join(', ')}</p>
                        ${settings?.phoneNumber ? `<p>Phone: ${settings.phoneNumber}</p>` : ''}
                        ${settings?.email ? `<p>Email: ${settings.email}</p>` : ''}
                    </div>
                    <div class="invoice-info">
                        <h2>Invoice #${invoice.invoiceNumber}</h2>
                        <p><strong>GST:</strong> ${settings?.gstNumber || 'N/A'}</p>
                        <p><strong>PAN:</strong> ${settings?.panNumber || 'N/A'}</p>
                        <p><strong>Date:</strong> ${format(new Date(invoice.invoiceDate), 'dd MMM, yyyy')}</p>
                        <p><strong>Status:</strong> ${invoice.status.toUpperCase()}</p>
                    </div>
                </div>

                <div class="customer-info">
                    <h3>Bill To</h3>
                    <p><strong>${invoice.customerSnapshot?.name || 'Cash Customer'}</strong></p>
                    ${invoice.customerSnapshot?.address ? `<p>${invoice.customerSnapshot.address}</p>` : ''}
                    ${invoice.customerSnapshot?.state || invoice.customerSnapshot?.pincode ?
            `<p>${[invoice.customerSnapshot.state, invoice.customerSnapshot.pincode].filter(Boolean).join(', ')}</p>` : ''}
                    ${invoice.customerSnapshot?.phone ? `<p>Phone: ${invoice.customerSnapshot.phone}</p>` : ''}
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 35%;">Description</th>
                            <th style="text-align: center;">HSN</th>
                            <th style="text-align: center;">Weight</th>
                            <th style="text-align: right;">Rate</th>
                            <th style="text-align: right;">Making</th>
                            <th style="text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div class="totals">
                    <div class="totals-box">
                        <div class="totals-row">
                            <span>Subtotal</span>
                            <span>${formatCurrency(invoice.subtotal)}</span>
                        </div>
                        ${invoice.discount > 0 ? `
                        <div class="totals-row">
                            <span>Discount</span>
                            <span>- ${formatCurrency(invoice.discount)}</span>
                        </div>
                        ` : ''}
                        <div class="totals-row">
                            <span>SGST (${settings?.sgstRate || 1.5}%)</span>
                            <span>${formatCurrency(invoice.sgstAmount)}</span>
                        </div>
                        <div class="totals-row">
                            <span>CGST (${settings?.cgstRate || 1.5}%)</span>
                            <span>${formatCurrency(invoice.cgstAmount)}</span>
                        </div>
                        <div class="totals-row grand">
                            <span>Grand Total</span>
                            <span>${formatCurrency(invoice.grandTotal)}</span>
                        </div>
                    </div>
                </div>

                <div class="in-words">
                    <span>Amount in Words:</span> ${toWords(Math.round(invoice.grandTotal))} Rupees Only
                </div>
            </div>
        </body>
        </html>
    `;

    if (iframe.contentDocument) {
        iframe.contentDocument.open();
        iframe.contentDocument.write(htmlContent);
        iframe.contentDocument.close();

        // Wait for content to load, then print
        iframe.onload = () => {
            setTimeout(() => {
                iframe.contentWindow?.print();
                // Clean up after printing
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 1000);
            }, 250);
        };
    }
}
