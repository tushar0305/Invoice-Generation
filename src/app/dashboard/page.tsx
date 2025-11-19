'use client';

import { useMemo, useEffect, useState } from 'react';
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
import { MoreHorizontal, Eye, Edit, Printer, DollarSign, Users, CreditCard, MessageCircle } from 'lucide-react';
import type { Invoice } from '@/lib/definitions';
import { formatCurrency, cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Line } from 'recharts';
import { format, subDays, startOfDay, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { useUser } from '@/supabase/provider';
import { supabase } from '@/supabase/client';
import { shareInvoicePdfById } from '@/lib/share';
import type { UserSettings } from '@/lib/definitions';
import { ShopSetupBanner } from '@/components/shop-setup-banner';
import { FirstTimeWelcome } from '@/components/first-time-welcome';
import { DashboardHero } from '@/components/dashboard/hero';
import { StatsCard } from '@/components/dashboard/stats-card';
import { MotionWrapper, FadeIn } from '@/components/ui/motion-wrapper';

type CustomerStats = {
  totalPurchase: number;
  invoiceCount: number;
};

export default function DashboardPage() {
  const { user } = useUser();
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user) { setInvoices([]); setSettings(null); setIsLoading(false); return; }
      setIsLoading(true);
      const [{ data: inv, error: invErr }, { data: setData, error: setErr }] = await Promise.all([
        supabase
          .from('invoices')
          .select('*')
          .eq('user_id', user.uid),
        supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.uid)
          .maybeSingle(),
      ]);
      if (!active) return;
      if (invErr) {
        console.error('Error fetching invoices:', invErr.message || invErr);
        setInvoices([]);
      } else {
        const mapped = (inv ?? []).map((r: any) => ({
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
        setInvoices(mapped);
      }
      if (setErr) {
        console.error('Error fetching user settings:', setErr.message || setErr);
        setSettings(null);
      } else if (setData) {
        setSettings({
          id: setData.user_id,
          userId: setData.user_id,
          cgstRate: Number(setData.cgst_rate) || 0,
          sgstRate: Number(setData.sgst_rate) || 0,
          shopName: setData.shop_name || 'Jewellers Store',
          gstNumber: setData.gst_number || '',
          panNumber: setData.pan_number || '',
          address: setData.address || '',
          state: setData.state || '',
          pincode: setData.pincode || '',
          phoneNumber: setData.phone_number || '',
          email: setData.email || '',
        });
      }
      setIsLoading(false);
    };
    load();
    return () => { active = false; };
  }, [user?.uid]);


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
    <div className="space-y-8">
      {/* First-time User Welcome */}
      <FirstTimeWelcome settings={settings} isLoading={isLoading} hasInvoices={invoices && invoices.length > 0} />

      {/* Shop Setup Banner */}
      <ShopSetupBanner settings={settings} isLoading={isLoading} />

      {/* Hero Section */}
      <DashboardHero />

      {/* Stats Grid */}
      <MotionWrapper className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(totalPaidThisMonth)}
          icon={DollarSign}
          description="Paid sales, this month"
          trend={sales7dChangePct !== null ? { value: Number(sales7dChangePct.toFixed(0)), label: '7d' } : undefined}
          loading={isLoading}
        />
        <StatsCard
          title="Customers"
          value={totalCustomers}
          icon={Users}
          description="Total unique customers"
          loading={isLoading}
        />
        <StatsCard
          title="Paid Invoices"
          value={paidInvoicesAllTime}
          icon={CreditCard}
          description="All-time count"
          trend={paid7dChangePct !== null ? { value: Number(paid7dChangePct.toFixed(0)), label: '7d' } : undefined}
          loading={isLoading}
        />
        <StatsCard
          title="Outstanding Due"
          value={formatCurrency(outstandingDueAmount)}
          icon={DollarSign}
          description={`${outstandingDueCount} invoice(s) due`}
          loading={isLoading}
          className="border-l-4 border-l-red-500"
        />
      </MotionWrapper>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* Sales Chart */}
        <Card className="xl:col-span-3 glass-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Sales Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            <div className="h-[300px] w-full">
              {isLoading ? <Skeleton className="w-full h-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
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
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        padding: '8px 12px'
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 600 }}
                      itemStyle={{ fontSize: 12 }}
                      formatter={(value, name) => [formatCurrency(value as number), name === 'sales' ? 'Sales' : '7d Avg']}
                    />
                    <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                    <Line type="monotone" dataKey="ma7" stroke="hsl(var(--gold-500))" strokeWidth={2} dot={false} name="7d Avg" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Side Panels */}
        <div className="space-y-8 xl:col-span-2">
          {/* Top Customers */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading text-xl">Top Customers</CardTitle>
              <CardDescription>Most valuable customers by total purchase.</CardDescription>
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
                  {topCustomers.map(([name, stats], i) => (
                    <li key={name} className="flex justify-between items-center gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {i + 1}
                        </div>
                        <span className="font-medium truncate">{name}</span>
                      </div>
                      <span className="text-sm font-semibold text-gold-600 dark:text-gold-400 whitespace-nowrap">{formatCurrency(stats.totalPurchase)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground text-center h-24 flex items-center justify-center">No customer data available.</p>
              )}
            </CardContent>
          </Card>

          {/* Due Invoices */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading text-xl">Due Invoices</CardTitle>
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
                          <li key={inv.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{inv.customerName}</span>
                                <Badge variant="outline" className="text-[10px] h-5">{inv.invoiceNumber}</Badge>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                <span>{formatCurrency(inv.grandTotal)}</span>
                                <span>•</span>
                                <span className={severity === 'over' ? 'text-red-600 font-medium' : severity === 'warn' ? 'text-yellow-600' : ''}>
                                  {ageDays}d overdue
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Link href={`/dashboard/invoices/${inv.id}/view`}>
                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                onClick={async () => {
                                  await shareInvoicePdfById(inv.id, inv, settings || undefined);
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

      {/* Recent Invoices Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b-primary/10">
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
                    <TableRow key={invoice.id} className="hover:bg-muted/50 border-b-primary/5">
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.customerName}</TableCell>
                      <TableCell>
                        <Badge
                          variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                          className={cn(
                            "capitalize shadow-sm",
                            invoice.status === 'paid' ? 'bg-green-600/90 hover:bg-green-600' : 'bg-yellow-500/90 hover:bg-yellow-500 text-white'
                          )}
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(invoice.grandTotal)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
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
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
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
