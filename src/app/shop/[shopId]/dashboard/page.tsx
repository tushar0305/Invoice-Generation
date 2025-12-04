import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, FileText, ArrowRight } from 'lucide-react';
import { GoldSilverTicker } from '@/components/dashboard/gold-silver-ticker';
import { formatCurrency, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/supabase/server';
import { KPICard } from '@/components/dashboard/kpi-card';
import { FinelessHero } from '@/components/dashboard/fineless-hero';
import { FloatingActions } from '@/components/dashboard/floating-actions';
import { KPICardSkeleton, HeroSkeleton } from '@/components/dashboard/skeleton-loaders';
import { CompactStatsRow } from '@/components/dashboard/compact-stats-row';
import { LowStockWidget } from '@/components/dashboard/low-stock-widget';
import { PendingPaymentsWidget } from '@/components/dashboard/pending-payments-widget';
import { LoyaltyWidget } from '@/components/dashboard/loyalty-widget';
import { BusinessHealthWidget } from '@/components/dashboard/business-health';
import { CustomerInsightsWidget } from '@/components/dashboard/customer-insights';
import { MobileDashboardClient } from '@/components/mobile/mobile-dashboard-client';
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

async function getMarketRates() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('market_rates')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();
  return data;
}

async function getAdditionalStats(shopId: string) {
  const supabase = await createClient();

  // Get low stock items
  const { data: lowStockItems } = await supabase
    .from('stock')
    .select('id, item_name, current_quantity, min_quantity, unit')
    .eq('shop_id', shopId)
    .lt('current_quantity', supabase.rpc('get_min_quantity'))
    .limit(5);

  // Get active loans count
  const { count: activeLoans } = await supabase
    .from('loans')
    .select('*', { count: 'exact', head: true })
    .eq('shop_id', shopId)
    .eq('status', 'active');

  // Get khata balance
  const { data: khataData } = await supabase
    .from('khata_transactions')
    .select('type, amount')
    .eq('shop_id', shopId);

  const khataBalance = khataData?.reduce((acc, t) => {
    return acc + (t.type === 'credit' ? Number(t.amount) : -Number(t.amount));
  }, 0) || 0;

  // Get loyalty points
  const { data: loyaltyData } = await supabase
    .from('customer_loyalty')
    .select('total_points')
    .eq('shop_id', shopId);

  const totalPoints = loyaltyData?.reduce((acc, c) => acc + (c.total_points || 0), 0) || 0;

  // Get total invoice count
  const { count: totalInvoices } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('shop_id', shopId);

  return {
    lowStockItems: lowStockItems || [],
    activeLoans: activeLoans || 0,
    khataBalance,
    totalLoyaltyPoints: totalPoints,
    totalInvoices: totalInvoices || 0,
    loyaltyMembers: loyaltyData?.length || 0
  };
}

// Helper to generate sparkline data
function generateSparkline(invoices: any[], days: number = 7): number[] {
  const data: number[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - i);
    const dateStr = targetDate.toISOString().split('T')[0];

    const dayTotal = invoices
      .filter((inv: any) => inv.invoice_date?.startsWith(dateStr) && inv.status === 'paid')
      .reduce((sum: number, inv: any) => sum + Number(inv.grand_total || 0), 0);

    data.push(dayTotal);
  }

  const max = Math.max(...data, 1);
  return data.map(v => (v / max) * 100);
}

export default async function DashboardPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  const [stats, marketRates, additionalStats] = await Promise.all([
    getDashboardData(shopId),
    getMarketRates(),
    getAdditionalStats(shopId)
  ]);

  if (!stats) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-destructive">Failed to load dashboard data</h2>
        <p className="text-muted-foreground">Please try refreshing the page.</p>
      </div>
    );
  }

  // Calculate metrics
  const uniqueCustomers = new Set(stats.recentInvoices.map((inv: any) => inv.customer_phone));
  const totalUniqueCustomers = uniqueCustomers.size;

  const monthSparkline = generateSparkline(stats.recentInvoices, 30);
  const weekSparkline = generateSparkline(stats.recentInvoices, 7);

  const lastMonthRevenue = stats.totalPaidThisMonth / (1 + (stats.revenueMoM / 100));
  const changeAmount = stats.totalPaidThisMonth - lastMonthRevenue;

  // Calculate pending payments
  const totalDue = stats.dueInvoices.reduce((sum: number, inv: any) => sum + Number(inv.grand_total), 0);
  const overdueInvoices = stats.dueInvoices.filter((inv: any) => {
    const dueDate = new Date(inv.due_date);
    return dueDate < new Date();
  });

  // Customer insights
  const returningCustomers = Math.floor(totalUniqueCustomers * 0.3);
  const newCustomers = totalUniqueCustomers - returningCustomers;

  // Top customer
  const customerSpending: Record<string, { name: string, total: number, count: number }> = {};
  stats.recentInvoices.forEach((inv: any) => {
    const id = inv.customer_phone || 'unknown';
    if (!customerSpending[id]) {
      customerSpending[id] = { name: inv.customer_name, total: 0, count: 0 };
    }
    customerSpending[id].total += Number(inv.grand_total);
    customerSpending[id].count += 1;
  });
  const topCustomerEntry = Object.values(customerSpending).sort((a, b) => b.total - a.total)[0];
  const topCustomer = topCustomerEntry ? {
    name: topCustomerEntry.name,
    totalSpent: topCustomerEntry.total,
    orders: topCustomerEntry.count
  } : undefined;

  // Business health metrics
  const recentTotal = stats.recentInvoices.reduce((sum: number, inv: any) => sum + Number(inv.grand_total), 0);
  const recentCount = stats.recentInvoices.length;

  return (
    <>
      <MobileDashboardClient 
        shopId={shopId}
        stats={stats}
        marketRates={marketRates}
        lowStockItems={additionalStats.lowStockItems}
        activeLoans={additionalStats.activeLoans}
        khataBalance={additionalStats.khataBalance}
        loyaltyPoints={additionalStats.totalLoyaltyPoints}
      />
      <div className="hidden md:flex flex-col gap-3 p-3 md:p-4 lg:p-6 pb-24 max-w-[1800px] mx-auto">

      {/* Floating Action Button */}
      <FloatingActions shopId={shopId} />

      {/* Gold & Silver Ticker - NOW AT TOP */}
      <GoldSilverTicker initialData={marketRates} />

      {/* Compact Hero Banner */}
      <Suspense fallback={<HeroSkeleton />}>
        <FinelessHero
          title="Balance"
          value={stats.totalPaidThisMonth}
          change={stats.revenueMoM}
          changeAmount={changeAmount}
          sparklineData={monthSparkline}
          viewMoreHref={`/shop/${shopId}/invoices`}
        />
      </Suspense>

      {/* KPI Cards Grid - 4 columns */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Suspense fallback={<KPICardSkeleton index={0} />}>
          <KPICard
            title="This Month"
            value={formatCurrency(stats.totalPaidThisMonth)}
            change={stats.revenueMoM}
            changeLabel="vs last month"
            sparklineData={monthSparkline.slice(-7)}
            href={`/shop/${shopId}/invoices`}
            index={0}
          />
        </Suspense>

        <Suspense fallback={<KPICardSkeleton index={1} />}>
          <KPICard
            title="This Week"
            value={formatCurrency(stats.totalPaidThisWeek)}
            change={stats.totalPaidThisWeek > 0 ?
              ((stats.totalPaidThisWeek - (stats.totalPaidThisMonth / 4)) / (stats.totalPaidThisMonth / 4)) * 100 : 0}
            changeLabel="vs weekly avg"
            sparklineData={weekSparkline}
            href={`/shop/${shopId}/invoices`}
            index={1}
          />
        </Suspense>

        <Suspense fallback={<KPICardSkeleton index={2} />}>
          <KPICard
            title="Today"
            value={formatCurrency(stats.totalPaidToday)}
            change={stats.totalPaidToday > 0 && stats.totalPaidThisWeek > 0 ?
              ((stats.totalPaidToday - (stats.totalPaidThisWeek / 7)) / (stats.totalPaidThisWeek / 7)) * 100 : 0}
            changeLabel="vs daily avg"
            sparklineData={weekSparkline.slice(-3)}
            index={2}
          />
        </Suspense>

        <Suspense fallback={<KPICardSkeleton index={3} />}>
          <KPICard
            title="Customers"
            value={totalUniqueCustomers.toString()}
            change={15}
            changeLabel="new this month"
            sparklineData={[40, 55, 45, 65, 70, 85, 90]}
            href={`/shop/${shopId}/customers`}
            index={3}
          />
        </Suspense>
      </div>

      {/* Compact Stats Row - Quick Chips */}
      <CompactStatsRow
        shopId={shopId}
        totalInvoices={additionalStats.totalInvoices}
        activeLoans={additionalStats.activeLoans}
        khataBalance={additionalStats.khataBalance}
        loyaltyPoints={additionalStats.totalLoyaltyPoints}
      />

      {/* Quick Insights - 3 Compact Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <LowStockWidget
          shopId={shopId}
          items={additionalStats.lowStockItems.map((item: any) => ({
            id: item.id,
            name: item.item_name,
            currentQty: item.current_quantity,
            minQty: item.min_quantity || 5,
            unit: item.unit || 'pcs'
          }))}
        />

        <PendingPaymentsWidget
          shopId={shopId}
          pendingCount={stats.dueInvoices.length}
          totalDue={totalDue}
          overdueCount={overdueInvoices.length}
        />

        <LoyaltyWidget
          shopId={shopId}
          totalPointsDistributed={additionalStats.totalLoyaltyPoints}
          activeMembers={additionalStats.loyaltyMembers}
          topRewarder={topCustomer ? { name: topCustomer.name, points: Math.floor(topCustomer.totalSpent / 100) } : undefined}
        />
      </div>

      {/* Business Analytics - 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <BusinessHealthWidget
          totalRevenue={stats.totalPaidThisMonth}
          totalOrders={recentCount > 0 ? Math.round(stats.totalPaidThisMonth / (recentTotal / recentCount)) : 0}
          previousRevenue={lastMonthRevenue}
        />
        <CustomerInsightsWidget
          newCustomers={newCustomers}
          returningCustomers={returningCustomers}
          topCustomer={topCustomer}
        />
      </div>

      {/* Activity Cards - 2 columns */}
      <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
        {/* Recent Invoices */}
        <Card className="bg-white/50 dark:bg-card/40 backdrop-blur-md border-gray-200 dark:border-white/10 shadow-lg hover:shadow-glow-sm transition-all duration-300">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-gray-100 dark:border-white/5">
            <CardTitle className="text-sm font-semibold text-foreground">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-muted-foreground hover:text-primary hover:bg-primary/10" asChild>
              <Link href={`/shop/${shopId}/invoices`}>
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-3">
            {stats.recentInvoices.length > 0 ? (
              <div className="space-y-1.5">
                {stats.recentInvoices.slice(0, 4).map((invoice: any) => (
                  <Link
                    key={invoice.id}
                    href={`/shop/${shopId}/invoices/view?id=${invoice.id}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-gray-100 dark:hover:border-white/10 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center text-xs shadow-sm",
                        invoice.status === 'paid'
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20"
                      )}>
                        <FileText className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="font-medium text-xs text-foreground group-hover:text-primary transition-colors">{invoice.customer_name}</p>
                        <p className="text-[10px] text-muted-foreground">{invoice.invoice_number}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-xs text-foreground glow-text-sm">{formatCurrency(invoice.grand_total)}</p>
                      <span className={cn(
                        "text-[9px] capitalize font-medium px-1.5 py-0.5 rounded-full inline-block mt-0.5",
                        invoice.status === 'paid'
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-500"
                      )}>
                        {invoice.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <FileText className="h-6 w-6 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">No invoices yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card className="bg-white/50 dark:bg-card/40 backdrop-blur-md border-gray-200 dark:border-white/10 shadow-lg hover:shadow-glow-sm transition-all duration-300">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-gray-100 dark:border-white/5">
            <CardTitle className="text-sm font-semibold text-foreground">Pending Actions</CardTitle>
            <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20">
              {stats.dueInvoices.length}
            </Badge>
          </CardHeader>
          <CardContent className="p-3">
            {stats.dueInvoices.length > 0 ? (
              <div className="space-y-1.5">
                {stats.dueInvoices.slice(0, 4).map((invoice: any) => (
                  <Link
                    key={invoice.id}
                    href={`/shop/${shopId}/invoices/view?id=${invoice.id}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-gray-100 dark:hover:border-white/10 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20 shadow-sm">
                        <Eye className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="font-medium text-xs text-foreground group-hover:text-primary transition-colors">{invoice.customer_name}</p>
                        <p className="text-[10px] text-muted-foreground">{invoice.invoice_number}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-xs text-foreground glow-text-sm">{formatCurrency(invoice.grand_total)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Eye className="h-6 w-6 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">All caught up!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
