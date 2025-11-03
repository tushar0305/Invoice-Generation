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
    logo_url: '/logo.png' // Assuming you have a logo in the public folder
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
        <>
            <style jsx global>{`
              @page { size: A4; margin: 15mm; }
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; color: #111111; line-height: 1.5; position: relative; }
              .watermark { position: fixed; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; opacity: 0.08; z-index: 0; pointer-events: none; overflow: hidden; }
              .watermark img { width: auto; height: 750px; filter: grayscale(100%) contrast(80%); }
              .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 12px; position: relative; z-index: 1; }
              .logo-section { min-width: 60%; padding-right: 20px; }
              .shop-name { font-size: 22px; font-weight: 800; color: #111111; margin-bottom: 2px; letter-spacing: 0.3px; text-transform: uppercase; }
              .shop-details { margin-top: 2px; font-size: 12px; }
              .muted { color: #444444; font-size: 10px; }
              .invoice-info { text-align: right; }
              .invoice-info div { margin-bottom: 4px; }
              .invoice-title { font-size: 22px; font-weight: 800; color: #111111; margin-bottom: 6px; text-transform: uppercase; }
              table { width: 100%; border-collapse: collapse; margin-top: 12px; }
              th, td { border: 1px solid #d1d5db; padding: 10px 8px; text-align: left; }
              th { background: #f3f4f6; font-weight: 700; color: #111111; font-size: 10px; text-transform: uppercase; }
              td { font-size: 10px; color: #111111; }
              .right { text-align: right; }
              .totals { width: 45%; margin-left: auto; margin-top: 15px; }
              .totals td { border: none; padding: 6px 8px; }
              .totals tr.grand-total td { border-top: 2px solid #111111; padding-top: 10px; }
              .grand { font-size: 16px; font-weight: 800; color: #111111; }
              .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #d1d5db; display: flex; justify-content: space-between; font-size: 10px; color: #444444; }
              .signature-section { text-align: right; }
            `}</style>
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
        </>
    );
}
