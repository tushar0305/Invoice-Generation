'use client';

import Link from 'next/link';
import { formatCurrency, cn } from '@/lib/utils';
import { FileText, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { shareInvoice } from '@/lib/share';
import { supabase } from '@/supabase/client';
import { generateInvoicePdf } from '@/lib/pdf';
import type { Invoice, InvoiceItem } from '@/lib/definitions';

interface DashboardInvoiceRowProps {
    invoice: any;
    shopId: string;
}

export function DashboardInvoiceRow({ invoice, shopId }: DashboardInvoiceRowProps) {
    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const result = await shareInvoice(invoice);

        // Only show toast on success
        if (result.success && result.message) {
            toast({
                title: "Success",
                description: result.message,
            });
        }
        // Don't show error if aborted by user
        else if (!result.success && !(result as any).aborted) {
            toast({
                title: "Share Failed",
                description: "Could not share invoice.",
                variant: 'destructive',
            });
        }
    };

    const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            toast({ title: "Generating PDF...", description: "Please wait..." });

            // 1. Fetch Items & Settings
            const [itemsResult, shopResult] = await Promise.all([
                supabase.from('invoice_items').select('*').eq('invoice_id', invoice.id).order('id'),
                supabase.from('shops').select('*').eq('id', shopId).single()
            ]);

            if (itemsResult.error) throw itemsResult.error;

            const items: InvoiceItem[] = (itemsResult.data || []).map((r: any) => ({
                id: r.id,
                description: r.description,
                purity: r.purity,
                grossWeight: Number(r.gross_weight) || 0,
                netWeight: Number(r.net_weight) || 0,
                stoneWeight: Number(r.stone_weight) || 0,
                stoneAmount: Number(r.stone_amount) || 0,
                wastagePercent: Number(r.wastage_percent) || 0,
                rate: Number(r.rate) || 0,
                makingRate: Number(r.making_rate) || 0,
                making: Number(r.making) || 0,
            }));

            const shopDetails = shopResult.data;
            const settings = shopDetails ? {
                id: shopDetails.id,
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
                templateId: shopDetails.template_id || 'classic',
            } : undefined;

            // Ensure invoice matches type
            const invoiceTyped: Invoice = {
                ...invoice,
                shopId: shopId,
                invoiceDate: invoice.invoice_date || invoice.invoiceDate, // Handle both snake/camel
                invoiceNumber: invoice.invoice_number || invoice.invoiceNumber,
                customerSnapshot: invoice.customer_snapshot || invoice.customerSnapshot,
                grandTotal: Number(invoice.grand_total || invoice.grandTotal),
                discount: Number(invoice.discount || 0),
                cgstAmount: Number(invoice.cgst_amount || 0),
                sgstAmount: Number(invoice.sgst_amount || 0),
            };

            const pdfBlob = await generateInvoicePdf({ invoice: invoiceTyped, items, settings });

            // Download
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Invoice-${invoiceTyped.invoiceNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast({ title: "Downloaded", description: "Invoice PDF saved successfully." });

        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error(error);
            }
            toast({ variant: "destructive", title: "Error", description: "Failed to download invoice." });
        }
    };

    return (
        <Link
            href={`/shop/${shopId}/invoices/view?id=${invoice.id}`}
            className="grid grid-cols-[1fr_auto] md:grid-cols-[1.5fr_1fr_1fr] items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-all duration-200 border border-transparent hover:border-border group"
        >
            <div className="flex items-center gap-3 min-w-0">
                <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-xs shadow-sm shrink-0",
                    invoice.status === 'paid'
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20"
                )}>
                    <FileText className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-medium text-xs text-foreground group-hover:text-primary transition-colors truncate">{invoice.customer_name}</p>
                    <p className="text-[10px] text-muted-foreground">{invoice.invoice_number}</p>
                </div>
            </div>

            {/* Desktop: Date & Details */}
            <div className="hidden md:flex flex-col items-center justify-center">
                <p className="text-xs font-medium text-foreground">
                    {new Date(invoice.created_at || invoice.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <p className="text-[10px] text-muted-foreground">
                    {new Date(invoice.created_at || invoice.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>

            <div className="flex items-center justify-end gap-3">
                <div className="text-right">
                    <p className="font-semibold text-xs text-foreground glow-text-sm">{formatCurrency(invoice.grand_total)}</p>
                    <span className={cn(
                        "text-[9px] capitalize font-medium px-1.5 py-0.5 rounded-full inline-block mt-0.5",
                        invoice.status === 'paid'
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-500"
                    )}>
                        {invoice.status}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={handleDownload}>
                        <Download className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={handleShare}>
                        <Share2 className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                    </Button>
                </div>
            </div>
        </Link>
    );
}
