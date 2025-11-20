'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
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
import type { Invoice, InvoiceItem } from '@/lib/definitions';
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
import { useUser } from '@/supabase/provider';
import { supabase } from '@/supabase/client';
import { format, startOfToday, endOfToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import type { UserSettings } from '@/lib/definitions';
import { composeWhatsAppInvoiceMessage, openWhatsAppWithText, shareInvoicePdfById } from '@/lib/share';


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
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const hasMore = (invoices?.length ?? 0) >= (page + 1) * pageSize;
  const settings = undefined as any;

  async function loadInvoices(nextPage: number, append = false) {
    if (!user) { setInvoices([]); setIsLoading(false); return; }
    setIsLoading(true);
    const from = nextPage * pageSize;
    const to = from + pageSize - 1;
    let q = supabase.from('invoices').select('*').eq('user_id', user.uid).order('created_at', { ascending: false }).range(from, to);
    if (statusFilter !== 'all') {
      q = supabase.from('invoices').select('*').eq('user_id', user.uid).eq('status', statusFilter).order('created_at', { ascending: false }).range(from, to);
    }
    const { data, error } = await q;
    if (error) {
      console.error(error);
      setInvoices([]);
      setIsLoading(false);
      return;
    }
    const mapped = (data ?? []).map((r: any) => ({
      id: r.id,
      userId: r.user_id,
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
    } as Invoice));
    setInvoices(prev => append && prev ? [...prev, ...mapped] : mapped);
    setIsLoading(false);
  }

  function loadMore() {
    const next = page + 1;
    setPage(next);
    loadInvoices(next, true);
  }

  // reload on status filter change or user change
  useEffect(() => { setPage(0); loadInvoices(0, false); }, [user?.uid, statusFilter]);

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
        await loadInvoices(page, false);

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
      let qb = supabase.from('invoices').select('*').eq('user_id', user.uid);
      if (scope === 'filtered') {
        if (statusFilter !== 'all') qb = qb.eq('status', statusFilter);
        if (dateRange?.from) qb = qb.gte('invoice_date', format(dateRange.from, 'yyyy-MM-dd'));
        if (dateRange?.to ?? dateRange?.from) qb = qb.lte('invoice_date', format(dateRange?.to ?? dateRange.from!, 'yyyy-MM-dd'));
      }
      const { data: respData, error: respErr } = await qb;
      if (respErr) throw respErr;
      const rows = (respData ?? []).map((r: any) => ({
        id: r.id,
        invoiceNumber: r.invoice_number,
        invoiceDate: r.invoice_date,
        customerName: r.customer_name,
        status: r.status,
        discount: Number(r.discount) || 0,
        sgst: Number(r.sgst) || 0,
        cgst: Number(r.cgst) || 0,
        grandTotal: Number(r.grand_total) || 0,
      }));
      // Shape data for export
      const dataRows = rows.map(r => ({
        Invoice: r.invoiceNumber,
        Date: r.invoiceDate,
        Customer: r.customerName,
        Status: r.status,
        Discount: r.discount || 0,
        SGST: r.sgst,
        CGST: r.cgst,
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
      } : undefined;

      // Generate PDF
      const { generateInvoicePdf } = await import('@/lib/pdf');
      const pdfBlob = await generateInvoicePdf({ invoice, items, settings });

      // Download the PDF
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${invoice.invoiceNumber}.pdf`;
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
                    New Invoice
                  </Link>
                </Button>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="rounded-md border border-white/10 overflow-hidden hidden md:block">
              <Table className="table-modern">
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent border-b-white/10">
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
                        className="hover:bg-white/5 border-b-white/5 transition-colors cursor-pointer"
                        onClick={() => router.push(`/dashboard/invoices/${invoice.id}/view`)}
                      >
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{format(new Date(invoice.invoiceDate), 'dd MMM yyyy')}</TableCell>
                        <TableCell>{invoice.customerName}</TableCell>
                        <TableCell>
                          <Badge variant={invoice.status === 'paid' ? 'success' : 'warning'}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-gold-400">₹{invoice.grandTotal.toFixed(2)}</TableCell>
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
            <div className="md:hidden space-y-4">
              {isLoading ? (
                <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-[#D4AF37]" /></div>
              ) : filteredInvoices.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No invoices found.</div>
              ) : (
                filteredInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="relative overflow-hidden rounded-xl border border-white/10 bg-card/50 p-4 shadow-sm transition-all active:scale-[0.98]"
                    onClick={() => router.push(`/dashboard/invoices/${invoice.id}/view`)}
                  >
                    <div className="absolute right-0 top-0 h-16 w-16 -translate-y-8 translate-x-8 rounded-full bg-[#D4AF37]/10 blur-xl"></div>

                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-xs text-[#D4AF37] font-medium mb-0.5">#{invoice.invoiceNumber}</div>
                        <h3 className="font-serif text-lg font-bold text-foreground">{invoice.customerName}</h3>
                        <div className="text-xs text-muted-foreground">{format(new Date(invoice.invoiceDate), 'dd MMM yyyy')}</div>
                      </div>
                      <Badge variant={invoice.status === 'paid' ? 'success' : 'warning'} className="shadow-none">
                        {invoice.status}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-end border-t border-white/5 pt-3">
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-white/10 bg-white/5 hover:bg-[#D4AF37] hover:text-[#0F172A] hover:border-[#D4AF37]" onClick={(e) => { e.stopPropagation(); handleDownloadPdf(invoice.id); }}>
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-white/10 bg-white/5 text-destructive hover:bg-destructive hover:text-white hover:border-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteConfirmation(invoice.id); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground mb-0.5">Total Amount</div>
                        <div className="font-serif text-xl font-bold text-[#D4AF37]">₹{invoice.grandTotal.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
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
