'use client';

import { useMemo } from 'react';
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
import { MoreHorizontal, Eye, Edit, Printer, DollarSign, Users, CreditCard, Plus, MessageCircle } from 'lucide-react';
import type { Invoice } from '@/lib/definitions';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Line } from 'recharts';
import { format, subDays, startOfDay, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { useCollection, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, getFirestore, orderBy } from 'firebase/firestore';
import { composeWhatsAppInvoiceMessage, openWhatsAppWithText, shareInvoicePdfById } from '@/lib/share';
import type { UserSettings } from '@/lib/definitions';
import { doc } from 'firebase/firestore';


type CustomerStats = {
    totalPurchase: number;
    invoiceCount: number;
};

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = getFirestore();

  const invoicesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'invoices'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const { data: invoices, isLoading } = useCollection<Invoice>(invoicesQuery);

  // Load user settings for share messages
  const settingsRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'userSettings', user.uid);
  }, [firestore, user]);
  const { data: settings } = useDoc<UserSettings>(settingsRef);


  const recentInvoices = useMemo(() => {
    if (!invoices) return [];
    return [...invoices].sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()).slice(0, 5);
  }, [invoices]);

  const {
    totalPaidThisMonth,
    totalCustomers,
    paidInvoicesAllTime,
    outstandingDueAmount,
    outstandingDueCount,
    sales7dChangePct,
    paid7dChangePct,
  } = useMemo(() => {
    if (isLoading || !invoices) {
      return {
        totalPaidThisMonth: 0,
        totalCustomers: 0,
        paidInvoicesAllTime: 0,
        outstandingDueAmount: 0,
        outstandingDueCount: 0,
        sales7dChangePct: null as number | null,
        paid7dChangePct: null as number | null,
      };
    }
    const paid = invoices.filter((inv) => inv.status === 'paid');
    const due = invoices.filter((inv) => inv.status === 'due');
    // Restrict revenue to current month only
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const inMonth = (d: Date) => isWithinInterval(d, { start: monthStart, end: monthEnd });
    const paidThisMonth = paid.filter((inv) => inMonth(new Date(inv.invoiceDate)));
    const totalPaidThisMonth = paidThisMonth.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const paidInvoicesAllTime = paid.length;
    const totalCustomers = new Set(invoices.map((inv) => inv.customerName)).size;
    const outstandingDueAmount = due.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const outstandingDueCount = due.length;
    // 7-day trend calculations
    const today = startOfDay(new Date());
    const start7 = subDays(today, 6);
    const prevStart7 = subDays(start7, 7);
    const prevEnd7 = subDays(start7, 1);
    const inWindow = (d: Date, start: Date, end: Date) => isWithinInterval(d, { start, end });
    const paid7 = paid.filter((inv) => inWindow(new Date(inv.invoiceDate), start7, today));
    const paidPrev7 = paid.filter((inv) => inWindow(new Date(inv.invoiceDate), prevStart7, prevEnd7));
    const sales7 = paid7.reduce((s, inv) => s + inv.grandTotal, 0);
    const salesPrev7 = paidPrev7.reduce((s, inv) => s + inv.grandTotal, 0);
    const sales7dChangePct = salesPrev7 === 0 ? (sales7 > 0 ? 100 : null) : ((sales7 - salesPrev7) / salesPrev7) * 100;
    const paid7Count = paid7.length;
    const paidPrev7Count = paidPrev7.length;
    const paid7dChangePct = paidPrev7Count === 0 ? (paid7Count > 0 ? 100 : null) : ((paid7Count - paidPrev7Count) / paidPrev7Count) * 100;
    return { totalPaidThisMonth, totalCustomers, paidInvoicesAllTime, outstandingDueAmount, outstandingDueCount, sales7dChangePct, paid7dChangePct };
  }, [invoices, isLoading]);

  const customerData = useMemo(() => {
    if (isLoading || !invoices) return {};
    const data: Record<string, CustomerStats> = {};
    invoices.forEach(invoice => {
        if (!data[invoice.customerName]) {
            data[invoice.customerName] = { totalPurchase: 0, invoiceCount: 0 };
        }
        // Sum across all invoices (paid + due) to show complete customer spend
        data[invoice.customerName].totalPurchase += invoice.grandTotal;
        data[invoice.customerName].invoiceCount++;
    });
    return data;
  }, [invoices, isLoading]);

  const topCustomers = useMemo(() => {
    return Object.entries(customerData)
      .sort(([, a], [, b]) => b.totalPurchase - a.totalPurchase)
      .slice(0, 5);
  }, [customerData]);

  const chartData = useMemo(() => {
    if (isLoading || !invoices) return [];
    const last30Days = Array.from({ length: 30 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd')).reverse();
    
    const salesByDay = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((acc, inv) => {
        const date = format(new Date(inv.invoiceDate), 'yyyy-MM-dd');
        acc[date] = (acc[date] || 0) + inv.grandTotal;
        return acc;
      }, {} as Record<string, number>);

    const values = last30Days.map(d => salesByDay[d] || 0);
    const ma7 = values.map((_, idx) => {
      const start = Math.max(0, idx - 6);
      const slice = values.slice(start, idx + 1);
      const sum = slice.reduce((s, v) => s + v, 0);
      return sum / slice.length;
    });

    return last30Days.map((date, i) => ({
      date: format(new Date(date), 'MMM dd'),
      sales: values[i] || 0,
      ma7: ma7[i] || 0,
    }));
  }, [invoices, isLoading]);

  return (
    <div className="space-y-6">
      {/* FAB is now globally rendered in layout across pages */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-8 w-3/4" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold">{formatCurrency(totalPaidThisMonth)}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Paid sales, this month
                          <span className="mx-2">•</span>
                          <span>
                            7d: {sales7dChangePct === null ? '—' : `${sales7dChangePct >= 0 ? '+' : ''}${sales7dChangePct.toFixed(0)}%`}
                          </span>
                        </div>
                      </>
                    )}
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Customers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{totalCustomers}</div>}
                    <p className="text-xs text-muted-foreground">Total unique customers</p>
                </CardContent>
            </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-8 w-1/4" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold">{paidInvoicesAllTime}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          All-time count
                          <span className="mx-2">•</span>
                          <span>
                            7d: {paid7dChangePct === null ? '—' : `${paid7dChangePct >= 0 ? '+' : ''}${paid7dChangePct.toFixed(0)}%`}
                          </span>
                        </div>
                      </>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Outstanding Due</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-8 w-3/4" />
                    ) : (
                      <div className="text-2xl font-bold">{formatCurrency(outstandingDueAmount)}</div>
                    )}
                    <p className="text-xs text-muted-foreground">{outstandingDueCount} invoice(s) due</p>
                </CardContent>
            </Card>
        </div>
      
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      <Card className="xl:col-span-3">
        <CardHeader>
            <CardTitle>Sales Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          <div className="h-[250px] sm:h-[300px] w-full">
           {isLoading ? <Skeleton className="w-full h-full" /> : (
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                        dataKey="date" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                        minTickGap={20}
                    />
                    <YAxis 
                        tickFormatter={(value) => formatCurrency(value as number, true)}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        width={60}
                    />
          <Tooltip
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))', 
              borderColor: 'hsl(var(--border))',
              borderRadius: '6px',
              padding: '8px 12px'
            }}
            labelStyle={{ color: 'hsl(var(--foreground))', fontSize: 12 }}
            itemStyle={{ fontSize: 12 }}
            formatter={(value, name) => [formatCurrency(value as number), name === 'sales' ? 'Sales' : '7d Avg']}
          />
          <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
          <Line type="monotone" dataKey="ma7" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} name="7d Avg" />
                </AreaChart>
            </ResponsiveContainer>
           )}
          </div>
        </CardContent>
      </Card>
      <div className="space-y-6 xl:col-span-2">
        <Card>
          <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              <CardDescription>Your most valuable customers by total purchase.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={`skel-cust-${i}`} className="flex justify-between items-center">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-5 w-24" />
                    </div>
                  ))}
                </div>
            ) : topCustomers.length > 0 ? (
                <ul className="space-y-4">
                {topCustomers.map(([name, stats]) => (
                    <li key={name} className="flex justify-between items-center gap-4">
                        <span className="font-medium truncate flex-1">{name}</span>
                        <span className="text-muted-foreground text-sm sm:text-base whitespace-nowrap">{formatCurrency(stats.totalPurchase)}</span>
                    </li>
                ))}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground text-center h-24 flex items-center justify-center">No customer data available.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Due Invoices</CardTitle>
            <CardDescription>Oldest unpaid invoices first.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={`skel-due-${i}`} className="flex items-center justify-between">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                ))}
              </div>
            ) : (
              (() => {
                const dueInvoices = (invoices || [])
                  .filter((inv) => inv.status === 'due')
                  .sort((a, b) => new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime())
                  .slice(0, 5);
                if (dueInvoices.length === 0) {
                  return (
                    <p className="text-sm text-muted-foreground text-center h-24 flex items-center justify-center">No due invoices. 🎉</p>
                  );
                }
                const today = startOfDay(new Date());
                return (
                  <ul className="space-y-3">
                    {dueInvoices.map((inv) => {
                      const ageDays = Math.max(0, Math.floor((today.getTime() - new Date(inv.invoiceDate).getTime()) / (1000 * 60 * 60 * 24)));
                      const severity = ageDays > 7 ? 'over' : ageDays >= 3 ? 'warn' : 'ok';
                      return (
                        <li key={inv.id} className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{inv.customerName}</span>
                              <Badge variant="secondary">{inv.invoiceNumber}</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">{format(new Date(inv.invoiceDate), 'dd MMM yyyy')} • {formatCurrency(inv.grandTotal)} • <span className={severity === 'over' ? 'text-red-600' : severity === 'warn' ? 'text-yellow-600' : ''}>Aged {ageDays}d</span></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link href={`/dashboard/invoices/${inv.id}/view`}>
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={async () => {
                                const ok = await shareInvoicePdfById(inv.id, inv, settings || undefined);
                                if (!ok) {
                                  // Non-blocking toast; still shared as text
                                  // useToast not in this scope; quick alert fallback
                                  // Optionally wire a dedicated toast here in future refactor
                                }
                              }}
                              title="Send WhatsApp reminder"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                );
              })()
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    <Card>
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
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[50px] text-right"> </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-recent-${i}`}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-28 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
                    </TableRow>
                ))
              ) : recentInvoices.length > 0 ? (
                recentInvoices.map(invoice => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
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
    </div>
  );
}
