'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { notFound, useRouter, useParams } from 'next/navigation';
import type { Invoice } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Loader2, Printer, Edit, ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useMemoFirebase } from '@/firebase';
import { doc, getFirestore, updateDoc, collection, getDocs, writeBatch } from 'firebase/firestore';


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


export default function ViewInvoicePage() {
    const params = useParams();
    const id = params.id as string;
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const { toast } = useToast();
    const firestore = getFirestore();

    const invoiceRef = useMemoFirebase(() => doc(firestore, 'invoices', id), [firestore, id]);
    const { data: invoice, isLoading: loading } = useDoc<Invoice>(invoiceRef);
    
    const handleStatusChange = (status: 'paid' | 'due') => {
        if (!invoice) return;

        startTransition(async () => {
            try {
                await updateDoc(invoiceRef, { status });
                toast({
                    title: 'Status Updated',
                    description: `Invoice marked as ${status}.`,
                });
            } catch (error) {
                 toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to update invoice status.',
                });
            }
        });
    };

    if (loading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/invoices')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Invoices
                </Button>
                <div className="flex items-center gap-2">
                    {invoice.status === 'due' ? (
                        <Button onClick={() => handleStatusChange('paid')} disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4"/>}
                            Mark as Paid
                        </Button>
                    ) : (
                        <Button variant="secondary" onClick={() => handleStatusChange('due')} disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Clock className="mr-2 h-4 w-4"/>}
                             Mark as Due
                        </Button>
                    )}
                    <Button asChild>
                        <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                         <Link href={`/dashboard/invoices/${id}/print`} target="_blank">
                            <Printer className="mr-2 h-4 w-4" /> Print
                        </Link>
                    </Button>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <CardTitle className="text-3xl font-bold text-primary font-headline">Saambh Jewellers</CardTitle>
                            <p className="text-sm text-muted-foreground">123 Royal Plaza, Jaipur, Rajasthan 302001</p>
                        </div>
                        <div className="text-left sm:text-right">
                             <h2 className="text-2xl font-semibold">Invoice #{invoice.invoiceNumber}</h2>
                             <p className="text-sm text-muted-foreground">Date: {format(new Date(invoice.invoiceDate), 'dd MMM, yyyy')}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="font-semibold text-gray-600 mb-1">Bill To:</h3>
                            <p className="font-bold text-lg">{invoice.customerName}</p>
                            <p className="text-muted-foreground">{invoice.customerAddress}</p>
                            <p className="text-muted-foreground">{invoice.customerPhone}</p>
                        </div>
                        <div className="flex sm:justify-end items-start">
                             <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className={`text-lg px-4 py-1 rounded-full ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {invoice.status.toUpperCase()}
                            </Badge>
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-2/5">Item Description</TableHead>
                                <TableHead className="text-center">Weight</TableHead>
                                <TableHead className="text-right">Rate</TableHead>
                                <TableHead className="text-right">Making</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoice.items.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.description}</TableCell>
                                    <TableCell className="text-center">{item.weight}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.rate)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.makingCharges)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency((item.weight * item.rate) + item.makingCharges)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="mt-6 flex justify-end">
                        <div className="w-full max-w-sm space-y-3">
                            <div className="flex justify-between">
                                <span className="font-semibold text-muted-foreground">Subtotal:</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold text-muted-foreground">Discount:</span>
                                <span>- {formatCurrency(invoice.discount)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between">
                                <span className="font-semibold text-muted-foreground">Total before Tax:</span>
                                <span>{formatCurrency(subtotal - invoice.discount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold text-muted-foreground">GST ({invoice.tax}%):</span>
                                <span>+ {formatCurrency(taxAmount)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-xl font-bold text-primary">
                                <span>Grand Total:</span>
                                <span>{formatCurrency(grandTotal)}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
                 <CardFooter>
                     <div className="w-full text-sm text-muted-foreground">
                        <p className="font-semibold">Amount in words:</p>
                        <p>{toWords(Math.round(grandTotal))} Rupees Only</p>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
