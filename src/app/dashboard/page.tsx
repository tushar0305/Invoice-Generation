'use client';

import { useActiveShop } from '@/hooks/use-active-shop';

import { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Eye,
  MessageCircle,
  FileText,
  ArrowRight,
  Plus,
  UserPlus,
  PackagePlus,
  Settings,
  TrendingUp,
  Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GoldSilverTicker } from '@/components/dashboard/gold-silver-ticker';
import { useToast } from '@/hooks/use-toast';
import { haptics } from '@/lib/haptics';
import { ImpactStyle } from '@capacitor/haptics';
import type { Invoice, InvoiceItem } from '@/lib/definitions';
import { formatCurrency, cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { startOfMonth, endOfMonth, subMonths, isWithinInterval, startOfDay } from 'date-fns';
import { useUser } from '@/supabase/provider';
import { supabase } from '@/supabase/client';
import { shareInvoicePdfById } from '@/lib/share';
import type { UserSettings } from '@/lib/definitions';
import { ShopSetupBanner } from '@/components/shop-setup-banner';
import { FirstTimeWelcome } from '@/components/first-time-welcome';
import { SmartHero } from '@/components/dashboard/smart-hero';
import { MotionWrapper } from '@/components/ui/motion-wrapper';

export default function DashboardPage() {
  const { user } = useUser();
  const { activeShop, userRole, isLoading: shopLoading } = useActiveShop();
  const { toast } = useToast();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user || !activeShop?.id) {
        setInvoices([]);
        setSettings(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const [{ data: inv, error: invErr }, { data: setData, error: setErr }] = await Promise.all([
        supabase
          .from('invoices')
          .select('*')
          .eq('shop_id', activeShop.id),
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
        setInvoices(mapped);
      }
      if (setErr) {
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
  }, [user?.uid, activeShop?.id]);


  const recentInvoices = useMemo(() => {
    if (!invoices) return [];
    return [...invoices].sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()).slice(0, 5);
  }, [invoices]);

  const {
    totalPaidThisMonth,
    revenueMoM,
  } = useMemo(() => {
    if (isLoading || !invoices) {
      return {
        totalPaidThisMonth: 0,
        revenueMoM: null as number | null,
      };
    }
    const paid = invoices.filter((inv) => inv.status === 'paid');

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

    // Last Month Stats
    const paidLastMonth = paid.filter((inv) => inRange(new Date(inv.invoiceDate), lastMonthStart, lastMonthEnd));
    const totalPaidLastMonth = paidLastMonth.reduce((sum, inv) => sum + inv.grandTotal, 0);

    // MoM Calculations
    const revenueMoM = totalPaidLastMonth === 0
      ? (totalPaidThisMonth > 0 ? 100 : 0)
      : ((totalPaidThisMonth - totalPaidLastMonth) / totalPaidLastMonth) * 100;

    return {
      totalPaidThisMonth,
      revenueMoM,
    };
  }, [invoices, isLoading]);

  const dueInvoices = useMemo(() => {
    if (!invoices) return [];
    return invoices
      .filter(inv => inv.status === 'due')
      .sort((a, b) => new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime())
      .slice(0, 5);
  }, [invoices]);

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      {/* First-time User Welcome */}
      {userRole?.role === 'owner' && (
        <FirstTimeWelcome settings={settings} isLoading={isLoading} hasInvoices={!!(invoices && invoices.length > 0)} />
      )}

      {/* Shop Setup Banner */}
      {userRole?.role === 'owner' && (
        <ShopSetupBanner settings={settings} isLoading={isLoading} />
      )}

      {/* Smart Hero Section */}
      <SmartHero
        invoices={invoices}
        revenueMoM={revenueMoM}
        totalRevenue={totalPaidThisMonth}
      />

      {/* Gold & Silver Ticker */}
      <GoldSilverTicker />

      {/* Quick Actions Grid */}
      <MotionWrapper className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'New Invoice', icon: Plus, href: '/dashboard/invoices/new', color: 'text-primary' },
          { label: 'View Customers', icon: Users, href: '/dashboard/customers', color: 'text-blue-400' },
          { label: 'Add Stock', icon: PackagePlus, href: '/dashboard/stock', color: 'text-emerald-400' },
          { label: 'Sales Insights', icon: TrendingUp, href: '/dashboard/insights', color: 'text-purple-400' },
        ].map((action, i) => (
          <Link key={i} href={action.href}>
            <Card className="glass-card hover:bg-white/5 transition-all cursor-pointer h-full border-white/5 hover:border-primary/20 group">
              <CardContent className="p-4 flex flex-col items-center justify-center gap-3 text-center h-full">
                <div className={cn("p-3 rounded-full bg-white/5 group-hover:scale-110 transition-transform duration-300", action.color)}>
                  <action.icon className="h-6 w-6" />
                </div>
                <span className="font-medium text-sm">{action.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </MotionWrapper>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Recent Invoices */}
        <Card className="glass-card border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => router.push('/dashboard/invoices')}>
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentInvoices.length > 0 ? (
              <div className="space-y-4">
                {recentInvoices.map(invoice => (
                  <div key={invoice.id} className="flex items-center justify-between group cursor-pointer" onClick={() => router.push(`/dashboard/invoices/view?id=${invoice.id}`)}>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
                        invoice.status === 'paid' ? "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20" : "bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20"
                      )}>
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{invoice.customerName}</p>
                        <p className="text-xs text-muted-foreground">{invoice.invoiceNumber} • {new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatCurrency(invoice.grandTotal)}</p>
                      <span className={cn(
                        "text-[10px] capitalize",
                        invoice.status === 'paid' ? "text-emerald-500" : "text-amber-500"
                      )}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">No recent activity</div>
            )}
          </CardContent>
        </Card>

        {/* Due Invoices / Alerts */}
        <Card className="glass-card border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Pending Actions</CardTitle>
            {dueInvoices.length > 0 && (
              <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                {dueInvoices.length} Due
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
              </div>
            ) : dueInvoices.length > 0 ? (
              <div className="space-y-3">
                {dueInvoices.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      <div>
                        <p className="font-medium text-sm">{inv.customerName}</p>
                        <p className="text-xs text-red-400">Due: {formatCurrency(inv.grandTotal)}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-red-500/20 hover:text-red-400" onClick={() => shareInvoicePdfById(inv.id, inv, settings || undefined)}>
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Link href={`/dashboard/invoices/view?id=${inv.id}`}>
                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/10">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <p className="text-sm">All caught up! No pending actions.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
