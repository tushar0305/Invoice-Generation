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
import { Search, MoreHorizontal, FilePlus2, Edit, Printer, Eye, Trash2, Loader2 } from 'lucide-react';
import type { Invoice, InvoiceItem } from '@/lib/definitions';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where, getFirestore, writeBatch, doc, getDocs } from 'firebase/firestore';

type InvoiceWithTotal = Invoice & { grandTotal: number };

function calculateGrandTotal(items: InvoiceItem[], discount: number, tax: number) {
    const subtotal = items.reduce((acc, item) => acc + (item.weight * item.rate) + item.makingCharges, 0);
    const subtotalAfterDiscount = subtotal - discount;
    const taxAmount = subtotalAfterDiscount * (tax / 100);
    return subtotalAfterDiscount + taxAmount;
}

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);

  const { user } = useUser();
  const firestore = getFirestore();

  const invoicesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'invoices'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const { data: invoices, isLoading: loadingInvoices } = useCollection<Invoice>(invoicesQuery);

  const [invoicesWithTotals, setInvoicesWithTotals] = useState<InvoiceWithTotal[]>([]);
  const [loadingTotals, setLoadingTotals] = useState(true);

  useEffect(() => {
    async function fetchTotals() {
      if (!invoices) return;
      
      setLoadingTotals(true);
      const invoicesWithFetchedTotals = await Promise.all(
        invoices.map(async (invoice) => {
          const itemsCol = collection(firestore, `invoices/${invoice.id}/invoiceItems`);
          const itemsSnap = await getDocs(itemsCol);
          const items = itemsSnap.docs.map(d => d.data() as InvoiceItem);
          const grandTotal = calculateGrandTotal(items, invoice.discount, invoice.tax);
          return { ...invoice, grandTotal };
        })
      );
      setInvoicesWithTotals(invoicesWithFetchedTotals);
      setLoadingTotals(false);
    }
    fetchTotals();
  }, [invoices, firestore]);

  const loading = loadingInvoices || loadingTotals;

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
    if (!invoicesWithTotals) return [];
    return invoicesWithTotals.filter(invoice =>
      (invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === 'all' || invoice.status === statusFilter)
    );
  }, [invoicesWithTotals, searchTerm, statusFilter]);

  return (
    <>
    <div className="space-y-6">
      <Card>
        <CardHeader>
            <CardTitle>All Invoices</CardTitle>
            <CardDescription>A list of all your invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer or invoice number..."
                className="pl-10 w-full sm:max-w-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="due">Due</SelectItem>
                    </SelectContent>
                </Select>
                <Button asChild className="bg-primary hover:bg-primary/90">
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
                {loading ? (
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
                                  <DropdownMenuItem asChild>
                                      <Link href={`/dashboard/invoices/${invoice.id}/print`} target="_blank" className="cursor-pointer flex items-center">
                                          <Printer className="mr-2 h-4 w-4" />
                                          Print
                                      </Link>
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
