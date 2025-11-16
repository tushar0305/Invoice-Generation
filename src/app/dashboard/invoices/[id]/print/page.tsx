'use client';

import { useEffect, useRef } from 'react';
import { useParams, notFound, useSearchParams } from 'next/navigation';
import type { Invoice, InvoiceItem, UserSettings } from '@/lib/definitions';
import { useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, getFirestore } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const DEFAULT_SHOP = {
    shopName: 'Jewellers Store',
    address: 'Address Not Set',
    gstNumber: 'GST Not Set',
    panNumber: 'PAN Not Set',
    phoneNumber: '',
    email: '',
    state: '',
    pincode: '',
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
    const search = useSearchParams();
    const firestore = getFirestore();
    const printTriggered = useRef(false);

    const invoiceRef = useMemoFirebase(() => doc(firestore, 'invoices', id), [firestore, id]);
    const { data: invoice, isLoading: loadingInvoice } = useDoc<Invoice>(invoiceRef);

    // Once we know the invoice owner, load user settings for dynamic shop profile.
    const settingsRef = useMemoFirebase(() => {
        if (!invoice?.userId) return null;
        return doc(firestore, 'userSettings', invoice.userId);
    }, [firestore, invoice?.userId]);
    const { data: settings, isLoading: loadingSettings } = useDoc<UserSettings>(settingsRef);
    const itemsRef = useMemoFirebase(() => collection(firestore, `invoices/${id}/invoiceItems`), [firestore, id]);
    const { data: items, isLoading: loadingItems } = useCollection<InvoiceItem>(itemsRef);

    const isLoading = loadingInvoice || loadingItems;

    useEffect(() => {
        if (!isLoading && invoice && items && !printTriggered.current) {
            // Skip auto print when embedding this page inside an iframe for PDF capture
            const isEmbed = search?.get('embed') === '1';
            if (isEmbed) return;
            printTriggered.current = true;
            setTimeout(() => window.print(), 500);
        }
    }, [isLoading, invoice, items, search]);

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    if (!invoice || !items) {
        notFound();
    }

    // Making charge now applied per net gram basis
    const subtotal = items.reduce((acc, item) => acc + (item.netWeight * item.rate) + (item.netWeight * item.making), 0);
    const totalBeforeTax = subtotal - invoice.discount;
    // Use new sgst/cgst fields, fallback to tax/2 for backward compatibility
    const cgstRate = invoice.cgst ?? ((invoice.tax || 0) / 2);
    const sgstRate = invoice.sgst ?? ((invoice.tax || 0) / 2);
    const cgst = totalBeforeTax * (cgstRate / 100);
    const sgst = totalBeforeTax * (sgstRate / 100);
    const totalAmount = totalBeforeTax + cgst + sgst;
    const roundOff = Math.round(totalAmount) - totalAmount;
    const finalAmount = Math.round(totalAmount);

    // Merge settings with defaults
    const shopProfile = {
        name: settings?.shopName || DEFAULT_SHOP.shopName,
        address: settings?.address || DEFAULT_SHOP.address,
        state: settings?.state || DEFAULT_SHOP.state,
        pincode: settings?.pincode || DEFAULT_SHOP.pincode,
        gst: settings?.gstNumber || DEFAULT_SHOP.gstNumber,
        pan: settings?.panNumber || DEFAULT_SHOP.panNumber,
        phone: settings?.phoneNumber || DEFAULT_SHOP.phoneNumber,
        email: settings?.email || DEFAULT_SHOP.email,
    };

    return (
        <div className="invoice-container">
            <div className="invoice-header">
                <div className="header-left">
                    <div className="shop-name">{shopProfile.name}</div>
                    <p>{shopProfile.address}</p>
                    {shopProfile.state && <p>{shopProfile.state} - {shopProfile.pincode}</p>}
                    {shopProfile.phone && <p><strong>Phone:</strong> {shopProfile.phone}</p>}
                    {shopProfile.email && <p><strong>Email:</strong> {shopProfile.email}</p>}
                </div>
                <div className="header-right">
                    <h2>TAX INVOICE</h2>
                    <p><strong>Invoice No:</strong> {invoice.invoiceNumber}</p>
                    <p><strong>Date:</strong> {format(new Date(invoice.invoiceDate), 'dd MMM, yyyy')}</p>
                    <p><strong>GSTIN:</strong> {shopProfile.gst}</p>
                    <p><strong>PAN:</strong> {shopProfile.pan}</p>
                </div>
            </div>

            <div className="separator"></div>

            <div className="customer-details">
                <h3>Bill To</h3>
                <p><strong>{invoice.customerName}</strong></p>
                {invoice.customerAddress && <p>{invoice.customerAddress}</p>}
                {(invoice as any).customerState && <p>{(invoice as any).customerState}</p>}
                {(invoice as any).customerPincode && <p>{(invoice as any).customerPincode}</p>}
                {invoice.customerPhone && <p><strong>Phone:</strong> {invoice.customerPhone}</p>}
            </div>

            <table className="items-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Description</th>
                        <th>Purity</th>
                        <th className="text-right">Gross Wt</th>
                        <th className="text-right">Net Wt</th>
                        <th className="text-right">Rate</th>
                        <th className="text-right">Making</th>
                        <th className="text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => {
                        const makingTotal = item.netWeight * item.making;
                        const lineTotal = (item.netWeight * item.rate) + makingTotal;
                        return (
                            <tr key={item.id}>
                                <td>{idx + 1}</td>
                                <td>{item.description}</td>
                                <td>{item.purity}</td>
                                <td className="text-right">{f2(item.grossWeight)}</td>
                                <td className="text-right">{f2(item.netWeight)}</td>
                                <td className="text-right">₹ {f2(item.rate)}</td>
                                <td className="text-right">₹ {f2(makingTotal)}</td>
                                <td className="text-right">₹ {f2(lineTotal)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div className="summary-section">
                <div className="summary-details">
                    <div className="summary-row">
                        <span>Subtotal:</span>
                        <span>₹ {f2(subtotal)}</span>
                    </div>
                    {invoice.discount > 0 && (
                        <div className="summary-row">
                            <span>Discount:</span>
                            <span>-₹ {f2(invoice.discount)}</span>
                        </div>
                    )}
                    <div className="summary-row">
                        <span>CGST ({f2(cgstRate)}%):</span>
                        <span>₹ {f2(cgst)}</span>
                    </div>
                    <div className="summary-row">
                        <span>SGST ({f2(sgstRate)}%):</span>
                        <span>₹ {f2(sgst)}</span>
                    </div>
                    {roundOff !== 0 && (
                        <div className="summary-row">
                            <span>Round Off:</span>
                            <span>₹ {f2(roundOff)}</span>
                        </div>
                    )}
                    <div className="summary-row grand-total">
                        <span>Grand Total:</span>
                        <span>₹ {f2(finalAmount)}</span>
                    </div>
                </div>
            </div>

            <div className="words-section">
                <p><strong>Amount in Words:</strong> {toWords(finalAmount)} Rupees Only</p>
            </div>

            <div className="invoice-footer">
                <div className="terms">
                    <h4>Terms & Conditions</h4>
                    <p>Thank you for shopping with us!</p>
                </div>
                <div className="signature">
                    <div className="signature-box"></div>
                    <p>Authorized Signatory</p>
                </div>
            </div>
        </div>
    );
}
