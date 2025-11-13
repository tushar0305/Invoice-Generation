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
};

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
    if (typeof num !== 'number' || isNaN(num)) {
        return '0.00';
    }
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
    const { data: items, isLoading: loadingItems } = useCollection<InvoiceItem>(itemsRef);

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
        <div className="invoice-container">
            <header className="invoice-header">
                <div className="header-left">
                    <h1 className="shop-name">{shopDetails.name}</h1>
                    <p>{shopDetails.address}</p>
                </div>
                <div className="header-right">
                    <h2>TAX INVOICE</h2>
                    <p><strong>Invoice #:</strong> {invoice.invoiceNumber}</p>
                    <p><strong>Date:</strong> {format(new Date(invoice.invoiceDate), 'dd MMM, yyyy')}</p>
                    <p><strong>GSTIN:</strong> {shopDetails.gstin}</p>
                    <p><strong>PAN:</strong> {shopDetails.pan}</p>
                </div>
            </header>
            
            <div className="separator"></div>

            <section className="customer-details">
                <h3>Buyer Details:</h3>
                <p><strong>{invoice.customerName}</strong></p>
                <p>{invoice.customerAddress}</p>
                <p>Phone: {invoice.customerPhone}</p>
            </section>

            <div className="separator"></div>

            <section className="items-section">
                <table className="items-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Item Description</th>
                            <th className="text-right">Purity</th>
                            <th className="text-right">Gross Wt.</th>
                            <th className="text-right">Net Wt.</th>
                            <th className="text-right">Rate</th>
                            <th className="text-right">Making</th>
                            <th className="text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={item.id}>
                                <td>{index + 1}</td>
                                <td>{item.description}</td>
                                <td className="text-right">{item.purity}</td>
                                <td className="text-right">{formatTwoDecimals(item.grossWeight)}g</td>
                                <td className="text-right">{formatTwoDecimals(item.netWeight)}g</td>
                                <td className="text-right">₹{formatTwoDecimals(item.rate)}</td>
                                <td className="text-right">₹{formatTwoDecimals(item.making)}</td>
                                <td className="text-right">₹{formatTwoDecimals((item.netWeight * item.rate) + item.making)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <section className="summary-section">
                <div className="summary-details">
                    <div className="summary-row">
                        <span>Subtotal</span>
                        <span>₹{formatTwoDecimals(subtotal)}</span>
                    </div>
                    {invoice.discount > 0 && (
                        <div className="summary-row">
                            <span>Discount</span>
                            <span>- ₹{formatTwoDecimals(invoice.discount)}</span>
                        </div>
                    )}
                    <div className="summary-row">
                        <span>CGST ({formatTwoDecimals(cgstRate)}%)</span>
                        <span>+ ₹{formatTwoDecimals(cgstAmount)}</span>
                    </div>
                    <div className="summary-row">
                        <span>SGST ({formatTwoDecimals(sgstRate)}%)</span>
                        <span>+ ₹{formatTwoDecimals(sgstAmount)}</span>
                    </div>
                     {roundOff !== 0 && (
                        <div className="summary-row">
                            <span>Round Off</span>
                            <span>₹{formatTwoDecimals(roundOff)}</span>
                        </div>
                    )}
                    <div className="summary-row grand-total">
                        <span>GRAND TOTAL</span>
                        <span>₹{formatTwoDecimals(finalAmount)}</span>
                    </div>
                </div>
            </section>
            
            <section className="words-section">
                <strong>Amount in Words:</strong>
                <p>{toWords(finalAmount)}</p>
            </section>

            <footer className="invoice-footer">
                <div className="terms">
                    <h4>Terms & Conditions</h4>
                    <p>1. Goods once sold will not be taken back or exchanged.</p>
                    <p>2. All disputes are subject to Jaipur jurisdiction only.</p>
                </div>
                <div className="signature">
                    <p>For {shopDetails.name}</p>
                    <div className="signature-box"></div>
                    <p>Authorised Signatory</p>
                </div>
            </footer>
        </div>
    );
}
