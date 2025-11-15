'use client';

import { useState, useMemo, useTransition } from 'react';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Search, MoreHorizontal, FilePlus2, Edit, Printer, Eye, Trash2, Loader2, Calendar as CalendarIcon, Download, Send } from 'lucide-react';
import type { Invoice } from '@/lib/definitions';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, getFirestore, writeBatch, doc, getDocs, orderBy } from 'firebase/firestore';
import { usePaginatedCollection } from '@/firebase/firestore/use-paginated-collection';
import { format, startOfToday, endOfToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import type { UserSettings } from '@/lib/definitions';
import { composeWhatsAppInvoiceMessage, openWhatsAppWithText } from '@/lib/share';


export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);

  const { user } = useUser();
  const firestore = getFirestore();

  // Load user settings once for shop info in share text
  const settingsRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'userSettings', user.uid);
  }, [firestore, user]);
  const { data: settings } = useDoc<UserSettings>(settingsRef);

  const invoicesQuery = useMemoFirebase(() => {
    if (!user) return null;
    
    let q = query(collection(firestore, 'invoices'), where('userId', '==', user.uid));

    if (statusFilter !== 'all') {
        q = query(q, where('status', '==', statusFilter));
    }
    // Note: We keep the list realtime and paginated; date filtering is applied client-side for display.
    // For exports we fetch full filtered data separately to ensure completeness.
    
    return q;
  }, [firestore, user, statusFilter]);

  const { data: invoices, isLoading, error, loadMore, hasMore } = usePaginatedCollection<Invoice>(invoicesQuery, 10);

  const handleDeleteConfirmation = (invoiceId: string) => {
    setInvoiceToDelete(invoiceId);
    setDialogOpen(true);
  };

  const executeDelete = () => {
    if (!invoiceToDelete) return;

    startDeleteTransition(async () => {
      try {
        const batch = writeBatch(firestore);
        const invoiceDocRef = doc(firestore, 'invoices', invoiceToDelete);
        
        const itemsRef = collection(firestore, `invoices/${invoiceToDelete}/invoiceItems`);
        const itemsSnap = await getDocs(itemsRef);
        itemsSnap.forEach(itemDoc => batch.delete(itemDoc.ref));
        
        batch.delete(invoiceDocRef);
        await batch.commit();

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

  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    const lower = searchTerm.toLowerCase();
    const bySearch = !lower
      ? invoices
      : invoices.filter(inv => inv.customerName.toLowerCase().includes(lower) || inv.invoiceNumber.toLowerCase().includes(lower));

    if (!dateRange?.from && !dateRange?.to) return bySearch;
    const startStr = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
    const endStr = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : startStr;
    return bySearch.filter(inv => {
      const d = inv.invoiceDate; // already 'yyyy-MM-dd'
      if (startStr && d < startStr) return false;
      if (endStr && d > endStr) return false;
      return true;
    });
  }, [invoices, searchTerm, dateRange]);

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
      // Build a query to fetch all matching invoices for export
      let q = query(collection(firestore, 'invoices'), where('userId', '==', user.uid));
      if (scope === 'filtered') {
        if (statusFilter !== 'all') {
          q = query(q, where('status', '==', statusFilter));
        }
        if (dateRange?.from || dateRange?.to) {
          const startStr = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
          const endStr = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : (startStr ?? undefined);
          if (startStr) {
            q = query(q, where('invoiceDate', '>=', startStr));
          }
          if (endStr) {
            q = query(q, where('invoiceDate', '<=', endStr));
          }
        }
      }

      const snap = await getDocs(q);
      const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any[];
      // Shape data for export
      const data = rows.map(r => ({
        Invoice: r.invoiceNumber,
        Date: r.invoiceDate,
        Customer: r.customerName,
        Status: r.status,
        Discount: r.discount || 0,
        SGST: r.sgst ?? (r.tax ? r.tax / 2 : ''),
        CGST: r.cgst ?? (r.tax ? r.tax / 2 : ''),
        GrandTotal: r.grandTotal,
      }));

      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(data);
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

  const handlePrintNavigate = (invoiceId: string) => {
    router.push(`/dashboard/invoices/${invoiceId}/print`);
  };

  return (
    <>
    <div className="space-y-6">
      <Card>
        <CardHeader>
            <CardTitle>All Invoices</CardTitle>
            <CardDescription>A list of all your invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer or invoice number..."
                className="pl-10 w-full sm:max-w-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start gap-2 w-full sm:w-auto">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{formatRangeLabel()}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3" align="end">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div>
                        <div className="mb-2 text-xs font-medium text-muted-foreground">Quick ranges</div>
                        <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                          <Button size="sm" variant="secondary" onClick={() => applyPreset('today')}>Today</Button>
                          <Button size="sm" variant="secondary" onClick={() => applyPreset('week')}>This Week</Button>
                          <Button size="sm" variant="secondary" onClick={() => applyPreset('month')}>This Month</Button>
                          <Button size="sm" variant="secondary" onClick={() => applyPreset('year')}>This Year</Button>
                          <Button size="sm" variant="ghost" onClick={() => applyPreset('all')}>All Time</Button>
                        </div>
                      </div>
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                        defaultMonth={dateRange?.from}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="due">Due</SelectItem>
                    </SelectContent>
                </Select>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 w-full sm:w-auto" disabled={isExporting}>
                      {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => exportInvoices('filtered')}>Export filtered</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportInvoices('all')}>Export all</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button asChild className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                <Link href="/dashboard/invoices/new">
                    <FilePlus2 className="mr-2 h-4 w-4" />
                    Create Invoice
                </Link>
                </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[50px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && filteredInvoices.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={`skeleton-${i}`}>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-5 w-28 ml-auto" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
                      </TableRow>
                  ))
                ) : filteredInvoices.length > 0 ? (
                  filteredInvoices.map(invoice => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.customerName}</TableCell>
                       <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className={invoice.status === 'paid' ? 'bg-green-600/80' : ''}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(invoice.grandTotal)}</TableCell>
                      <TableCell className="text-right">
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                      <Link href={`/dashboard/invoices/${invoice.id}/view`} className="cursor-pointer flex items-center">
                                          <Eye className="mr-2 h-4 w-4" />
                                          View
                                      </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                      <Link href={`/dashboard/invoices/${invoice.id}/edit`} className="cursor-pointer flex items-center">
                                          <Edit className="mr-2 h-4 w-4" />
                                          Edit
                                      </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer flex items-center" onClick={() => {
                                    const msg = composeWhatsAppInvoiceMessage(invoice, settings || undefined);
                                    openWhatsAppWithText(msg);
                                  }}>
                                    <Send className="mr-2 h-4 w-4" />
                                    Share WhatsApp
                                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer flex items-center" onClick={() => handlePrintNavigate(invoice.id)}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="cursor-pointer flex items-center text-red-600 focus:text-red-600 focus:bg-red-50"
                                    onClick={() => handleDeleteConfirmation(invoice.id)}
                                  >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                  </DropdownMenuItem>
                              </DropdownMenuContent>
                          </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      No invoices found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
           {hasMore && (
              <div className="mt-6 flex justify-center">
                <Button onClick={loadMore} disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Load More'}
                </Button>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
    <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
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
    </>
  );
}
