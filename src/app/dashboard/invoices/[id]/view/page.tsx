"use client";

import { useTransition, useEffect } from 'react';
import Link from 'next/link';
import { notFound, useRouter, useParams, useSearchParams } from 'next/navigation';
import type { Invoice, InvoiceItem } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Loader2, Printer, Edit, ArrowLeft, CheckCircle, Clock, Send } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, getFirestore, updateDoc, collection } from 'firebase/firestore';
import { composeWhatsAppInvoiceMessage, openWhatsAppWithText, shareInvoicePdfById } from '@/lib/share';
import type { UserSettings } from '@/lib/definitions';


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
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const firestore = getFirestore();

    const invoiceRef = useMemoFirebase(() => doc(firestore, 'invoices', id), [firestore, id]);
    const { data: invoice, isLoading: loadingInvoice } = useDoc<Invoice>(invoiceRef);
    const settingsRef = useMemoFirebase(() => {
        if (!invoice) return null;
        return doc(firestore, 'userSettings', invoice.userId);
    }, [firestore, invoice]);
    const { data: settings } = useDoc<UserSettings>(settingsRef);

    const itemsRef = useMemoFirebase(() => collection(firestore, `invoices/${id}/invoiceItems`), [firestore, id]);
    const { data: items, isLoading: loadingItems } = useCollection<InvoiceItem>(itemsRef);
    
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
    
        const isLoading = loadingInvoice || loadingItems;

        // Auto-trigger print when arriving with ?print=1 once data is ready.
        // Keep hook unconditionally positioned before any early return to preserve hook order.
        useEffect(() => {
            if (!isLoading && invoice && items && searchParams?.get('print') === '1') {
                setTimeout(() => {
                    window.print();
                    // Clean URL so back/refresh doesn't re-print
                    router.replace(`/dashboard/invoices/${id}/view`);
                }, 300);
            }
        }, [isLoading, invoice, items, searchParams, router, id]);

        // Tweak document title during print to minimize header content if headers/footers are enabled.
        // Keep this hook above any early returns to preserve hook order.
        useEffect(() => {
            if (!invoice) return;
            const originalTitle = document.title;
            const before = () => {
                document.title = `Invoice ${invoice.invoiceNumber}`;
            };
            const after = () => {
                document.title = originalTitle;
            };
            window.addEventListener('beforeprint', before);
            window.addEventListener('afterprint', after);
            return () => {
                window.removeEventListener('beforeprint', before);
                window.removeEventListener('afterprint', after);
                document.title = originalTitle;
            };
        }, [invoice]);

        if (isLoading) {
                return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
        }

    if (!invoice) {
        notFound();
    }
    
        const { subtotal, sgstAmount, cgstAmount, taxAmount, grandTotal } = (() => {
            const subtotal = (items || []).reduce((acc, item) => acc + (item.netWeight * item.rate) + (item.netWeight * item.making), 0);
        const totalBeforeTax = subtotal - invoice.discount;
        const sgstRate = invoice.sgst ?? ((invoice.tax || 0) / 2);
        const cgstRate = invoice.cgst ?? ((invoice.tax || 0) / 2);
        const sgstAmount = totalBeforeTax * (sgstRate / 100);
        const cgstAmount = totalBeforeTax * (cgstRate / 100);
        const taxAmount = sgstAmount + cgstAmount;
        const grandTotal = invoice.grandTotal;
        return { subtotal, sgstAmount, cgstAmount, taxAmount, grandTotal };
    })();

            

    return (
        <div className="space-y-6">
            <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/invoices')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Invoices
                </Button>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                        <Button
                                            variant="outline"
                                                                    onClick={async () => {
                                                                        if (!invoice) return;
                                                                        // Share an exact PDF captured from the print layout via iframe
                                                                        const ok = await shareInvoicePdfById(invoice.id, invoice, settings || undefined);
                                                if (!ok) {
                                                    // Fallback already opened WhatsApp with text; let the user know
                                                    toast({
                                                        title: 'Sharing fallback used',
                                                        description: 'Your device/browser does not support sharing files directly. Opened WhatsApp with a text summary instead.',
                                                    });
                                                }
                                            }}
                                        >
                                                <Send className="mr-2 h-4 w-4" /> Share
                                        </Button>
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
                    <Button asChild variant="outline">
                        <Link href={`/dashboard/invoices/${invoice.id}/print`}>
                            <Printer className="mr-2 h-4 w-4" /> Print
                        </Link>
                    </Button>
                </div>
            </div>
            
            <div id="print-area">
            <Card>
                <CardHeader>
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                            <div>
                                                <CardTitle className="text-3xl font-bold text-primary font-headline">{settings?.shopName || 'Jewellers Store'}</CardTitle>
                                                                                                                                                <p className="text-sm text-muted-foreground">{settings?.address || 'Address Not Set'}</p>
                                                                                                                                                {settings?.state && (
                                                                                                                                                    <p className="text-sm text-muted-foreground">{settings.state}</p>
                                                                                                                                                )}
                                                                                                                                                {settings?.pincode && (
                                                                                                                                                    <p className="text-sm text-muted-foreground">{settings.pincode}</p>
                                                                                                                                                )}
                                                                                                <div className="mt-1 text-xs text-muted-foreground space-y-1">
                                                    {settings?.phoneNumber && <div><strong>Phone:</strong> {settings.phoneNumber}</div>}
                                                    {(settings?.email || '') && <div><strong>Email:</strong> {settings?.email}</div>}
                                                </div>
                                            </div>
                                            <div className="text-left sm:text-right">
                                                <h2 className="text-2xl font-semibold">Invoice #{invoice.invoiceNumber}</h2>
                                                <p className="text-sm text-muted-foreground"><strong>GST:</strong> {settings?.gstNumber || 'GST Not Set'}</p>
                                                <p className="text-sm text-muted-foreground"><strong>PAN:</strong> {settings?.panNumber || 'PAN Not Set'}</p>
                                                <p className="text-sm text-muted-foreground"><strong>DATE:</strong> {format(new Date(invoice.invoiceDate), 'dd MMM, yyyy')}</p>
                                            </div>
                                        </div>
                </CardHeader>
                <CardContent>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="font-semibold text-gray-600 mb-1">Bill To:</h3>
                            <p className="font-bold text-lg">{invoice.customerName}</p>
                                                                                    <p className="text-muted-foreground">{invoice.customerAddress}</p>
                                                                                    {(invoice as any).customerState && (
                                                                                        <p className="text-muted-foreground">{(invoice as any).customerState}</p>
                                                                                    )}
                                                                                    {(invoice as any).customerPincode && (
                                                                                        <p className="text-muted-foreground">{(invoice as any).customerPincode}</p>
                                                                                    )}
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
                                <TableHead className="text-center">Net Wt.</TableHead>
                                <TableHead className="text-right">Rate</TableHead>
                                <TableHead className="text-right">Making</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items && items.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.description}</TableCell>
                                    <TableCell className="text-center">{item.netWeight}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.rate)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.netWeight * item.making)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency((item.netWeight * item.rate) + (item.netWeight * item.making))}</TableCell>
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
                                <span className="font-semibold text-muted-foreground">SGST ({invoice.sgst ?? ((invoice.tax || 0) / 2)}%):</span>
                                <span>+ {formatCurrency(sgstAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold text-muted-foreground">CGST ({invoice.cgst ?? ((invoice.tax || 0) / 2)}%):</span>
                                <span>+ {formatCurrency(cgstAmount)}</span>
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
                {/* Print styles to optimize the view for PDF/print without navigating */}
                <style jsx global>{`
                    @media print {
                      html, body {
                        background: #fff !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                      }
                      /* Hide everything except the print area */
                      body * { visibility: hidden !important; }
                      #print-area, #print-area * { visibility: visible !important; }
                      #print-area { position: absolute; left: 0; top: 0; width: 100%; }

                      /* Hide app chrome and overlays */
                      .no-print { display: none !important; }
                      [data-radix-portal], .radix-portal { display: none !important; }
                      header, nav, footer { display: none !important; }

                      /* Tidy visuals for print */
                      .shadow, .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl { box-shadow: none !important; }
                      .ring-1, .ring, .border { border-color: #ddd !important; }
                      table, tr, td, th { page-break-inside: avoid; }
                      a[href]::after { content: none !important; }

                      /* Page size and margins */
                      @page { size: A4; margin: 12mm; }
                    }
                `}</style>
                </div>
        );
}
