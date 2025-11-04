'use client';

import { useEffect, useRef } from 'react';
import { useParams, notFound } from 'next/navigation';
import type { Invoice, InvoiceItem } from '@/lib/definitions';
import { useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, getFirestore } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const shopDetails = {
    address: '123 Royal Plaza, Jaipur, Rajasthan 302001',
    phone: '9876543210',
    email: 'contact@saambh.com',
    gstin: '08AAAAA0000A1Z5',
    pan: 'AAAAA0000A',
    logo_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwMCIgdmlld0JveD0iMCAwIDk2MCAxMTUyIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMCA1NzZWNTM0LjQ3N0w0NTMuNTMxIDBIMTAwLjgwN0wzLjczNTU4IDQxOC4xMDRMMCA1NzZaTTQ4MCAxMTUyTDY3OC43MDQgNTczLjQ0MUw0ODAgMjk5LjU5OUwzMDguNTAxIDUzNC45NTdMNDgwIDExNTJaTTM3Mi4yMzkgNDU1LjYxNkw0ODAgMjAyLjI0N0w1NzQuOTU2IDQ0Mi44MDNMMzcyLjIzOSA0NTUuNjE2WiIgZmlsbD0iI0Q0QUYzNyIvPgo8cGF0aCBkPSJNNjUyLjM4NyA0NDIuODA0TDQ4MCAxNTkuMzY3TDMyMS43NzMgNDU1LjYxNkw0ODAgNTk5LjE3OEw2NTIuMzg3IDQ0Mi44MDRaTTk2MCA1NzZWNTM0LjQ3N0w0OTAuOTk0IDBIMTk0LjMzOUw5NTYuMjY0IDQxOC4xMDRMOTYwIDU3NloiIGZpbGw9IiM4MDAwMDAiLz4KPC9zdmc+Cg=='
}

function toWords(num: number): string {
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    function inWords(n: number): string {
        let s = '';
        if (n < 20) {
            s = a[n];
        } else {
            const digit = n % 10;
            s = b[Math.floor(n / 10)] + (digit ? '-' : '') + a[digit];
        }
        return s;
    }
    
    if (num === 0) return 'Zero';
    let str = '';
    const crores = Math.floor(num / 10000000);
    if (crores > 0) {
        str += inWords(crores) + ' crore ';
        num %= 10000000;
    }
    const lakhs = Math.floor(num / 100000);
    if (lakhs > 0) {
        str += inWords(lakhs) + ' lakh ';
        num %= 100000;
    }
    const thousands = Math.floor(num / 1000);
    if (thousands > 0) {
        str += inWords(thousands) + ' thousand ';
        num %= 1000;
    }
    const hundreds = Math.floor(num / 100);
    if (hundreds > 0) {
        str += inWords(hundreds) + ' hundred ';
        num %= 100;
    }
    if (num > 0) {
        if (str !== '') str += 'and ';
        str += inWords(num);
    }
    return str.trim().replace(/\s+/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + ' Only';
}

function formatTwoDecimals(num: number) {
    return num.toFixed(2);
}

export default function PrintInvoicePage() {
    const params = useParams();
    const id = params.id as string;
    const firestore = getFirestore();
    const printTriggered = useRef(false);

    const invoiceRef = useMemoFirebase(() => doc(firestore, 'invoices', id), [firestore, id]);
    const { data: invoice, isLoading: loadingInvoice } = useDoc<Invoice>(invoiceRef);

    const itemsRef = useMemoFirebase(() => collection(firestore, `invoices/${id}/invoiceItems`), [firestore, id]);
    const { data: items, isLoading: loadingItems } = useCollection<InvoiceItem[]>(itemsRef);

    const isLoading = loadingInvoice || loadingItems;

    useEffect(() => {
        if (!isLoading && invoice && items && !printTriggered.current) {
            printTriggered.current = true;
            setTimeout(() => window.print(), 500);
        }
    }, [isLoading, invoice, items]);


    if (isLoading) {
        return <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!invoice || !items) {
        notFound();
    }
    
    const subtotal = items.reduce((acc, item) => acc + (item.netWeight * item.rate) + item.making, 0);
    const taxRate = invoice.tax || 0;
    const cgstRate = taxRate / 2;
    const sgstRate = taxRate / 2;
    
    const totalBeforeTax = subtotal - invoice.discount;
    const cgstAmount = totalBeforeTax * (cgstRate / 100);
    const sgstAmount = totalBeforeTax * (sgstRate / 100);

    const grandTotal = totalBeforeTax + cgstAmount + sgstAmount;
    const roundOff = Math.round(grandTotal) - grandTotal;
    const finalAmount = Math.round(grandTotal);

    return (
        <div className="bg-white">
            <div className="watermark"><img src={shopDetails.logo_url} alt="Watermark" /></div>
            <div className="header">
                <div className="logo-section">
                    <div className="shop-info">
                    <div className="shop-name">SAAMBH JEWELLERS</div>
                    <div className="shop-details">
                        <div style={{ color: '#333', marginBottom: '4px' }}>{shopDetails.address}</div>
                        <div style={{ color: '#333', marginBottom: '4px' }}>
                        <strong>Phone:</strong> {shopDetails.phone}
                        </div>
                        <div style={{ color: '#333' }}>
                        <strong>Email:</strong> {shopDetails.email}
                        </div>
                    </div>
                    </div>
                </div>
                <div className="invoice-info">
                    <div className="invoice-title">TAX INVOICE</div>
                    <div><strong>Invoice No:</strong> {invoice.invoiceNumber}</div>
                    <div><strong>GSTIN:</strong> {shopDetails.gstin}</div>
                    <div><strong>PAN:</strong> {shopDetails.pan}</div>
                    <div><strong>Date:</strong> {format(new Date(invoice.invoiceDate), 'dd-MMM-yyyy')}</div>
                </div>
            </div>

            <div style={{ borderTop: '1px solid #d1d5db', marginTop: '20px' }}></div>
            <div style={{ borderBottom: '2px solid #d1d5db', margin: '5px 0', padding: '15px 0' }}>
                <div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '15px', letterSpacing: '.04em', marginBottom: '12px' }}>Buyer Details</div>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}><strong>{invoice.customerName}</strong></div>
                <div style={{ color: '#333', marginBottom: '4px' }}>{invoice.customerAddress}</div>
                <div style={{ color: '#333' }}>Phone: {invoice.customerPhone}</div>
            </div>

            <table>
                <thead>
                    <tr>
                    <th>Description</th>
                    <th>Purity</th>
                    <th className="right">Gross Wt</th>
                    <th className="right">Net Wt</th>
                    <th className="right">Rate</th>
                    <th className="right">Making</th>
                    <th className="right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => (
                        <tr key={item.id}>
                        <td>{item.description}</td>
                        <td>{item.purity}</td>
                        <td className="right">{formatTwoDecimals(item.grossWeight)}</td>
                        <td className="right">{formatTwoDecimals(item.netWeight)}</td>
                        <td className="right">₹ {formatTwoDecimals(item.rate)}</td>
                        <td className="right">₹ {formatTwoDecimals(item.making)}</td>
                        <td className="right">₹ {formatTwoDecimals((item.netWeight * item.rate) + item.making)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <table className="totals" style={{ width: '50%', marginLeft: 'auto', marginTop: 0 }}>
                <tbody>
                    <tr><td className="right">Subtotal:</td><td className="right">₹ {formatTwoDecimals(subtotal)}</td></tr>
                    {invoice.discount > 0 && (
                        <tr><td className="right">Discount:</td><td className="right">- ₹ {formatTwoDecimals(invoice.discount)}</td></tr>
                    )}
                    <tr><td className="right">CGST ({cgstRate}%):</td><td className="right">₹ {formatTwoDecimals(cgstAmount)}</td></tr>
                    <tr><td className="right">SGST ({sgstRate}%):</td><td className="right">₹ {formatTwoDecimals(sgstAmount)}</td></tr>
                    <tr><td className="right">Round Off:</td><td className="right">₹ {formatTwoDecimals(roundOff)}</td></tr>
                    <tr className="grand-total"><td className="right grand">Grand Total:</td><td className="right grand">₹ {formatTwoDecimals(finalAmount)}</td></tr>
                </tbody>
            </table>

            <div style={{ marginTop: '20px', padding: '15px 0', borderTop: '1px solid #d1d5db', borderBottom: '1px solid #d1d5db' }}>
                <div style={{ fontSize: '12px' }}>
                    <strong>Amount in Words:</strong> 
                    <span style={{ color: '#333' }}> {toWords(finalAmount)}</span>
                </div>
            </div>

            <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ color: '#666666' }}>Thank you for your business!</div>
                <div className="signature-section">
                    <div><strong>FOR SAAMBH JEWELLERS</strong></div>
                    <div style={{ marginTop: '40px', borderTop: '1px solid #d1d5db', width: '200px', marginLeft: 'auto', paddingTop: '8px' }}>
                    Authorized Signatory
                    </div>
                </div>
            </div>
        </div>
    );
}

    

