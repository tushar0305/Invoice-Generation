'use client';

import { useTransition, useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound, useRouter, useParams, useSearchParams } from 'next/navigation';
import type { Invoice, InvoiceItem } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Loader2, Printer, Edit, ArrowLeft, CheckCircle, Clock, Send, Share2, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import { useUser } from '@/supabase/provider';
import { shareInvoice } from '@/lib/share';
import { generateInvoicePdf } from '@/lib/pdf';
// import type { UserSettings } from '@/lib/definitions';

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

export function ViewInvoiceClient() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id') as string;
    const params = useParams(); // Keep for compatibility
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const { toast } = useToast();
    const { user } = useUser();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [items, setItems] = useState<InvoiceItem[] | null>(null);
    const [settings, setSettings] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            const { data: inv, error: invErr } = await supabase
                .from('invoices')
                .select('*')
                .eq('id', id)
                .single();
            if (invErr) { setInvoice(null); setItems(null); setLoading(false); return; }

            // Fetch shop details using the shop_id from the invoice
            const { data: shopDetails, error: shopErr } = await supabase
                .from('shops')
                .select('*')
                .eq('id', inv.shop_id)
                .single();

            if (!shopErr && shopDetails) {
                setSettings({
                    id: shopDetails.id, // Use shop ID
                    shopId: inv.shop_id,
                    cgstRate: Number(shopDetails.cgst_rate) || 0,
                    sgstRate: Number(shopDetails.sgst_rate) || 0,
                    shopName: shopDetails.shop_name || 'Jewellers Store',
                    gstNumber: shopDetails.gst_number || '',
                    panNumber: shopDetails.pan_number || '',
                    address: shopDetails.address || '',
                    state: shopDetails.state || '',
                    pincode: shopDetails.pincode || '',
                    phoneNumber: shopDetails.phone_number || '',
                    email: shopDetails.email || '',
                    templateId: shopDetails.template_id || 'classic', // Add templateId
                } as any);
            } else {
                // Fallback or default if shop fetch fails
                setSettings(null);
            }

            const mappedInv: Invoice = {
                id: inv.id,
                shopId: inv.shop_id,
                invoiceNumber: inv.invoice_number,
                customerId: inv.customer_id,
                customerSnapshot: inv.customer_snapshot,
                invoiceDate: inv.invoice_date,
                status: inv.status,
                subtotal: Number(inv.subtotal) || 0,
                discount: Number(inv.discount) || 0,
                cgstAmount: Number(inv.cgst_amount) || 0,
                sgstAmount: Number(inv.sgst_amount) || 0,
                grandTotal: Number(inv.grand_total) || 0,
                notes: inv.notes,
                createdByName: inv.created_by_name,
                createdBy: inv.created_by,
                createdAt: inv.created_at,
                updatedAt: inv.updated_at,
            };
            const { data: its, error: itErr } = await supabase
                .from('invoice_items')
                .select('*')
                .eq('invoice_id', id)
                .order('id');
            if (itErr) { setInvoice(mappedInv); setItems([]); setLoading(false); return; }
            const mappedItems: InvoiceItem[] = (its ?? []).map((r: any) => ({
                id: r.id,
                description: r.description,
                purity: r.purity,
                grossWeight: Number(r.gross_weight) || 0,
                netWeight: Number(r.net_weight) || 0,
                rate: Number(r.rate) || 0,
                making: Number(r.making) || 0,
            }));
            if (!cancelled) {
                setInvoice(mappedInv);
                setItems(mappedItems);
                setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [id]);

    const handleStatusChange = (status: 'paid' | 'due') => {
        if (!invoice) return;

        startTransition(async () => {
            try {
                const { error } = await supabase
                    .from('invoices')
                    .update({ status })
                    .eq('id', invoice.id)

                if (error) throw error;

                // Update local state to reflect the change immediately
                setInvoice({ ...invoice, status });

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

    // ... existing imports

    const handleDownloadPdf = async () => {
        if (!invoice || !items) return;
        try {
            const pdfBlob = await generateInvoicePdf({
                invoice,
                items,
                settings: settings || undefined,
            });

            // Web: Standard download
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Invoice-${invoice.invoiceNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to generate PDF.',
            });
        }
    };

    const handlePrintPdf = async () => {
        if (!invoice || !items) return;

        try {
            const pdfBlob = await generateInvoicePdf({
                invoice,
                items,
                settings: settings || undefined,
            });
            const url = URL.createObjectURL(pdfBlob);

            // Try iframe print first (better UX on desktop)
            try {
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.src = url;
                document.body.appendChild(iframe);
                iframe.onload = () => {
                    try {
                        iframe.contentWindow?.print();
                    } catch (e) {
                        console.warn('Iframe print failed, falling back to new tab', e);
                        window.open(url, '_blank');
                    }
                    setTimeout(() => {
                        document.body.removeChild(iframe);
                        URL.revokeObjectURL(url);
                    }, 60000);
                };
            } catch (e) {
                console.warn('Iframe creation failed, falling back to new tab', e);
                window.open(url, '_blank');
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to generate PDF.',
            });
        }
    };

    const isLoading = loading;

    if (isLoading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!invoice) {
        notFound();
    }

    const { subtotal, sgstAmount, cgstAmount, taxAmount, grandTotal } = (() => {
        const subtotal = (items || []).reduce((acc, item) => acc + (item.netWeight * item.rate) + (item.netWeight * item.making), 0);
        const totalBeforeTax = subtotal - invoice.discount;
        const sgstRate = settings?.sgstRate || 0; // Use settings for rates
        const cgstRate = settings?.cgstRate || 0; // Use settings for rates
        const sgstAmount = totalBeforeTax * (sgstRate / 100);
        const cgstAmount = totalBeforeTax * (cgstRate / 100);
        const taxAmount = sgstAmount + cgstAmount;
        const grandTotal = invoice.grandTotal;
        return { subtotal, sgstAmount, cgstAmount, taxAmount, grandTotal };
    })();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/invoices')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Invoices
                </Button>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        onClick={async () => {
                            if (!invoice) return;
                            await shareInvoice(invoice);
                        }}
                    >
                        <Send className="mr-2 h-4 w-4" /> Share
                    </Button>
                    {invoice.status === 'due' ? (
                        <Button onClick={() => handleStatusChange('paid')} disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                            Mark as Paid
                        </Button>
                    ) : (
                        <Button variant="outline" onClick={() => handleStatusChange('due')} disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock className="mr-2 h-4 w-4" />}
                            Mark as Due
                        </Button>
                    )}
                    <Button asChild>
                        <Link href={`/dashboard/invoices/edit?id=${invoice.id}`}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </Link>
                    </Button>
                    <Button variant="outline" onClick={handlePrintPdf}>
                        <Printer className="mr-2 h-4 w-4" /> Print
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
                                <p className="font-bold text-lg">{invoice.customerSnapshot?.name || 'Unknown'}</p>
                                <p className="text-muted-foreground whitespace-pre-wrap">{invoice.customerSnapshot?.address || ''}</p>
                                <p className="text-muted-foreground">
                                    {[invoice.customerSnapshot?.state, invoice.customerSnapshot?.pincode].filter(Boolean).join(', ')}
                                </p>
                                {/* Phone number with icon */}
                                {invoice.customerSnapshot?.phone && (
                                    <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                                        <Phone className="h-3 w-3" />
                                        <span>{invoice.customerSnapshot.phone}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex sm:justify-end items-start">
                                <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className={`text-lg px-4 py-1 rounded-full ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {invoice.status.toUpperCase()}
                                </Badge>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <Table className="table-modern">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-2/5 min-w-[200px]">Item Description</TableHead>
                                        <TableHead className="text-center min-w-[80px]">Net Wt.</TableHead>
                                        <TableHead className="text-right min-w-[100px]">Rate</TableHead>
                                        <TableHead className="text-right min-w-[100px]">Making</TableHead>
                                        <TableHead className="text-right min-w-[120px]">Amount</TableHead>
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
                        </div>

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
                                    <span className="font-semibold text-muted-foreground">SGST ({settings?.sgstRate || 0}%):</span>
                                    <span>{formatCurrency(sgstAmount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold text-muted-foreground">CGST ({settings?.cgstRate || 0}%):</span>
                                    <span>{formatCurrency(cgstAmount)}</span>
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
                            {invoice.createdByName && (
                                <p className="mt-2 text-xs text-muted-foreground">Created by: {invoice.createdByName}</p>
                            )}
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
