'use client';

import { useEffect, useRef } from 'react';
import { useParams, notFound } from 'next/navigation';
import type { Invoice, InvoiceItem } from '@/lib/definitions';
import { useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, getFirestore } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const shopDetails = {
    name: 'SAAMBH JEWELLERS',
    address: '123 Royal Plaza, Jaipur, Rajasthan 302001',
    phone: '9876543210',
    email: 'contact@saambh.com',
    gstin: '08AAAAA0000A1Z5',
    pan: 'AAAAA0000A',
    logo_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwMCIgdmlld0JveD0iMCAwIDk2MCAxMTUyIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMCA1NzZWNTM0LjQ3N0w0NTMuNTMxIDBIMTAwLjgwN0wzLjczNTU4IDQxOC4xMDRMMCA1NzZaTTQ4MCAxMTUyTDY3OC43MDQgNTczLjQ0MUw0ODAgMjk5LjU5OUwzMDguNTAxIDUzNC45NTdMNDgwIDExNTJaTTM3Mi4yMzkgNDU1LjYxNkw0ODAgMjAyLjI0N0w1NzQuOTU2IDQ0Mi44MDNMMzcyLjIzOSA0NTUuNjE2WiIgZmlsbD0iI0Q0QUYzNyIvPgo8cGF0aCBkPSJNNjUyLjM4NyA0NDIuODA0TDQ4MCAxNTkuMzY3TDMyMS43NzMgNDU1LjYxNkw0ODAgNTk5LjE3OEw2NTIuMzg3IDQ0Mi4wMDRaTTk2MCA1NzZWNTM0LjQ3N0w0OTAuOTk0IDBIMTk0LjMzOUw5NTYuMjY0IDQxOC4xMDRMOTYwIDU3NloiIGZpbGw9IiM4MDAwMDAiLz4KPC9zdmc+Cg=='
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
        str += inWords(crores) + 'crore ';
        num %= 10000000;
    }
    const lakhs = Math.floor(num / 100000);
    if (lakhs > 0) {
        str += inWords(lakhs) + 'lakh ';
        num %= 100000;
    }
    const thousands = Math.floor(num / 1000);
    if (thousands > 0) {
        str += inWords(thousands) + 'thousand ';
        num %= 1000;
    }
    const hundreds = Math.floor(num / 100);
    if (hundreds > 0) {
        str += inWords(hundreds) + 'hundred ';
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
        <>
            <div className="watermark-container">
                <img src={shopDetails.logo_url} alt="Watermark" />
            </div>
            <div className="invoice-body">
                <header className="header">
                    <div className="shop-info">
                        <div className="shop-name">{shopDetails.name}</div>
                        <div className="shop-details">
                           <div>{shopDetails.address}</div>
                           <div><strong>Phone:</strong> {shopDetails.phone}</div>
                           <div><strong>Email:</strong> {shopDetails.email}</div>
                        </div>
                    </div>
                    <div className="invoice-info">
                        <div className="invoice-title">TAX INVOICE</div>
                        <div><strong>Invoice No:</strong> {invoice.invoiceNumber}</div>
                        <div><strong>GSTIN:</strong> {shopDetails.gstin}</div>
                        <div><strong>PAN:</strong> {shopDetails.pan}</div>
                        <div><strong>Date:</strong> {format(new Date(invoice.invoiceDate), 'dd-MMM-yyyy')}</div>
                    </div>
                </header>

                <section className="buyer-section">
                    <div className="title">Buyer Details</div>
                    <div className="details">
                        <div style={{ fontSize: '14px' }}><strong>{invoice.customerName}</strong></div>
                        <div>{invoice.customerAddress}</div>
                        <div>Phone: {invoice.customerPhone}</div>
                    </div>
                </section>

                <table className="items-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Purity</th>
                            <th className="text-right">Gross Wt.</th>
                            <th className="text-right">Net Wt.</th>
                            <th className="text-right">Rate</th>
                            <th className="text-right">Making</th>
                            <th className="text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id}>
                                <td>{item.description}</td>
                                <td>{item.purity}</td>
                                <td className="text-right">{formatTwoDecimals(item.grossWeight)}g</td>
                                <td className="text-right">{formatTwoDecimals(item.netWeight)}g</td>
                                <td className="text-right">₹{formatTwoDecimals(item.rate)}</td>
                                <td className="text-right">₹{formatTwoDecimals(item.making)}</td>
                                <td className="text-right">₹{formatTwoDecimals((item.netWeight * item.rate) + item.making)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                <table className="totals-table">
                    <tbody>
                        <tr>
                            <td className="text-right">Subtotal:</td>
                            <td className="text-right">₹{formatTwoDecimals(subtotal)}</td>
                        </tr>
                         {invoice.discount > 0 && (
                            <tr>
                                <td className="text-right">Discount:</td>
                                <td className="text-right">- ₹{formatTwoDecimals(invoice.discount)}</td>
                            </tr>
                        )}
                        <tr>
                            <td className="text-right">CGST ({cgstRate}%):</td>
                            <td className="text-right">₹{formatTwoDecimals(cgstAmount)}</td>
                        </tr>
                        <tr>
                            <td className="text-right">SGST ({sgstRate}%):</td>
                            <td className="text-right">₹{formatTwoDecimals(sgstAmount)}</td>
                        </tr>
                         {roundOff !== 0 && (
                            <tr>
                                <td className="text-right">Round Off:</td>
                                <td className="text-right">₹{formatTwoDecimals(roundOff)}</td>
                            </tr>
                        )}
                        <tr>
                            <td className="text-right grand-total">Grand Total:</td>
                            <td className="text-right grand-total">₹{formatTwoDecimals(finalAmount)}</td>
                        </tr>
                    </tbody>
                </table>
                
                <section className="words-section">
                    <strong>Amount in Words:</strong> {toWords(finalAmount)}
                </section>

                <footer className="footer">
                    <div className="thanks">Thank you for your business!</div>
                    <div className="signature-section">
                        <div><strong>FOR {shopDetails.name.toUpperCase()}</strong></div>
                        <div className="signature-line">Authorized Signatory</div>
                    </div>
                </footer>
            </div>
        </>
    );
}
