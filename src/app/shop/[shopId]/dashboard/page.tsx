import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Eye,
  FileText,
  ArrowRight,
  Plus,
  PackagePlus,
  TrendingUp,
  Users
} from 'lucide-react';
import { GoldSilverTicker } from '@/components/dashboard/gold-silver-ticker';
import { formatCurrency, cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/supabase/server';
import { SmartHero } from '@/components/dashboard/smart-hero';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { startOfMonth, endOfMonth, startOfWeek, startOfDay, subMonths } from 'date-fns';

// Types for the RPC response
type DashboardStats = {
  totalPaidThisMonth: number;
  totalPaidThisWeek: number;
  totalPaidToday: number;
  revenueMoM: number;
  recentInvoices: any[];
  dueInvoices: any[];
};

async function getDashboardData(shopId: string) {
  const supabase = await createClient();
  const now = new Date();

  // Calculate date ranges for the RPC call
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();
  const weekStart = startOfWeek(now).toISOString();
  const todayStart = startOfDay(now).toISOString();
  const lastMonthStart = startOfMonth(subMonths(now, 1)).toISOString();
  const lastMonthEnd = endOfMonth(subMonths(now, 1)).toISOString();

  const { data, error } = await supabase.rpc('get_dashboard_stats', {
    p_shop_id: shopId,
    p_month_start: monthStart,
    p_month_end: monthEnd,
    p_week_start: weekStart,
    p_today_start: todayStart,
    p_last_month_start: lastMonthStart,
    p_last_month_end: lastMonthEnd
  });

  if (error) {
    console.error('Error fetching dashboard stats:', error);
    return null;
  }

  return data as DashboardStats;
}

export default async function DashboardPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  const stats = await getDashboardData(shopId);

  if (!stats) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-destructive">Failed to load dashboard data</h2>
        <p className="text-muted-foreground">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-24 md:pb-8 w-full">
      {/* Smart Hero Section */}
      <SmartHero
        invoices={stats.recentInvoices} // Pass recent invoices for context if needed, or adjust component
        revenueMoM={stats.revenueMoM}
        totalRevenue={stats.totalPaidThisMonth}
        totalWeekRevenue={stats.totalPaidThisWeek}
        totalTodayRevenue={stats.totalPaidToday}
      />

      {/* Gold & Silver Ticker */}
      <GoldSilverTicker />

      {/* Quick Actions Grid */}
      <MotionWrapper className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'New Invoice', icon: Plus, href: `/shop/${shopId}/invoices/new`, color: 'text-gold-600 dark:text-gold-400' },
          { label: 'View Customers', icon: Users, href: `/shop/${shopId}/customers`, color: 'text-blue-500 dark:text-blue-400' },
          { label: 'Add Stock', icon: PackagePlus, href: `/shop/${shopId}/stock`, color: 'text-emerald-500 dark:text-emerald-400' },
          { label: 'Sales Insights', icon: TrendingUp, href: `/shop/${shopId}/insights`, color: 'text-purple-500 dark:text-purple-400' },
        ].map((action, i) => (
          <Link key={i} href={action.href} className="focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 rounded-xl stagger-item">
            <Card className="glass-card card-lift hover:bg-gold-500/5 cursor-pointer h-full border-white/10 hover:border-gold-500/30 group min-h-[120px]">
              <CardContent className="p-3 md:p-4 flex flex-col items-center justify-center gap-2 md:gap-3 text-center h-full min-h-[110px]">
                <div className={cn("p-3 rounded-full bg-white/5 group-hover:scale-110 transition-all duration-300 border border-white/5 group-hover:border-gold-500/20 group-hover:shadow-md min-w-[44px] min-h-[44px] flex items-center justify-center", action.color)}>
                  <action.icon className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <span className="font-bold text-xs md:text-sm font-heading tracking-wide">{action.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </MotionWrapper>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Recent Invoices */}
        <Card className="glass-panel card-lift border-gold-500/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gold-500/5">
            <CardTitle className="text-lg font-heading font-bold text-foreground">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-8 text-muted-foreground hover:text-gold-500 transition-colors" asChild>
              <Link href={`/shop/${shopId}/invoices`}>
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {stats.recentInvoices.length > 0 ? (
              <div className="space-y-2">
                {stats.recentInvoices.map((invoice, index) => (
                  <Link
                    key={invoice.id}
                    href={`/shop/${shopId}/invoices/view?id=${invoice.id}`}
                    className="flex items-center justify-between group cursor-pointer p-3 rounded-lg hover:bg-gold-500/5 transition-all duration-200 border border-transparent hover:border-gold-500/10 stagger-item"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200 border",
                        invoice.status === 'paid'
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 group-hover:border-emerald-500/30 group-hover:shadow-sm"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/20 group-hover:border-amber-500/30 group-hover:shadow-sm"
                      )}>
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground group-hover:text-gold-600 transition-colors">{invoice.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{invoice.invoice_number} • {new Date(invoice.invoice_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-foreground">{formatCurrency(invoice.grand_total)}</p>
                      <span className={cn(
                        "text-[10px] capitalize font-medium px-2 py-0.5 rounded-full",
                        invoice.status === 'paid' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                      )}>
                        {invoice.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No recent invoices</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card className="glass-panel card-lift border-gold-500/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gold-500/5">
            <CardTitle className="text-lg font-heading font-bold text-foreground">Pending Actions</CardTitle>
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
              {stats.dueInvoices.length}
            </Badge>
          </CardHeader>
          <CardContent className="pt-4">
            {stats.dueInvoices.length > 0 ? (
              <div className="space-y-2">
                {stats.dueInvoices.map((invoice, index) => (
                  <Link
                    key={invoice.id}
                    href={`/shop/${shopId}/invoices/view?id=${invoice.id}`}
                    className="flex items-center justify-between group cursor-pointer p-3 rounded-lg hover:bg-amber-500/5 transition-all duration-200 border border-transparent hover:border-amber-500/10 stagger-item"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center bg-amber-500/10 text-amber-500 border border-amber-500/20 group-hover:border-amber-500/30 group-hover:shadow-sm transition-all duration-200">
                        <Eye className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground group-hover:text-amber-600 transition-colors">{invoice.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{invoice.invoice_number}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-foreground">{formatCurrency(invoice.grand_total)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Eye className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No pending invoices</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
