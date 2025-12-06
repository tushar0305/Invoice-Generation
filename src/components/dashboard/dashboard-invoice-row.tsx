'use client';

import Link from 'next/link';
import { formatCurrency, cn } from '@/lib/utils';
import { FileText, Download, Share2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface DashboardInvoiceRowProps {
    invoice: any;
    shopId: string;
}

export function DashboardInvoiceRow({ invoice, shopId }: DashboardInvoiceRowProps) {
    const handleShare = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const text = `Invoice #${invoice.invoice_number} for ${formatCurrency(invoice.grand_total)} from Swarnavyaar.`;
        const url = `${window.location.origin}/share/invoice/${invoice.id}`;

        if (navigator.share) {
            navigator.share({
                title: 'Invoice Share',
                text: text,
                url: url
            }).catch(console.error);
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(`${text} ${url}`);
            toast({
                title: "Link Copied",
                description: "Invoice link copied to clipboard",
            });
        }
    };

    const handleDownload = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Mock download - in real app would trigger PDF generation
        toast({
            title: "Downloading Invoice...",
            description: `Invoice #${invoice.invoice_number} download started.`,
        });
        // You could window.open an API route here
    };

    return (
        <Link
            href={`/shop/${shopId}/invoices/view?id=${invoice.id}`}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-gray-100 dark:hover:border-white/10 group"
        >
            <div className="flex items-center gap-3">
                <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-xs shadow-sm",
                    invoice.status === 'paid'
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20"
                )}>
                    <FileText className="h-3.5 w-3.5" />
                </div>
                <div>
                    <p className="font-medium text-xs text-foreground group-hover:text-primary transition-colors">{invoice.customer_name}</p>
                    <p className="text-[10px] text-muted-foreground">{invoice.invoice_number}</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
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

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
