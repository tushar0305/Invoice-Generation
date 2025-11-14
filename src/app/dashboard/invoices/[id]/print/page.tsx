'use client';

import { useEffect, useRef } from 'react';
import { useParams, notFound } from 'next/navigation';
import type { Invoice, InvoiceItem } from '@/lib/definitions';
import { useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, getFirestore } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const shop = {
    name: 'SAAMBH JEWELLERS',
    address: '123 Royal Plaza, Jaipur, Rajasthan 302001',
    phone: '9876543210',
    email: 'contact@saambh.com',
    gstin: '08AAAAA0000A1Z5',
    pan: 'AAAAA0000A',
    logoUrl: '/img/logo.jpeg',
};

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
    const crores = Math.floor(num / 10000000);
    if (crores > 0) { str += inWords(crores) + ' crore '; num %= 10000000; }
    const lakhs = Math.floor(num / 100000);
    if (lakhs > 0) { str += inWords(lakhs) + ' lakh '; num %= 100000; }
    const thousands = Math.floor(num / 1000);
    if (thousands > 0) { str += inWords(thousands) + ' thousand '; num %= 1000; }
    const hundreds = Math.floor(num / 100);
    if (hundreds > 0) { str += inWords(hundreds) + ' hundred '; num %= 100; }
    if (num > 0) { str += inWords(num); }
    return str.trim().replace(/\s+/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function f2(n: number) {
    return (Number(n) || 0).toFixed(2);
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
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    if (!invoice || !items) {
        notFound();
    }

    const subtotal = items.reduce((acc, item) => acc + (item.netWeight * item.rate) + item.making, 0);
    const totalBeforeTax = subtotal - invoice.discount;
    // Use new sgst/cgst fields, fallback to tax/2 for backward compatibility
    const cgstRate = invoice.cgst ?? ((invoice.tax || 0) / 2);
    const sgstRate = invoice.sgst ?? ((invoice.tax || 0) / 2);
    const cgst = totalBeforeTax * (cgstRate / 100);
    const sgst = totalBeforeTax * (sgstRate / 100);
    const totalAmount = totalBeforeTax + cgst + sgst;
    const roundOff = Math.round(totalAmount) - totalAmount;
    const finalAmount = Math.round(totalAmount);

    return (
        <>
            <div className="watermark"><img src={shop.logoUrl} alt="Watermark" /></div>
            <div className="header">
                <div className="logo-section">
                    <div className="shop-info">
                        <div className="shop-name">{shop.name}</div>
                        <div className="shop-details" style={{ fontSize: 12 }}>
                            <div style={{ color: '#333', marginBottom: 4 }}>{shop.address}</div>
                            {(shop.phone || shop.email) && (
                                <>
                                    <div style={{ color: '#333', marginBottom: 4 }}>
                                        {shop.phone && (<><strong>Phone:</strong> {shop.phone}</>)}
                                    </div>
                                    <div style={{ color: '#333' }}>
                                        {shop.email && (<><strong>Email:</strong> {shop.email}</>)}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="invoice-info">
                    <div className="invoice-title">TAX INVOICE</div>
                    <div><strong>Invoice No:</strong> {invoice.invoiceNumber}</div>
                    <div><strong>GSTIN:</strong> {shop.gstin}</div>
                    <div><strong>PAN:</strong> {shop.pan}</div>
                    <div><strong>Date:</strong> {format(new Date(invoice.invoiceDate), 'dd MMM, yyyy')}</div>
                </div>
            </div>

            <div style={{ borderTop: '1px solid #d1d5db', marginTop: 20 }}></div>
            <div style={{ borderBottom: '2px solid #d1d5db', margin: '5px 0', padding: '15px 0' }}>
                <div style={{ fontWeight: 700, textTransform: 'uppercase' as const, fontSize: 15, letterSpacing: '.04em', marginBottom: 12 }}>Buyer Details</div>
                <div style={{ fontSize: 14, marginBottom: 4 }}><strong>{invoice.customerName}</strong></div>
                {invoice.customerAddress && (
                    <div style={{ color: '#333', marginBottom: 4 }}>{invoice.customerAddress}</div>
                )}
                {invoice.customerPhone && (
                    <div style={{ color: '#333' }}>Phone: {invoice.customerPhone}</div>
                )}
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
                            <td className="right">{f2(item.grossWeight)}</td>
                            <td className="right">{f2(item.netWeight)}</td>
                            <td className="right">₹ {f2(item.rate)}</td>
                            <td className="right">₹ {f2(item.making)}</td>
                            <td className="right">₹ {f2((item.netWeight * item.rate) + item.making)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <table className="totals">
                <tbody>
                    <tr><td className="right">Subtotal:</td><td className="right">₹ {f2(subtotal)}</td></tr>
                    <tr><td className="right">CGST ({f2(cgstRate)}%):</td><td className="right">₹ {f2(cgst)}</td></tr>
                    <tr><td className="right">SGST ({f2(sgstRate)}%):</td><td className="right">₹ {f2(sgst)}</td></tr>
                    <tr><td className="right">Round Off:</td><td className="right">₹ {f2(roundOff)}</td></tr>
                    <tr><td className="right grand">Grand Total:</td><td className="right grand">₹ {f2(finalAmount)}</td></tr>
                </tbody>
            </table>

            <div style={{ marginTop: 20, padding: '15px 0', borderTop: '1px solid #d1d5db', borderBottom: '1px solid #d1d5db' }}>
                <div style={{ fontSize: 12 }}>
                    <strong>Amount in Words:</strong>{' '}
                    <span style={{ color: '#333' }}>{toWords(finalAmount)} Rupees Only</span>
                </div>
            </div>

            <div className="footer" style={{ marginTop: 25, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ color: '#666666' }}>Thank you for your business!</div>
                <div className="signature-section">
                    <div><strong>FOR {shop.name}</strong></div>
                    <div style={{ marginTop: 40, borderTop: '1px solid #d1d5db', width: 200, marginLeft: 'auto', paddingTop: 8 }}>
                        Authorized Signatory
                    </div>
                </div>
            </div>
        </>
    );
}
