'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, MoreHorizontal, FilePlus2, Edit, Printer, Loader2, DollarSign, Users, CreditCard } from 'lucide-react';
import { getInvoices } from '@/lib/data';
import type { Invoice } from '@/lib/definitions';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

function calculateGrandTotal(invoice: Invoice) {
    const subtotal = invoice.items.reduce((acc, item) => acc + (item.weight * item.rate) + item.makingCharges, 0);
    const discountAmount = invoice.discount;
    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxAmount = subtotalAfterDiscount * (invoice.tax / 100);
    return subtotalAfterDiscount + taxAmount;
}

type CustomerStats = {
    totalPurchase: number;
    invoiceCount: number;
};

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvoices() {
      setLoading(true);
      const data = await getInvoices();
      setInvoices(data);
      setLoading(false);
    }
    fetchInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice =>
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm]);
  
  const { totalSales, totalCustomers, paidInvoicesCount } = useMemo(() => {
    if (loading) return { totalSales: 0, totalCustomers: 0, paidInvoicesCount: 0 };
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const totalSales = paidInvoices.reduce((sum, inv) => sum + calculateGrandTotal(inv), 0);
    const totalCustomers = new Set(invoices.map(inv => inv.customerName)).size;
    return { totalSales, totalCustomers, paidInvoicesCount: paidInvoices.length };
  }, [invoices, loading]);

  const customerData = useMemo(() => {
    if (loading) return {};
    const data: Record<string, CustomerStats> = {};
    invoices.forEach(invoice => {
        if (!data[invoice.customerName]) {
            data[invoice.customerName] = { totalPurchase: 0, invoiceCount: 0 };
        }
        if(invoice.status === 'paid') {
            data[invoice.customerName].totalPurchase += calculateGrandTotal(invoice);
        }
        data[invoice.customerName].invoiceCount++;
    });
    return data;
  }, [invoices, loading]);

  return (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {loading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>}
                    <p className="text-xs text-muted-foreground">Total sales from paid invoices</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Customers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {loading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{totalCustomers}</div>}
                    <p className="text-xs text-muted-foreground">Total unique customers</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {loading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{paidInvoicesCount}</div>}
                     <p className="text-xs text-muted-foreground">Out of {invoices.length} total invoices</p>
                </CardContent>
            </Card>
        </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer or invoice number..."
            className="pl-10 w-full sm:max-w-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/invoices/new">
            <FilePlus2 className="mr-2 h-4 w-4" />
            Create Invoice
          </Link>
        </Button>
      </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>A list of your most recent invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[50px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={`skeleton-${i}`}>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
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
                      <TableCell>
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className={invoice.status === 'paid' ? 'bg-green-600/80' : ''}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(calculateGrandTotal(invoice))}</TableCell>
                      <TableCell className="text-right">
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                      <Link href={`/invoices/${invoice.id}/edit`} className="cursor-pointer flex items-center">
                                          <Edit className="mr-2 h-4 w-4" />
                                          Edit
                                      </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                      <Link href={`/invoices/${invoice.id}/print`} target="_blank" className="cursor-pointer flex items-center">
                                          <Printer className="mr-2 h-4 w-4" />
                                          Print
                                      </Link>
                                  </DropdownMenuItem>
                              </DropdownMenuContent>
                          </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      No invoices found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Card>
          <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              <CardDescription>Customers with the highest purchase value.</CardDescription>
          </CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Invoices</TableHead>
                          <TableHead className="text-right">Total Spent</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {loading ? (
                          Array.from({ length: 3 }).map((_, i) => (
                              <TableRow key={`cust-skeleton-${i}`}>
                                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                  <TableCell className="text-right"><Skeleton className="h-5 w-28 ml-auto" /></TableCell>
                              </TableRow>
                          ))
                      ) : Object.keys(customerData).length > 0 ? (
                          Object.entries(customerData)
                            .sort(([, a], [, b]) => b.totalPurchase - a.totalPurchase)
                            .map(([name, stats]) => (
                              <TableRow key={name}>
                                  <TableCell className="font-medium">{name}</TableCell>
                                  <TableCell>{stats.invoiceCount}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(stats.totalPurchase)}</TableCell>
                              </TableRow>
                          ))
                      ) : (
                          <TableRow>
                              <TableCell colSpan={3} className="text-center h-24">
                                  No customer data available.
                              </TableCell>
                          </TableRow>
                      )}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
      </div>
    </div>
  );
}
