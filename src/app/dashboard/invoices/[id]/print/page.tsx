'use client';

import { useEffect, useRef, useState } from 'react';
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
    logo_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwMCIgdmlld0JveD0iMCAwIDk2MCAxMTUyIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMCA1NzZWNTM0LjQ3N0w0NTMuNTMxIDBIMTAwLjgwN0wzLjczNTU4IDQxOC4xMDRMMCA1NzZaIiBmaWxsPSIjRDNBMTM3Ii8+CjxwYXRoIGQPSJNNjUyLjM4NyA0NDIuODA0TDQ4MCAxNTkuMzY3TDMyMS43NzMgNDU1LjYxNkw0ODAgNTk5LjE3OEw2NTIuMzg3IDQ0Mi4wMDRaTTk2MCA1NzZWNTMinaeN0w0OTAuOTk0IDBIMTk0LjMzOUw5NTYuMjY0IDQxOC4xMDRMOTYwIDU3NloiIGZpbGw9IiM4MDAwMDAiLz4KPC9zdmc+Cg=='
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
    return num.toFixed(2);
}

function LogoFallback() {
    return (
        <div className="mx-auto w-20 h-20 mb-2 flex items-center justify-center">
            <svg width="64" height="64" viewBox="0 0 960 1152" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 576V534.477L453.531 0H100.807L3.73558 418.104L0 576Z" fill="#D4AF37"/>
                <path d="M480 1152L678.704 573.441L480 299.599L308.501 534.957L480 1152Z" fill="#D4AF37"/>
                <path d="M372.239 455.616L480 202.247L574.956 442.803L372.239 455.616Z" fill="#D4AF37"/>
                <path d="M652.387 442.804L480 159.367L321.773 455.616L480 599.178L652.387 442.804Z" fill="#800000"/>
                <path d="M960 576V534.477L490.994 0H194.339L956.264 418.104L960 576Z" fill="#800000"/>
            </svg>
        </div>
    )
}

export default function PrintInvoicePage() {
    const params = useParams();
    const id = params.id as string;
    const firestore = getFirestore();
    const printTriggered = useRef(false);
    const [logoLoaded, setLogoLoaded] = useState(true);

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
        <div className="invoice-container">
            <div className="watermark" style={{ backgroundImage: `url('${shopDetails.logo_url}')` }} />
            
            <div className="relative z-10">
                <header className="header">
                    {logoLoaded ? (
                        <img
                        src={shopDetails.logo_url}
                        alt="Saambh Jewellers Logo"
                        className="header-logo"
                        onError={() => setLogoLoaded(false)}
                        />
                    ) : (
                        <LogoFallback />
                    )}
                    <h1 className="shop-name">{shopDetails.name}</h1>
                    <p className="shop-address">{shopDetails.address}</p>
                    <p className="shop-contact">Phone: {shopDetails.phone} | Email: {shopDetails.email}</p>
                </header>
                
                <div className="invoice-details">
                    <div>
                        <p><strong>Invoice No:</strong> {invoice.invoiceNumber}</p>
                        <p><strong>Date:</strong> {format(new Date(invoice.invoiceDate), 'dd MMM, yyyy')}</p>
                        <p><strong>GSTIN:</strong> {shopDetails.gstin}</p>
                    </div>
                    <div className="customer-details">
                        <p><strong>Customer:</strong> {invoice.customerName}</p>
                        <p><strong>Phone:</strong> {invoice.customerPhone}</p>
                        <p><strong>Address:</strong> {invoice.customerAddress}</p>
                    </div>
                </div>

                <table className="items-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th className="text-right">Weight</th>
                            <th className="text-right">Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id}>
                                <td>{item.description}</td>
                                <td className="text-right">{formatTwoDecimals(item.netWeight)}g</td>
                                <td className="text-right">{formatTwoDecimals((item.netWeight * item.rate) + item.making)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                <div className="summary">
                    <div className="summary-box">
                        <div className="summary-item">
                            <span>Subtotal</span>
                            <span>₹{formatTwoDecimals(subtotal)}</span>
                        </div>
                        {invoice.discount > 0 && (
                             <div className="summary-item">
                                <span>Discount</span>
                                <span>- ₹{formatTwoDecimals(invoice.discount)}</span>
                            </div>
                        )}
                        <div className="summary-item">
                            <span>CGST ({cgstRate}%)</span>
                            <span>₹{formatTwoDecimals(cgstAmount)}</span>
                        </div>
                        <div className="summary-item">
                            <span>SGST ({sgstRate}%)</span>
                            <span>₹{formatTwoDecimals(sgstAmount)}</span>
                        </div>
                         {roundOff !== 0 && (
                            <div className="summary-item">
                                <span>Round Off</span>
                                <span>₹{formatTwoDecimals(roundOff)}</span>
                            </div>
                        )}
                        <div className="summary-item total">
                            <span>Grand Total</span>
                            <span>₹{formatTwoDecimals(finalAmount)}</span>
                        </div>
                    </div>
                </div>
                 <div className="words-section">
                    <strong>Amount in Words:</strong> {toWords(finalAmount)}
                </div>

                <footer className="footer">
                    <p>Thank you for shopping with {shopDetails.name}!</p>
                    <p className="italic">“Every piece tells a story of elegance.”</p>
                </footer>
            </div>
        </div>
    );
}

    