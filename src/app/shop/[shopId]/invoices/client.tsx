/**
 * Invoices Client Component
 * Handles all interactive UI for the invoices page
 */

'use client';

import { useState, useMemo, useTransition, useEffect, useOptimistic } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from '@/components/ui/table';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { haptics, ImpactStyle, NotificationType } from '@/lib/haptics';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, FilePlus2, Trash2, Loader2, Calendar as CalendarIcon, Download, RefreshCw, Share2, Scan, Banknote, Undo2 } from 'lucide-react';
import type { Invoice, InvoiceItem } from '@/lib/definitions';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/supabase/provider';
import { supabase } from '@/supabase/client';
import { format, startOfToday, endOfToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfDay, endOfDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { InvoiceMobileCard } from '@/components/dashboard/invoice-mobile-card';
import { useDebounce } from '@/hooks/use-debounce';
import { EmptyState } from '@/components/ui/empty-state';
import { Checkbox } from '@/components/ui/checkbox';

type InvoicesClientProps = {
    initialInvoices: Invoice[];
    shopId: string;
    initialStatus: string;
    initialSearch: string;
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        limit: number;
    };
};

export function InvoicesClient({
    initialInvoices,
    shopId,
    initialStatus,
    initialSearch,
    pagination
}: InvoicesClientProps) {
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [statusFilter, setStatusFilter] = useState(initialStatus);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [isExporting, setIsExporting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useUser();
    const [isDeleting, startDeleteTransition] = useTransition();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [isStatusUpdating, setIsStatusUpdating] = useState(false);
    const [invoiceToChangeStatus, setInvoiceToChangeStatus] = useState<{ id: string; currentStatus: string } | null>(null);
    const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
    const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

    const [optimisticInvoices, addOptimisticInvoice] = useOptimistic(
        initialInvoices,
        (state: Invoice[], action: { type: 'DELETE' | 'UPDATE_STATUS'; payload: any }) => {
            switch (action.type) {
                case 'DELETE':
                    return state.filter((inv) => inv.id !== action.payload.id);
                case 'UPDATE_STATUS':
                    return state.map((inv) =>
                        inv.id === action.payload.id ? { ...inv, status: action.payload.status } : inv
                    );
                default:
                    return state;
            }
        }
    );

    const handleDeleteConfirmation = (invoiceId: string) => {
        setInvoiceToDelete(invoiceId);
        setDialogOpen(true);
    };

    const executeDelete = () => {
        if (!invoiceToDelete) return;

        startDeleteTransition(async () => {
            try {
                const { error } = await supabase.from('invoices').delete().eq('id', invoiceToDelete);
                if (error) throw error;

                // Optimistic UI update
                addOptimisticInvoice({ type: 'DELETE', payload: { id: invoiceToDelete } });

                // Server re-fetch
                router.refresh();

                toast({
                    title: 'Invoice Deleted',
                    description: 'The invoice and its items have been successfully deleted.',
                });
            } catch (error) {
                console.error(error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to delete the invoice.',
                });
            } finally {
                setDialogOpen(false);
                setInvoiceToDelete(null);
            }
        });
    };

    const handleMarkPaid = async (id: string) => {
        const invoice = optimisticInvoices?.find(inv => inv.id === id);
        if (!invoice) return;

        setInvoiceToChangeStatus({ id, currentStatus: invoice.status });
        setStatusDialogOpen(true);
    };

    const confirmStatusChange = async () => {
        if (!invoiceToChangeStatus) return;
        setIsStatusUpdating(true);

        try {
            const currentStatus = invoiceToChangeStatus.currentStatus;
            const newStatus = currentStatus === 'paid' ? 'due' : 'paid';

            // Server Action for Status Update + Loyalty Sync
            const { updateInvoiceStatusAction } = await import('@/app/actions/invoice-actions');

            // Wrap in transition to support optimistic updates
            startDeleteTransition(async () => {
                const result = await updateInvoiceStatusAction(invoiceToChangeStatus.id, shopId, newStatus as 'paid' | 'due');
                if (!result.success) {
                    toast({ variant: 'destructive', title: 'Error', description: result.error });
                    // Revert optimistic update if failed (optional, usually page refresh handles it)
                    // Reverting effectively means re-fetching or triggering a reload
                    router.refresh();
                }
            });

            // Optimistic Update MUST be synchronous or inside the transition, but we can call it here separately first?
            // "An optimistic state update occurred outside a transition or action"
            // It MUST be inside the transition callback or triggered by an action.
            // Since we use `startDeleteTransition` (via useTransition), we can put it there.

            // Wait, `addOptimisticInvoice` should be called INSIDE `startDeleteTransition` callback?
            // Actually, useOptimistic doesn't NEED startTransition if run in an action, but here we are in a client event handler calling a server action.
            // The correct way is:
            startDeleteTransition(() => {
                addOptimisticInvoice({ type: 'UPDATE_STATUS', payload: { id: invoiceToChangeStatus.id, status: newStatus } });
            });

            // We can also fire the async action, but don't await it INSIDE the synchronous startTransition callback.
            // But we want the pending state...

            // Let's adhere to standard:
            /*
            startTransition(() => {
                addOptimisticInvoice(...);
                action().then(...);
            })
            */


            // Server re-fetch
            router.refresh();

            haptics.notification(NotificationType.Success);
            toast({
                title: 'Success',
                description: `Invoice marked as ${newStatus}`
            });
            setStatusDialogOpen(false);
            setInvoiceToChangeStatus(null);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update status'
            });
        } finally {
            setIsStatusUpdating(false);
        }
    };

    const handleShare = async (id: string) => {
        try {
            const inv = optimisticInvoices.find(i => i.id === id);
            if (!inv) return;
            const { shareInvoice } = await import('@/lib/share');
            await shareInvoice(inv);
        } catch (error) {
            console.error('Share failed', error);
            toast({ variant: 'destructive', title: 'Share Failed', description: 'Could not share invoice.' });
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            // We just need to trigger a router refresh to get the latest server data
            // The optimistic UI handles the immediate display
            router.refresh();

            haptics.impact(ImpactStyle.Light);
            setLastRefreshed(new Date());
            toast({
                title: 'Refreshed!',
                description: 'Invoice list updated successfully',
            });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Refresh Failed', description: 'Unable to refresh data' });
        } finally {
            setIsRefreshing(false);
        }
    };

    // Format relative time for last refresh
    const getRelativeTime = (date: Date | null) => {
        if (!date) return null;

        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 10) return 'just now';
        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    };

    // Debounced Search with Page Reset
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(window.location.search);
            if (searchTerm) {
                params.set('q', searchTerm);
                params.set('page', '1'); // Reset to page 1 on search
            } else {
                params.delete('q');
                // Keep page if just clearing search, or reset? Resetting is safer.
                params.set('page', '1');
            }
            router.push(`?${params.toString()}`);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, router]);

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Client-side filtering for search and date range (status filter already server-side)
    const filteredInvoices = useMemo(() => {
        let result = optimisticInvoices;

        // Search filter (client-side for instant feedback)
        const lower = debouncedSearchTerm.toLowerCase();
        if (lower) {
            result = result.filter(inv =>
                (inv.customerSnapshot?.name || '').toLowerCase().includes(lower) ||
                inv.invoiceNumber.toLowerCase().includes(lower)
            );
        }

        // Date Range Filter
        if (dateRange?.from) {
            // Create start and end dates for comparison
            const startDate = startOfDay(dateRange.from);
            const endDate = endOfDay(dateRange.to || dateRange.from);

            result = result.filter(inv => {
                const invDate = new Date(inv.invoiceDate);
                return invDate >= startDate && invDate <= endDate;
            });
        }

        return result;
    }, [optimisticInvoices, debouncedSearchTerm, dateRange]);

    // Batch Operations - Defined AFTER filteredInvoices
    const toggleSelectAll = () => {
        if (selectedInvoices.size === filteredInvoices.length) {
            setSelectedInvoices(new Set());
        } else {
            setSelectedInvoices(new Set(filteredInvoices.map(inv => inv.id)));
        }
    };

    const toggleSelectInvoice = (id: string) => {
        const newSelected = new Set(selectedInvoices);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedInvoices(newSelected);
    };

    const handleBatchDelete = () => {
        if (selectedInvoices.size === 0) return;
        setBatchDeleteDialogOpen(true);
    };

    const executeBatchDelete = () => {
        startDeleteTransition(async () => {
            try {
                const idsToDelete = Array.from(selectedInvoices);
                const { error } = await supabase.from('invoices').delete().in('id', idsToDelete);
                if (error) throw error;


                // Optimistic batch delete (approximation)
                idsToDelete.forEach(id => addOptimisticInvoice({ type: 'DELETE', payload: { id } }));
                router.refresh();
                setSelectedInvoices(new Set());

                toast({
                    title: 'Batch Delete Successful',
                    description: `Successfully deleted ${idsToDelete.length} invoices.`,
                });
            } catch (error) {
                console.error(error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to delete selected invoices.',
                });
            } finally {
                setBatchDeleteDialogOpen(false);
            }
        });
    };

    const applyPreset = (preset: 'today' | 'week' | 'month' | 'year' | 'all') => {
        switch (preset) {
            case 'today':
                setDateRange({ from: startOfToday(), to: endOfToday() });
                break;
            case 'week':
                setDateRange({ from: startOfWeek(new Date()), to: endOfWeek(new Date()) });
                break;
            case 'month':
                setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });
                break;
            case 'year':
                setDateRange({ from: startOfYear(new Date()), to: endOfYear(new Date()) });
                break;
            case 'all':
            default:
                setDateRange(undefined);
        }
    };

    const formatRangeLabel = () => {
        if (!dateRange?.from && !dateRange?.to) return 'All time';
        if (dateRange.from && dateRange.to) return `${format(dateRange.from, 'dd MMM, yyyy')} – ${format(dateRange.to, 'dd MMM, yyyy')}`;
        if (dateRange.from) return format(dateRange.from, 'dd MMM, yyyy');
        if (dateRange.to) return format(dateRange.to, 'dd MMM, yyyy');
        return 'All time';
    };

    const exportInvoices = async (scope: 'filtered' | 'all') => {
        if (!user) return;
        setIsExporting(true);
        try {
            const dataToExport = scope === 'filtered' ? filteredInvoices : optimisticInvoices;

            const dataRows = dataToExport.map(r => ({
                Invoice: r.invoiceNumber,
                Date: r.invoiceDate,
                Customer: r.customerSnapshot?.name || 'Unknown',
                Status: r.status,
                Discount: r.discount || 0,
                SGST: r.sgstAmount || 0,
                CGST: r.cgstAmount || 0,
                GrandTotal: r.grandTotal,
            }));

            const XLSX = await import('xlsx');
            const ws = XLSX.utils.json_to_sheet(dataRows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
            const filename = scope === 'filtered' ? 'invoices_filtered.xlsx' : 'invoices_all.xlsx';
            XLSX.writeFile(wb, filename);
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Export failed', description: 'Unable to generate Excel right now.' });
        } finally {
            setIsExporting(false);
        }
    };

    const handleDownloadPdf = async (invoiceId: string) => {
        try {
            const { data: inv, error: invErr } = await supabase
                .from('invoices')
                .select('*')
                .eq('id', invoiceId)
                .single();
            if (invErr || !inv) throw new Error('Invoice not found');

            const { data: its, error: itErr } = await supabase
                .from('invoice_items')
                .select('*')
                .eq('invoice_id', invoiceId)
                .order('id');
            if (itErr) throw itErr;

            const invoice: Invoice = {
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

            const items: InvoiceItem[] = (its ?? []).map((r: any) => ({
                id: r.id,
                description: r.description,
                purity: r.purity,
                grossWeight: Number(r.gross_weight) || 0,
                netWeight: Number(r.net_weight) || 0,
                rate: Number(r.rate) || 0,
                making: Number(r.making) || 0,
            }));

            const { data: shopDetails } = await supabase
                .from('shops')
                .select('*')
                .eq('id', inv.shop_id)
                .single();

            const settings = shopDetails ? {
                id: shopDetails.id,
                userId: inv.user_id,
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

            const { generateInvoicePdf } = await import('@/lib/pdf');
            const pdfBlob = await generateInvoicePdf({ invoice, items, settings });
            const filename = `Invoice-${invoice.invoiceNumber}.pdf`;

            // Web Download Logic
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({ title: 'Success', description: 'Invoice PDF downloaded successfully' });
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to generate PDF. Please try again.',
            });
        }
    };

    return (
        <MotionWrapper className="space-y-4 pb-24 pt-2 px-4 md:px-0">
            {/* Sticky Header Section for Mobile */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm -mx-4 px-4 md:mx-0 md:px-0 pb-3 md:static md:bg-transparent md:backdrop-blur-none">
                {/* Quick Filters - Enhanced */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {['all', 'paid', 'due', 'overdue'].map((status) => (
                        <Button
                            key={status}
                            variant={statusFilter === status ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                                haptics.impact(ImpactStyle.Light);
                                setStatusFilter(status);
                                router.push(`/shop/${shopId}/invoices?status=${status}`);
                            }}
                            className={cn(
                                "capitalize rounded-full h-9 px-5 text-xs font-semibold border transition-all",
                                statusFilter === status
                                    ? "bg-primary text-primary-foreground border-primary shadow-glow-sm"
                                    : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-primary/50 text-muted-foreground"
                            )}
                        >
                            {status}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Search and Actions */}
            <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search invoices..."
                            className="pl-9 h-10 bg-white dark:bg-white/5 border-gray-400 dark:border-white/30 focus:border-primary rounded-xl backdrop-blur-sm transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Link href={`/shop/${shopId}/invoices/new`}>
                        <Button
                            className="h-10 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 rounded-xl font-medium shrink-0"
                        >
                            <FilePlus2 className="h-4 w-4" />
                            <span className="hidden sm:inline">New Invoice</span>
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleRefresh}
                            className="shrink-0 transition-all duration-300 hover:shadow-glow-sm interactive-scale bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10"
                            title={lastRefreshed ? `Last updated: ${getRelativeTime(lastRefreshed)}` : 'Refresh'}
                        >
                            <RefreshCw className={cn(
                                "h-4 w-4 transition-transform duration-500",
                                isRefreshing && "animate-spin"
                            )} />
                        </Button>
                        {lastRefreshed && (
                            <span className="text-xs text-muted-foreground hidden sm:inline animate-in fade-in">
                                Updated {getRelativeTime(lastRefreshed)}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 gap-2 shrink-0 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10">
                                <CalendarIcon className="h-3.5 w-3.5" />
                                <span className="text-xs">{formatRangeLabel()}</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3 bg-white/95 dark:bg-card/95 backdrop-blur-xl border-gray-200 dark:border-white/10" align="start">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div>
                                    <div className="mb-2 text-xs font-medium text-muted-foreground">Quick ranges</div>
                                    <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                                        <Button size="sm" variant="outline" onClick={() => applyPreset('today')}>Today</Button>
                                        <Button size="sm" variant="outline" onClick={() => applyPreset('week')}>This Week</Button>
                                        <Button size="sm" variant="outline" onClick={() => applyPreset('month')}>This Month</Button>
                                        <Button size="sm" variant="outline" onClick={() => applyPreset('year')}>This Year</Button>
                                        <Button size="sm" variant="ghost" onClick={() => applyPreset('all')}>All Time</Button>
                                    </div>
                                </div>
                                <Calendar
                                    mode="range"
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={1}
                                    defaultMonth={dateRange?.from}
                                />
                            </div>
                        </PopoverContent>
                    </Popover>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 gap-2 shrink-0 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10" disabled={isExporting}>
                                {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                                <span className="text-xs">Export</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white/95 dark:bg-card/95 backdrop-blur-xl border-gray-200 dark:border-white/10">
                            <DropdownMenuItem onClick={() => exportInvoices('filtered')}>
                                Export filtered as Excel
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportInvoices('all')}>
                                Export all as Excel
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button asChild size="sm" variant="outline" className="h-9 gap-2 shrink-0 border-primary/20 hover:bg-primary/10 text-primary hover:text-primary">
                        <Link href={`/shop/${shopId}/invoices/scan`}>
                            <Scan className="h-3.5 w-3.5" />
                            <span className="text-xs">Scan</span>
                        </Link>
                    </Button>

                    <Button asChild size="sm" className="h-9 gap-2 shrink-0 bg-primary hover:bg-primary/90 shadow-glow-sm">
                        <Link href={`/shop/${shopId}/invoices/new`}>
                            <FilePlus2 className="h-3.5 w-3.5" />
                            <span className="text-xs">New</span>
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Batch Action Bar */}
            {selectedInvoices.size > 0 && (
                <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary glow-text-sm">
                            {selectedInvoices.size} selected
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBatchDelete}
                            className="h-8 gap-2 shadow-sm"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete Selected
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedInvoices(new Set())}
                            className="h-8 hover:bg-gray-100 dark:hover:bg-white/10"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="space-y-4">
                {/* Desktop/Tablet Table View */}
                {/* Desktop/Tablet Table View */}
                <div className="rounded-xl border border-border overflow-x-auto hidden md:block bg-card shadow-sm">
                    <Table className="table-modern min-w-[600px]">
                        <TableHeader className="bg-muted/50 border-b border-border sticky top-0 z-10">
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="w-[40px] px-4 h-12">
                                    <Checkbox
                                        checked={filteredInvoices.length > 0 && selectedInvoices.size === filteredInvoices.length}
                                        onCheckedChange={toggleSelectAll}
                                        aria-label="Select all"
                                        className="border-gray-400 dark:border-white/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                    />
                                </TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider h-12">Invoice #</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider h-12">Date</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider h-12">Customer</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider h-12">Status</TableHead>
                                <TableHead className="text-right text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider h-12">Amount</TableHead>
                                <TableHead className="text-right text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider h-12">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredInvoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-96 text-center">
                                        <EmptyState
                                            icon={FilePlus2}
                                            title="No invoices found"
                                            description={
                                                statusFilter !== 'all' || searchTerm
                                                    ? "Try adjusting your filters or search terms to find what you're looking for."
                                                    : "Get started by creating your first invoice."
                                            }
                                            action={
                                                statusFilter !== 'all' || searchTerm
                                                    ? { label: 'Clear filters', onClick: () => { setStatusFilter('all'); setSearchTerm(''); } }
                                                    : { label: 'Create Invoice', onClick: () => router.push(`/shop/${shopId}/invoices/new`) }
                                            }
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredInvoices.map((invoice) => (
                                    <TableRow
                                        key={invoice.id}
                                        className={cn(
                                            "hover:bg-muted/50 border-b border-border transition-colors cursor-pointer group",
                                            selectedInvoices.has(invoice.id) && "bg-primary/5"
                                        )}
                                        onClick={() => router.push(`/shop/${shopId}/invoices/view?id=${invoice.id}`)}
                                    >
                                        <TableCell className="px-4" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selectedInvoices.has(invoice.id)}
                                                onCheckedChange={() => toggleSelectInvoice(invoice.id)}
                                                aria-label={`Select invoice ${invoice.invoiceNumber}`}
                                                className="border-gray-300 dark:border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium text-xs lg:text-sm text-gray-900 dark:text-foreground group-hover:text-primary transition-colors">{invoice.invoiceNumber}</TableCell>
                                        <TableCell className="text-xs lg:text-sm text-gray-500 dark:text-muted-foreground">{format(new Date(invoice.invoiceDate), 'dd MMM yyyy')}</TableCell>
                                        <TableCell className="text-xs lg:text-sm truncate max-w-[150px] lg:max-w-none text-gray-900 dark:text-foreground">{invoice.customerSnapshot?.name || 'Unknown'}</TableCell>
                                        <TableCell>
                                            <div className={cn(
                                                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                                                invoice.status === 'paid'
                                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20"
                                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20"
                                            )}>
                                                {invoice.status}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-gray-900 dark:text-foreground text-xs lg:text-sm">₹{invoice.grandTotal.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title={invoice.status === 'paid' ? 'Mark as Due' : 'Mark as Paid'}
                                                    onClick={() => handleMarkPaid(invoice.id)}
                                                    className="hover:bg-gray-100 dark:hover:bg-white/10"
                                                >
                                                    {invoice.status === 'paid' ? (
                                                        <Undo2 className="h-4 w-4 text-gray-500 dark:text-muted-foreground" />
                                                    ) : (
                                                        <Banknote className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                                                    )}
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDownloadPdf(invoice.id)} className="hover:bg-gray-100 dark:hover:bg-white/10">
                                                    <Download className="h-4 w-4 text-primary" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteConfirmation(invoice.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                    {filteredInvoices.length === 0 ? (
                        <div className="py-12">
                            <EmptyState
                                icon={FilePlus2}
                                title="No invoices found"
                                description={
                                    statusFilter !== 'all' || searchTerm
                                        ? "Try adjusting your filters or search terms to find what you're looking for."
                                        : "Get started by creating your first invoice."
                                }
                                action={
                                    statusFilter !== 'all' || searchTerm
                                        ? { label: 'Clear filters', onClick: () => { setStatusFilter('all'); setSearchTerm(''); } }
                                        : { label: 'Create Invoice', onClick: () => router.push(`/shop/${shopId}/invoices/new`) }
                                }
                            />
                        </div>
                    ) : (
                        filteredInvoices.map((invoice) => (
                            <InvoiceMobileCard
                                key={invoice.id}
                                invoice={invoice}
                                onView={(id) => router.push(`/shop/${shopId}/invoices/view?id=${id}`)}
                                onDelete={handleDeleteConfirmation}
                                onDownload={handleDownloadPdf}
                                onShare={handleShare}
                                onMarkPaid={handleMarkPaid}
                            />
                        ))
                    )}
                </div>
            </div>



            {/* Delete Confirmation Dialog */}
            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the invoice
                            and all of its associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeDelete}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Status Change Confirmation Dialog */}
            <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Change Invoice Status?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {invoiceToChangeStatus?.currentStatus === 'paid'
                                ? 'Mark this invoice as due (unpaid)?'
                                : 'Mark this invoice as paid?'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmStatusChange}
                            disabled={isStatusUpdating}
                        >
                            {isStatusUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Batch Delete Confirmation Dialog */}
            <AlertDialog open={batchDeleteDialogOpen} onOpenChange={setBatchDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selectedInvoices.size} Invoices?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the selected invoices
                            and all of their associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeBatchDelete}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Delete Selected
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Pagination Controls */}
            {pagination && (
                <div className="flex items-center justify-between pt-4 pb-6 border-t border-border mt-4">
                    <div className="text-sm text-muted-foreground">
                        Showing <span className="font-medium text-foreground">{(pagination.currentPage - 1) * pagination.limit + 1}</span> to <span className="font-medium text-foreground">{Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)}</span> of <span className="font-medium text-foreground">{pagination.totalCount}</span> invoices
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.currentPage <= 1}
                            onClick={() => {
                                const params = new URLSearchParams(window.location.search);
                                params.set('page', String(pagination.currentPage - 1));
                                router.push(`?${params.toString()}`);
                            }}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.currentPage >= pagination.totalPages}
                            onClick={() => {
                                const params = new URLSearchParams(window.location.search);
                                params.set('page', String(pagination.currentPage + 1));
                                router.push(`?${params.toString()}`);
                            }}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </MotionWrapper>
    );
}
