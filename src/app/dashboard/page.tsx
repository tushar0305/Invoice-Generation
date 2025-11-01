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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Printer, DollarSign, Users, CreditCard } from 'lucide-react';
import { getInvoices } from '@/lib/data';
import type { Invoice } from '@/lib/definitions';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { format, subDays } from 'date-fns';

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

  const recentInvoices = useMemo(() => {
    return invoices.sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()).slice(0, 5);
  }, [invoices]);

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

  const chartData = useMemo(() => {
    if (loading) return [];
    const last30Days = Array.from({ length: 30 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd')).reverse();
    
    const salesByDay = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((acc, inv) => {
        const date = format(new Date(inv.invoiceDate), 'yyyy-MM-dd');
        acc[date] = (acc[date] || 0) + calculateGrandTotal(inv);
        return acc;
      }, {} as Record<string, number>);

    return last30Days.map(date => ({
      date: format(new Date(date), 'MMM dd'),
      sales: salesByDay[date] || 0
    }));
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
      
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <Card className="lg:col-span-3">
        <CardHeader>
            <CardTitle>Sales Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] w-full">
           {loading ? <Skeleton className="w-full h-full" /> : (
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                        dataKey="date" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis 
                        tickFormatter={(value) => formatCurrency(value as number)}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            borderColor: 'hsl(var(--border))'
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                        formatter={(value) => [formatCurrency(value as number), 'Sales']}
                    />
                    <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
            </ResponsiveContainer>
           )}
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[50px] text-right"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={`skeleton-${i}`}>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-5 w-28 ml-auto" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
                      </TableRow>
                  ))
                ) : recentInvoices.length > 0 ? (
                  recentInvoices.map(invoice => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.customerName}</TableCell>
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
                    <TableCell colSpan={4} className="text-center h-24">
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
    </div>
  );
}
