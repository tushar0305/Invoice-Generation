'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, RotateCcw, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { restoreInvoice, getDeletedInvoices } from '@/services/invoices';
import { formatCurrency } from '@/lib/utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeletedInvoice {
    id: string;
    invoice_number: string;
    grand_total: number;
    customer_name: string;
    deleted_at: string;
    deleted_by_email: string;
}

interface TrashClientProps {
    shopId: string;
}

export function TrashClient({ shopId }: TrashClientProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [invoices, setInvoices] = useState<DeletedInvoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRestoring, setIsRestoring] = useState<string | null>(null);
    const [confirmRestore, setConfirmRestore] = useState<DeletedInvoice | null>(null);

    useEffect(() => {
        loadDeletedInvoices();
    }, [shopId]);

    const loadDeletedInvoices = async () => {
        setIsLoading(true);
        try {
            const data = await getDeletedInvoices(shopId);
            setInvoices(data || []);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to load deleted invoices',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async (invoice: DeletedInvoice) => {
        setIsRestoring(invoice.id);
        try {
            await restoreInvoice(invoice.id);
            toast({
                title: 'Invoice Restored',
                description: `Invoice #${invoice.invoice_number} has been restored.`,
            });
            // Remove from list
            setInvoices(prev => prev.filter(i => i.id !== invoice.id));
            setConfirmRestore(null);
        } catch (error: any) {
            toast({
                title: 'Restore Failed',
                description: error.message || 'Failed to restore invoice',
                variant: 'destructive',
            });
        } finally {
            setIsRestoring(null);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="container mx-auto px-4 py-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Trash2 className="h-6 w-6 text-muted-foreground" />
                        Deleted Invoices
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Invoices are kept for 90 days before permanent deletion
                    </p>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            )}

            {/* Empty State */}
            {!isLoading && invoices.length === 0 && (
                <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                        <Trash2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="font-semibold text-lg mb-2">Trash is empty</h3>
                        <p className="text-muted-foreground">
                            Deleted invoices will appear here for 90 days before being permanently removed.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Invoice List */}
            {!isLoading && invoices.length > 0 && (
                <div className="space-y-3">
                    {invoices.map((invoice) => (
                        <Card key={invoice.id} className="hover:shadow-sm transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono font-bold">
                                                #{invoice.invoice_number}
                                            </span>
                                            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                                                Deleted
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {invoice.customer_name || 'Walk-in Customer'}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Deleted {formatDate(invoice.deleted_at)}
                                            {invoice.deleted_by_email && ` by ${invoice.deleted_by_email}`}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-lg">
                                            {formatCurrency(invoice.grand_total)}
                                        </p>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="mt-2 gap-2"
                                            disabled={isRestoring === invoice.id}
                                            onClick={() => setConfirmRestore(invoice)}
                                        >
                                            {isRestoring === invoice.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <RotateCcw className="h-4 w-4" />
                                            )}
                                            Restore
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Confirm Restore Dialog */}
            <AlertDialog open={!!confirmRestore} onOpenChange={() => setConfirmRestore(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Restore Invoice?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <p>This will restore invoice <strong>#{confirmRestore?.invoice_number}</strong>.</p>
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3 flex gap-2">
                                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                                <p className="text-sm text-amber-800">
                                    If any items from this invoice have been sold on other invoices, the restore will fail.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => confirmRestore && handleRestore(confirmRestore)}>
                            Restore Invoice
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
