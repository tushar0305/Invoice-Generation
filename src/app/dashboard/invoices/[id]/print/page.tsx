'use client';

import { useEffect, useRef } from 'react';
import { useParams, notFound } from 'next/navigation';
import type { Invoice, InvoiceItem } from '@/lib/definitions';
import { useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, getFirestore } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// A simple number to words converter for INR
function toWords(num: number): string {
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

    function inWords(n: number): string {
        if (n < 20) return a[n];
        let digit = n % 10;
        return b[Math.floor(n / 10)] + (digit ? '-' : '') + a[digit];
    }
    
    if (num === 0) return 'zero';
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
        str += inWords(num);
    }
    return str.trim().replace(/\s+/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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

    if (!invoice) {
        notFound();
    }
    
    const { subtotal, taxAmount, grandTotal } = (() => {
        const subtotal = (items || []).reduce((acc, item) => acc + (item.weight * item.rate) + item.makingCharges, 0);
        const subtotalAfterDiscount = subtotal - invoice.discount;
        const taxAmount = subtotalAfterDiscount * (invoice.tax / 100);
        const grandTotal = subtotalAfterDiscount + taxAmount;
        return { subtotal, taxAmount, grandTotal };
    })();

    return (
        <div className="bg-white p-8 font-serif">
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-start pb-6 border-b-2 border-gray-800">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 font-headline">Saambh Jewellers</h1>
                        <p className="text-sm text-gray-600">123 Royal Plaza, Jaipur, Rajasthan 302001</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-semibold">Invoice</h2>
                        <p className="text-sm text-gray-600 mt-1"><b>Invoice #:</b> {invoice.invoiceNumber}</p>
                        <p className="text-sm text-gray-600"><b>Date:</b> {format(new Date(invoice.invoiceDate), 'dd MMM, yyyy')}</p>
                    </div>
                </header>

                <section className="my-8 grid grid-cols-2 gap-8">
                     <div>
                        <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">Bill To:</h3>
                        <p className="font-bold text-lg">{invoice.customerName}</p>
                        <p className="text-gray-600">{invoice.customerAddress}</p>
                        <p className="text-gray-600">{invoice.customerPhone}</p>
                    </div>
                    <div className="flex justify-end items-start">
                         <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className={`text-base px-4 py-1 rounded-full ${invoice.status === 'paid' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-yellow-100 text-yellow-800 border-yellow-300'}`}>
                            {invoice.status.toUpperCase()}
                        </Badge>
                    </div>
                </section>

                <section>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-3 font-semibold text-sm border-b">Item Description</th>
                                <th className="p-3 font-semibold text-sm text-center border-b">Weight</th>
                                <th className="p-3 font-semibold text-sm text-right border-b">Rate</th>
                                <th className="p-3 font-semibold text-sm text-right border-b">Making Charges</th>
                                <th className="p-3 font-semibold text-sm text-right border-b">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items && items.map(item => (
                                <tr key={item.id} className="border-b">
                                    <td className="p-3">{item.description}</td>
                                    <td className="p-3 text-center">{item.weight}</td>
                                    <td className="p-3 text-right">{formatCurrency(item.rate)}</td>
                                    <td className="p-3 text-right">{formatCurrency(item.makingCharges)}</td>
                                    <td className="p-3 text-right font-medium">{formatCurrency((item.weight * item.rate) + item.makingCharges)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <section className="mt-8 flex justify-end">
                    <div className="w-full max-w-xs space-y-3">
                        <div className="flex justify-between">
                            <span className="font-semibold text-gray-600">Subtotal:</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold text-gray-600">Discount:</span>
                            <span>- {formatCurrency(invoice.discount)}</span>
                        </div>
                        <Separator className="bg-gray-300" />
                        <div className="flex justify-between">
                            <span className="font-semibold text-gray-600">Total before Tax:</span>
                            <span>{formatCurrency(subtotal - invoice.discount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold text-gray-600">GST ({invoice.tax}%):</span>
                            <span>+ {formatCurrency(taxAmount)}</span>
                        </div>
                        <Separator className="bg-gray-800" />
                        <div className="flex justify-between text-xl font-bold text-gray-900">
                            <span>Grand Total:</span>
                            <span>{formatCurrency(grandTotal)}</span>
                        </div>
                    </div>
                </section>

                <footer className="mt-12 pt-6 border-t">
                    <div className="text-sm text-gray-600">
                        <p className="font-semibold">Amount in words:</p>
                        <p>{toWords(Math.round(grandTotal))} Rupees Only</p>
                    </div>
                    <div className="mt-6 text-center text-xs text-gray-500">
                        <p>Thank you for your business!</p>
                        <p>Saambh Jewellers</p>
                    </div>
                </footer>
            </div>
        </div>
    );
}