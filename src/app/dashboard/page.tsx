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
import { useToast } from '@/hooks/use-toast';
import type { Invoice, InvoiceItem } from '@/lib/definitions';
import { formatCurrency, cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { format, subDays, startOfDay, isWithinInterval, startOfMonth, endOfMonth, subMonths } from 'date-fns';
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
  const { toast } = useToast(); // Add toast hook
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
    // After settings load, if a pending shop name exists from signup, persist it once
    const applyPendingShopName = async () => {
      try {
        if (typeof window === 'undefined') return;
        const pending = localStorage.getItem('pendingShopName');
        if (!pending || !user?.uid) return;
        await supabase
          .from('user_settings')
          .upsert({ user_id: user.uid, shop_name: pending }, { onConflict: 'user_id' });
        localStorage.removeItem('pendingShopName');
      } catch { }
    };
    applyPendingShopName();
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
    revenueMoM,
    invoicesMoM
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

    // Date ranges
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // Helper to check interval
    const inRange = (d: Date, start: Date, end: Date) => isWithinInterval(d, { start, end });

    // Current Month Stats
    const paidThisMonth = paid.filter((inv) => inRange(new Date(inv.invoiceDate), currentMonthStart, currentMonthEnd));
    const totalPaidThisMonth = paidThisMonth.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const countPaidThisMonth = paidThisMonth.length;

    // Last Month Stats
    const paidLastMonth = paid.filter((inv) => inRange(new Date(inv.invoiceDate), lastMonthStart, lastMonthEnd));
    const totalPaidLastMonth = paidLastMonth.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const countPaidLastMonth = paidLastMonth.length;

    // MoM Calculations
    const revenueMoM = totalPaidLastMonth === 0
      ? (totalPaidThisMonth > 0 ? 100 : 0)
      : ((totalPaidThisMonth - totalPaidLastMonth) / totalPaidLastMonth) * 100;

    const invoicesMoM = countPaidLastMonth === 0
      ? (countPaidThisMonth > 0 ? 100 : 0)
      : ((countPaidThisMonth - countPaidLastMonth) / countPaidLastMonth) * 100;

    const paidInvoicesAllTime = paid.length;
    const totalCustomers = new Set(invoices.map((inv) => inv.customerName)).size;
    const outstandingDueAmount = due.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const outstandingDueCount = due.length;

    // 7-day trend (keeping existing logic for chart or other uses if needed, but focusing on MoM for cards)
    const today = startOfDay(new Date());
    const start7 = subDays(today, 6);
    const prevStart7 = subDays(start7, 7);
    const prevEnd7 = subDays(start7, 1);
    const paid7 = paid.filter((inv) => inRange(new Date(inv.invoiceDate), start7, today));
    const paidPrev7 = paid.filter((inv) => inRange(new Date(inv.invoiceDate), prevStart7, prevEnd7));
    const sales7 = paid7.reduce((s, inv) => s + inv.grandTotal, 0);
    const salesPrev7 = paidPrev7.reduce((s, inv) => s + inv.grandTotal, 0);
    const sales7dChangePct = salesPrev7 === 0 ? (sales7 > 0 ? 100 : null) : ((sales7 - salesPrev7) / salesPrev7) * 100;

    return {
      totalPaidThisMonth,
      totalCustomers,
      paidInvoicesAllTime,
      outstandingDueAmount,
      outstandingDueCount,
      sales7dChangePct,
      revenueMoM,
      invoicesMoM
    };
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

    // Calculate sales by day
    const salesByDay = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((acc, inv) => {
        const date = format(new Date(inv.invoiceDate), 'yyyy-MM-dd');
        acc[date] = (acc[date] || 0) + inv.grandTotal;
        return acc;
      }, {} as Record<string, number>);

    // Last 7 days for cleaner bar chart
    const last7DaysDates = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd')).reverse();
    return last7DaysDates.map((date) => ({
      date: format(new Date(date), 'EEE'),
      fullDate: format(new Date(date), 'MMM dd'),
      sales: salesByDay[date] || 0,
    }));
  }, [invoices, isLoading]);

  const handlePrintPdf = async (invoiceId: string) => {
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

      // Create a Blob URL
      const url = URL.createObjectURL(pdfBlob);

      // Create an invisible iframe to print
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);

      // Wait for the iframe to load, then print
      iframe.onload = () => {
        iframe.contentWindow?.print();
        // Cleanup after a delay
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
        }, 1000);
      };

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
    <div className="space-y-8">
      {/* First-time User Welcome */}
      <FirstTimeWelcome settings={settings} isLoading={isLoading} hasInvoices={!!(invoices && invoices.length > 0)} />

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
          trend={revenueMoM !== null && revenueMoM !== undefined ? { value: Number(revenueMoM.toFixed(0)), label: 'vs last month' } : undefined}
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
          trend={invoicesMoM !== null && invoicesMoM !== undefined ? { value: Number(invoicesMoM.toFixed(0)), label: 'vs last month' } : undefined}
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

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4 glass-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Sales Trend</CardTitle>
            <CardDescription>Daily revenue over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#D4AF37" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  width={45}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(212, 175, 55, 0.2)',
                    borderRadius: '12px',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                  }}
                  itemStyle={{ color: '#D4AF37' }}
                  cursor={{ fill: 'rgba(212, 175, 55, 0.1)' }}
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Sales']}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      return payload[0].payload.fullDate;
                    }
                    return label;
                  }}
                />
                <Bar
                  dataKey="sales"
                  fill="url(#barGradient)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={80}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Side Panels */}
        <div className="space-y-8 col-span-1 lg:col-span-3">
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
                <div className="space-y-4">
                  {topCustomers.map(([name, stats], i) => (
                    <div key={name} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-[#D4AF37] text-[#0F172A]' :
                          i === 1 ? 'bg-gray-300 text-gray-800' :
                            i === 2 ? 'bg-orange-300 text-orange-900' :
                              'bg-primary/10 text-primary'
                          }`}>
                          {i + 1}
                        </div>
                        <div>
                          <div className="font-medium truncate text-sm">{name}</div>
                          <div className="text-xs text-muted-foreground">{stats.invoiceCount} orders</div>
                        </div>
                      </div>
                      <div className="font-bold text-foreground text-sm">{formatCurrency(stats.totalPurchase)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center h-24 flex items-center justify-center">No customer data available.</p>
              )}
            </CardContent>
          </Card>

          {/* Due Invoices */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading text-xl">Due Invoices</CardTitle>
              <CardDescription>Grouped by urgency</CardDescription>
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
                    .sort((a, b) => new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime());

                  if (dueInvoices.length === 0) {
                    return (
                      <p className="text-sm text-muted-foreground text-center h-24 flex items-center justify-center">No due invoices. 🎉</p>
                    );
                  }

                  const today = startOfDay(new Date());

                  const critical = dueInvoices.filter(inv => {
                    const age = Math.floor((today.getTime() - new Date(inv.invoiceDate).getTime()) / (1000 * 60 * 60 * 24));
                    return age > 7;
                  });

                  const warning = dueInvoices.filter(inv => {
                    const age = Math.floor((today.getTime() - new Date(inv.invoiceDate).getTime()) / (1000 * 60 * 60 * 24));
                    return age >= 3 && age <= 7;
                  });

                  const recent = dueInvoices.filter(inv => {
                    const age = Math.floor((today.getTime() - new Date(inv.invoiceDate).getTime()) / (1000 * 60 * 60 * 24));
                    return age < 3;
                  });

                  const renderInvoiceRow = (inv: Invoice, colorClass: string) => {
                    const ageDays = Math.max(0, Math.floor((today.getTime() - new Date(inv.invoiceDate).getTime()) / (1000 * 60 * 60 * 24)));
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
                            <span className={colorClass}>
                              {ageDays}d overdue
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Link href={`/dashboard/invoices/view?id=${inv.id}`}>
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
                  };

                  return (
                    <div className="space-y-4">
                      {critical.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold text-red-500 uppercase tracking-wider">
                            <span>Critical ({critical.length})</span>
                            <span>{formatCurrency(critical.reduce((s, i) => s + i.grandTotal, 0))}</span>
                          </div>
                          <ul className="space-y-1">
                            {critical.map(inv => renderInvoiceRow(inv, "text-red-600 font-bold"))}
                          </ul>
                        </div>
                      )}

                      {warning.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold text-yellow-500 uppercase tracking-wider">
                            <span>Warning ({warning.length})</span>
                            <span>{formatCurrency(warning.reduce((s, i) => s + i.grandTotal, 0))}</span>
                          </div>
                          <ul className="space-y-1">
                            {warning.map(inv => renderInvoiceRow(inv, "text-yellow-600 font-medium"))}
                          </ul>
                        </div>
                      )}

                      {recent.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <span>Recent ({recent.length})</span>
                            <span>{formatCurrency(recent.reduce((s, i) => s + i.grandTotal, 0))}</span>
                          </div>
                          <ul className="space-y-1">
                            {recent.map(inv => renderInvoiceRow(inv, "text-muted-foreground"))}
                          </ul>
                        </div>
                      )}
                    </div>
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
                              <Link href={`/dashboard/invoices/view?id=${invoice.id}`} className="cursor-pointer flex items-center">
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/invoices/edit?id=${invoice.id}`} className="cursor-pointer flex items-center">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePrintPdf(invoice.id)} className="cursor-pointer flex items-center">
                              <Printer className="mr-2 h-4 w-4" />
                              Print
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
      </Card >
    </div >
  );
}
