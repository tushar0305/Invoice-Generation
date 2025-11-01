'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { getInvoiceById } from '@/lib/data';
import type { Invoice } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Loader2, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

function PrintButton() {
    return (
        <Button onClick={() => window.print()} className="bg-primary hover:bg-primary/90">
            <Printer className="mr-2 h-4 w-4" />
            Print Invoice
        </Button>
    );
}

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


export default function PrintInvoicePage({ params }: { params: { id: string } }) {
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getInvoiceById(params.id).then(data => {
            if (data) {
                setInvoice(data);
            }
            setLoading(false);
        });
    }, [params.id]);

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!invoice) {
        notFound();
    }
    
    const { subtotal, taxAmount, grandTotal } = (() => {
        const subtotal = invoice.items.reduce((acc, item) => acc + (item.weight * item.rate) + item.makingCharges, 0);
        const subtotalAfterDiscount = subtotal - invoice.discount;
        const taxAmount = subtotalAfterDiscount * (invoice.tax / 100);
        const grandTotal = subtotalAfterDiscount + taxAmount;
        return { subtotal, subtotalAfterDiscount, taxAmount, grandTotal };
    })();


    return (
        <div className="p-4 sm:p-8">
            <div className="fixed top-4 right-4 print:hidden">
                <PrintButton />
            </div>
            <div className="w-full max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-lg print:shadow-none">
                <header className="flex justify-between items-start border-b-2 border-primary pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-primary font-headline">Saambh Jewellers</h1>
                        <p className="text-sm">123 Royal Plaza, Jaipur, Rajasthan 302001</p>
                        <p className="text-sm">GSTIN: 08AABCJ1234D1Z5</p>
                    </div>
                    <h2 className="text-4xl font-bold text-gray-700 tracking-wider">INVOICE</h2>
                </header>

                <section className="grid grid-cols-2 gap-8 mt-6">
                    <div>
                        <h3 className="font-semibold text-gray-600">Bill To:</h3>
                        <p className="font-bold text-lg">{invoice.customerName}</p>
                        <p>{invoice.customerAddress}</p>
                        <p>{invoice.customerPhone}</p>
                    </div>
                    <div className="text-right">
                        <p><span className="font-semibold">Invoice #:</span> {invoice.invoiceNumber}</p>
                        <p><span className="font-semibold">Date:</span> {format(new Date(invoice.invoiceDate), 'dd MMM, yyyy')}</p>
                    </div>
                </section>
                
                <section className="mt-8">
                    <table className="w-full text-left">
                        <thead className="bg-muted">
                            <tr>
                                <th className="p-3 font-semibold">Item Description</th>
                                <th className="p-3 font-semibold text-center">Weight</th>
                                <th className="p-3 font-semibold text-right">Rate</th>
                                <th className="p-3 font-semibold text-right">Making</th>
                                <th className="p-3 font-semibold text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map(item => (
                                <tr key={item.id} className="border-b">
                                    <td className="p-3">{item.description}</td>
                                    <td className="p-3 text-center">{item.weight}</td>
                                    <td className="p-3 text-right">{formatCurrency(item.rate)}</td>
                                    <td className="p-3 text-right">{formatCurrency(item.makingCharges)}</td>
                                    <td className="p-3 text-right">{formatCurrency((item.weight * item.rate) + item.makingCharges)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <section className="mt-8 flex justify-end">
                    <div className="w-full max-w-sm space-y-3">
                        <div className="flex justify-between">
                            <span className="font-semibold">Subtotal:</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">Discount:</span>
                            <span>- {formatCurrency(invoice.discount)}</span>
                        </div>
                         <Separator />
                        <div className="flex justify-between">
                            <span className="font-semibold">Total before Tax:</span>
                            <span>{formatCurrency(subtotal - invoice.discount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">GST ({invoice.tax}%):</span>
                            <span>+ {formatCurrency(taxAmount)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-xl font-bold text-primary">
                            <span>Grand Total:</span>
                            <span>{formatCurrency(grandTotal)}</span>
                        </div>
                    </div>
                </section>

                <section className="mt-8 text-sm">
                    <p className="font-semibold">Amount in words:</p>
                    <p className="text-gray-700">{toWords(Math.round(grandTotal))} Rupees Only</p>
                </section>

                <footer className="mt-12 border-t pt-8 text-center text-xs text-gray-500">
                    <p>Thank you for your business!</p>
                    <p className="mt-4">This is a computer-generated invoice.</p>
                </footer>
            </div>
        </div>
    );
}
