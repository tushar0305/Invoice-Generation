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
import { MoreHorizontal, Eye, Edit, Printer, DollarSign, Users, CreditCard, MessageCircle, FileText, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GoldSilverTicker } from '@/components/dashboard/gold-silver-ticker';
import { useToast } from '@/hooks/use-toast';
import { haptics } from '@/lib/haptics';
import { ImpactStyle } from '@capacitor/haptics';
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
import { SmartHero } from '@/components/dashboard/smart-hero';
import { StatsCard } from '@/components/dashboard/stats-card';
import { MotionWrapper, FadeIn } from '@/components/ui/motion-wrapper';

type CustomerStats = {
  totalPurchase: number;
  invoiceCount: number;
};

export default function DashboardPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
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
        revenueMoM: null as number | null,
        invoicesMoM: null as number | null,
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
        templateId: userSettings.template_id || 'classic',
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

      {/* Gold & Silver Ticker */}
      <GoldSilverTicker />

      {/* Smart Hero Section */}
      <SmartHero
        invoices={invoices}
        revenueMoM={revenueMoM}
        totalRevenue={totalPaidThisMonth}
      />

      {/* Stats Grid */}
      <MotionWrapper className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(totalPaidThisMonth)}
          icon={DollarSign}
          trend={revenueMoM !== null && revenueMoM !== undefined ? { value: Number(revenueMoM.toFixed(0)), label: 'vs last month' } : undefined}
          context={revenueMoM !== null && revenueMoM !== undefined ? (revenueMoM > 0 ? "Revenue is up! 🔥" : "Revenue is down") : undefined}
          loading={isLoading}
          action={{ label: "View Details", onClick: () => { haptics.impact(ImpactStyle.Light); router.push("/dashboard/invoices"); } }}
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
          action={outstandingDueCount > 0 ? { label: "Chase Payments", onClick: () => { haptics.impact(ImpactStyle.Light); router.push("/dashboard/invoices?status=due"); } } : undefined}
        />
      </MotionWrapper>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4 glass-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Sales Trend</CardTitle>
            <CardDescription>Daily revenue over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={400}>
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
                  tickFormatter={(value) => {
                    if (value === 0) return '₹0';
                    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
                    return `₹${value}`;
                  }}
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
              <CardDescription>By total revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={`skel-cust-${i}`} className="flex items-center justify-between">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                (() => {
                  const customerStats = (invoices || []).reduce((acc, inv) => {
                    if (!acc[inv.customerName]) {
                      acc[inv.customerName] = {
                        total: 0,
                        count: 0,
                        lastOrder: new Date(inv.invoiceDate),
                        phone: inv.customerPhone
                      };
                    }
                    acc[inv.customerName].total += inv.grandTotal;
                    acc[inv.customerName].count += 1;
                    const invDate = new Date(inv.invoiceDate);
                    if (invDate > acc[inv.customerName].lastOrder) {
                      acc[inv.customerName].lastOrder = invDate;
                    }
                    return acc;
                  }, {} as Record<string, { total: number; count: number; lastOrder: Date; phone: string }>);

                  const topCustomers = Object.entries(customerStats)
                    .sort(([, a], [, b]) => b.total - a.total)
                    .slice(0, 5);

                  if (topCustomers.length === 0) {
                    return <p className="text-sm text-muted-foreground text-center py-8">No customer data yet.</p>;
                  }

                  const today = new Date();

                  return (
                    <div className="space-y-4">
                      {topCustomers.map(([name, stats], index) => {
                        const daysSinceLastOrder = Math.floor((today.getTime() - stats.lastOrder.getTime()) / (1000 * 60 * 60 * 24));
                        const isActive = daysSinceLastOrder <= 7;

                        return (
                          <div key={name} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors group">
                            <div className="flex items-center gap-3">
                              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                                {index + 1}
                                {isActive && (
                                  <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" title="Active in last 7 days" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {name}
                                  {index === 0 && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 rounded-full">Top</span>}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {stats.count} orders • Last: {daysSinceLastOrder}d ago
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{formatCurrency(stats.total)}</div>
                              <Link href={`/dashboard/invoices/new?customer=${encodeURIComponent(name)}&phone=${encodeURIComponent(stats.phone || '')}`}>
                                <Button size="sm" variant="ghost" className="h-6 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                                  Create Invoice
                                </Button>
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
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
                            {critical.map(inv => renderInvoiceRow(inv, "text-red-600 font-bold bg-red-500/10 px-2 py-0.5 rounded"))}
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
      </div >

      {/* Recent Invoices List */}
      < Card className="glass-card" >
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-heading text-xl">Recent Invoices</CardTitle>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => router.push('/dashboard/invoices')}>
            View All <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-xl">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          ) : recentInvoices.length > 0 ? (
            <div className="space-y-3">
              {recentInvoices.map(invoice => (
                <div key={invoice.id} className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-border/50 hover:bg-accent/50 transition-all group cursor-pointer" onClick={() => router.push(`/dashboard/invoices/view?id=${invoice.id}`)}>
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${invoice.status === 'paid' ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'}`}>
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{invoice.customerName}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="font-mono">{invoice.invoiceNumber}</span>
                        <span>•</span>
                        <span>{new Date(invoice.invoiceDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">{formatCurrency(invoice.grandTotal)}</div>
                    <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className={cn("mt-1 text-[10px] h-5 px-1.5", invoice.status === 'paid' ? 'bg-green-500/20 text-green-700 hover:bg-green-500/30' : 'bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30')}>
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No recent invoices found.</div>
          )}
        </CardContent>
      </Card >
    </div >
  );
}
