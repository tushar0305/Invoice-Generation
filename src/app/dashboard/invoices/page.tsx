'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { MotionWrapper, FadeIn } from '@/components/ui/motion-wrapper';
import { motion } from 'framer-motion';
import { haptics } from '@/lib/haptics';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, FilePlus2, Trash2, Loader2, Calendar as CalendarIcon, Download, RefreshCw, Share2 } from 'lucide-react';
import type { Invoice, InvoiceItem } from '@/lib/definitions';
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
import { useUser } from '@/supabase/provider';
import { useActiveShop } from '@/hooks/use-active-shop';
import { supabase } from '@/supabase/client';
import { format, startOfToday, endOfToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { InvoiceMobileCard } from '@/components/dashboard/invoice-mobile-card';

export default function InvoicesPage() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam && ['paid', 'due', 'all', 'overdue'].includes(statusParam)) {
      setStatusFilter(statusParam);
    }
    const q = searchParams.get('q');
    if (q) {
      setSearchTerm(q);
    }
  }, [searchParams]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [invoiceToChangeStatus, setInvoiceToChangeStatus] = useState<{ id: string; currentStatus: string } | null>(null);

  const { activeShop } = useActiveShop();
  const { user } = useUser();
  const queryClient = useQueryClient();

  // --- React Query for Invoices ---
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', activeShop?.id],
    queryFn: async () => {
      if (!activeShop?.id) return [];
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('shop_id', activeShop.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        shopId: r.shop_id,
        createdBy: r.created_by,
        invoiceNumber: r.invoice_number,
        customerName: r.customer_name,
        customerAddress: r.customer_address || '',
        customerState: r.customer_state || '',
        customerPincode: r.customer_pincode || '',
        customerPhone: r.customer_phone || '',
        invoiceDate: r.invoice_date,
        discount: Number(r.discount) || 0,
        sgst: Number(r.sgst) || 0,
        cgst: Number(r.cgst) || 0,
        status: r.status,
        grandTotal: Number(r.grand_total) || 0,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      } as Invoice));
    },
    enabled: !!activeShop?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleDeleteConfirmation = (invoiceId: string) => {
    setInvoiceToDelete(invoiceId);
    setDialogOpen(true);
  };

  const executeDelete = () => {
    if (!invoiceToDelete) return;

    startDeleteTransition(async () => {
      try {
        const { error } = await supabase.from('invoices').delete().eq('id', invoiceToDelete).eq('user_id', user?.uid || '');
        if (error) throw error;

        // Invalidate query to refetch
        queryClient.invalidateQueries({ queryKey: ['invoices'] });

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
    // Find the invoice to determine current status
    const invoice = invoices?.find(inv => inv.id === id);
    if (!invoice) return;

    // Open confirmation dialog
    setInvoiceToChangeStatus({ id, currentStatus: invoice.status });
    setStatusDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!invoiceToChangeStatus) return;

    try {
      const currentStatus = invoiceToChangeStatus.currentStatus;
      const newStatus = currentStatus === 'paid' ? 'due' : 'paid';

      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoiceToChangeStatus.id)
        .eq('user_id', user?.uid || '');

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      haptics.notification(NotificationType.Success);
      toast({
        title: 'Success',
        description: `Invoice marked as ${newStatus}`
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update status'
      });
    } finally {
      setStatusDialogOpen(false);
      setInvoiceToChangeStatus(null);
    }
  };

  const handleShare = async (id: string) => {
    try {
      const { shareInvoicePdfById } = await import('@/lib/share');
      // Fetch invoice to get details for message if needed, but ID is enough for PDF generation
      // For better UX, we could fetch invoice here, but let's keep it simple and fast
      await shareInvoicePdfById(id);
    } catch (error) {
      console.error('Share failed', error);
      toast({ variant: 'destructive', title: 'Share Failed', description: 'Could not share invoice.' });
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
    haptics.impact(ImpactStyle.Light);
    toast({ description: 'Refreshing list...' });
  };

  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];

    let result = invoices;

    // 1. Status Filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'overdue') {
        const today = new Date().toISOString().split('T')[0];
        result = result.filter(inv => inv.status === 'due' && inv.invoiceDate < today);
      } else {
        result = result.filter(inv => inv.status === statusFilter);
      }
    }

    // 2. Search Filter
    const lower = searchTerm.toLowerCase();
    if (lower) {
      result = result.filter(inv =>
        inv.customerName.toLowerCase().includes(lower) ||
        inv.invoiceNumber.toLowerCase().includes(lower)
      );
    }

    // 3. Date Range Filter
    if (dateRange?.from) {
      const startStr = format(dateRange.from, 'yyyy-MM-dd');
      const endStr = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : startStr;

      result = result.filter(inv => {
        const d = inv.invoiceDate; // 'yyyy-MM-dd'
        return d >= startStr && d <= endStr;
      });
    }

    return result;
  }, [invoices, searchTerm, statusFilter, dateRange]);

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
      // If 'filtered', use the client-side filtered list to avoid re-querying complex logic
      // If 'all', use the full cached list or fetch all
      let dataToExport = scope === 'filtered' ? filteredInvoices : (invoices || []);

      if (scope === 'all' && (!invoices || invoices.length === 0)) {
        // Fallback fetch if for some reason we don't have data
        const { data } = await supabase.from('invoices').select('*').eq('user_id', user.uid);
        dataToExport = (data || []).map((r: any) => ({
          id: r.id,
          invoiceNumber: r.invoice_number,
          invoiceDate: r.invoice_date,
          customerName: r.customer_name,
          status: r.status,
          discount: Number(r.discount) || 0,
          sgst: Number(r.sgst) || 0,
          cgst: Number(r.cgst) || 0,
          grandTotal: Number(r.grand_total) || 0,
        } as Invoice));
      }

      const dataRows = dataToExport.map(r => ({
        Invoice: r.invoiceNumber,
        Date: r.invoiceDate,
        Customer: r.customerName,
        Status: r.status,
        Discount: r.discount || 0,
        SGST: r.sgst || 0,
        CGST: r.cgst || 0,
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
      // Fetch invoice, items, and settings
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
        userId: inv.user_id,
        shopId: inv.shop_id,
        createdBy: inv.created_by,
        invoiceNumber: inv.invoice_number,
        customerName: inv.customer_name,
        customerAddress: inv.customer_address || '',
        customerState: inv.customer_state || '',
        customerPincode: inv.customer_pincode || '',
        customerPhone: inv.customer_phone || '',
        invoiceDate: inv.invoice_date,
        discount: Number(inv.discount) || 0,
        sgst: Number(inv.sgst) || 0,
        cgst: Number(inv.cgst) || 0,
        status: inv.status,
        grandTotal: Number(inv.grand_total) || 0,
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

      const { data: userSettings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', inv.user_id)
        .single();

      const settings = userSettings ? {
        id: userSettings.user_id,
        userId: userSettings.user_id,
        cgstRate: Number(userSettings.cgst_rate) || 0,
        sgstRate: Number(userSettings.sgst_rate) || 0,
        shopName: userSettings.shop_name || 'Jewellers Store',
        gstNumber: userSettings.gst_number || '',
        panNumber: userSettings.pan_number || '',
        address: userSettings.address || '',
        state: userSettings.state || '',
        pincode: userSettings.pincode || '',
        phoneNumber: userSettings.phone_number || '',
        email: userSettings.email || '',
        templateId: userSettings.template_id || 'classic',
      } : undefined;

      // Generate PDF
      const { generateInvoicePdf } = await import('@/lib/pdf');
      const pdfBlob = await generateInvoicePdf({ invoice, items, settings });
      const filename = `Invoice-${invoice.invoiceNumber}.pdf`;

      // Native Download Logic
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const { Share } = await import('@capacitor/share');

        // Convert Blob to Base64
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = reject;
          reader.onload = () => {
            if (typeof reader.result === 'string') resolve(reader.result.split(',')[1]);
            else reject(new Error('Failed to convert blob'));
          };
          reader.readAsDataURL(pdfBlob);
        });

        try {
          // Try writing to Documents first
          await Filesystem.writeFile({
            path: filename,
            data: base64Data,
            directory: Directory.Documents,
          });

          toast({
            title: 'Invoice Saved',
            description: 'Invoice saved to Documents folder.',
            duration: 3000,
          });
        } catch (e) {
          console.error('Documents write failed, trying cache...', e);

          try {
            // Fallback: Write to Cache and Share
            const result = await Filesystem.writeFile({
              path: filename,
              data: base64Data,
              directory: Directory.Cache,
            });

            await Share.share({
              title: filename,
              files: [result.uri],
              dialogTitle: 'Save Invoice'
            });
          } catch (shareError) {
            console.error('Share failed', shareError);
            toast({
              variant: 'destructive',
              title: 'Download Failed',
              description: 'Could not save or share the invoice.',
            });
          }
        }
        return;
      }

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
    <MotionWrapper className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
        <p className="text-muted-foreground text-sm">Manage and track your invoices.</p>
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {['all', 'paid', 'due', 'overdue'].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(status)}
            className={cn(
              "capitalize rounded-full h-8 px-4 text-xs",
              statusFilter === status ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
            )}
          >
            {status}
          </Button>
        ))}
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              className="pl-9 bg-background h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" onClick={handleRefresh} className="shrink-0">
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2 shrink-0">
                <CalendarIcon className="h-3.5 w-3.5" />
                <span className="text-xs">{formatRangeLabel()}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
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
                  numberOfMonths={1}
                  defaultMonth={dateRange?.from}
                />
              </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2 shrink-0" disabled={isExporting}>
                {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                <span className="text-xs">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportInvoices('filtered')}>Export filtered</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportInvoices('all')}>Export all</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button asChild size="sm" className="h-9 gap-2 ml-auto shrink-0 bg-primary hover:bg-primary/90">
            <Link href="/dashboard/invoices/new">
              <FilePlus2 className="h-3.5 w-3.5" />
              <span className="text-xs">New</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Desktop Table View */}
        <div className="rounded-md border border-border/50 overflow-hidden hidden md:block bg-card">
          <Table className="table-modern">
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent border-b-border/50">
                <TableHead className="text-primary">Invoice #</TableHead>
                <TableHead className="text-primary">Date</TableHead>
                <TableHead className="text-primary">Customer</TableHead>
                <TableHead className="text-primary">Status</TableHead>
                <TableHead className="text-right text-primary">Amount</TableHead>
                <TableHead className="text-right text-primary">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No invoices found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className="hover:bg-muted/50 border-b-border/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/invoices/view?id=${invoice.id}`)}
                  >
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{format(new Date(invoice.invoiceDate), 'dd MMM yyyy')}</TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === 'paid' ? 'success' : 'warning'}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">₹{invoice.grandTotal.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" onClick={() => handleDownloadPdf(invoice.id)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteConfirmation(invoice.id)}>
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
          {isLoading ? (
            <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
              <p>No invoices found.</p>
              {statusFilter !== 'all' && <Button variant="link" onClick={() => setStatusFilter('all')}>Clear filters</Button>}
            </div>
          ) : (
            filteredInvoices.map((invoice) => (
              <InvoiceMobileCard
                key={invoice.id}
                invoice={invoice}
                onView={(id) => router.push(`/dashboard/invoices/view?id=${id}`)}
                onDelete={handleDeleteConfirmation}
                onDownload={handleDownloadPdf}
                onShare={handleShare}
                onMarkPaid={handleMarkPaid}
              />
            ))
          )}
        </div>
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

      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Invoice Status?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this invoice as {invoiceToChangeStatus?.currentStatus === 'paid' ? 'due' : 'paid'}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MotionWrapper>
  );
}
