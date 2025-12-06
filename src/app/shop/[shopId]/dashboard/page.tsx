import { startOfMonth, endOfMonth, startOfWeek, startOfDay, subMonths, isSameDay, subDays } from 'date-fns';
import { getCatalogueStats } from '@/actions/catalogue-actions';
import { createClient } from '@/supabase/server';
import { getDashboardData, getMarketRates, getAdditionalStats } from '@/actions/dashboard-actions';
import { FloatingStoreAssistant } from '@/components/dashboard/floating-store-assistant';
import { GoldSilverTicker } from '@/components/dashboard/gold-silver-ticker';
import { FinelessHero } from '@/components/dashboard/fineless-hero';
import { KPICard } from '@/components/dashboard/kpi-card';
import { HeroSkeleton, KPICardSkeleton } from '@/components/dashboard/skeleton-loaders';
import { formatCurrency, cn } from '@/lib/utils';
import { Suspense } from 'react';
import Link from 'next/link';
import { Eye, ArrowRight, FileText } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { CompactStatsRow } from '@/components/dashboard/compact-stats-row';
import { LowStockWidget } from '@/components/dashboard/low-stock-widget';
import { PendingPaymentsWidget } from '@/components/dashboard/pending-payments-widget';
import { LoyaltyWidget } from '@/components/dashboard/loyalty-widget';
import { BusinessHealthWidget } from '@/components/dashboard/business-health';
import { CustomerInsightsWidget } from '@/components/dashboard/customer-insights';

import { DashboardInvoiceRow } from '@/components/dashboard/dashboard-invoice-row';

// Helper function for sparklines
function generateSparkline(invoices: any[], days: number) {
  const data = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i);
    const dailyTotal = invoices
      .filter((inv: any) => isSameDay(new Date(inv.created_at), date))
      .reduce((sum: number, inv: any) => sum + (Number(inv.grand_total) || 0), 0);
    data.push(dailyTotal);
  }
  return data;
}

export default async function DashboardPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  const supabase = await createClient();

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

  // Calculate metrics (previously only for desktop)
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
    <div className="flex flex-col gap-3 p-3 md:p-4 lg:p-6 pb-24 max-w-[1800px] mx-auto">
      {/* Floating AI Assistant */}
      <FloatingStoreAssistant shopId={shopId} />

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
          catalogueStats={stats.catalogueStats}
        />
      </Suspense>

      {/* KPI Cards Grid - 4 columns (responsive) */}
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

      {/* Quick Insights - 3 Compact Widgets (stack on mobile) */}
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

      {/* Business Analytics - 2 columns (stack on mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <BusinessHealthWidget
          totalRevenue={stats.totalPaidThisMonth}
          totalOrders={stats.totalOrdersThisMonth}
          previousRevenue={lastMonthRevenue}
        />
        <CustomerInsightsWidget
          newCustomers={newCustomers}
          returningCustomers={returningCustomers}
          topCustomer={topCustomer}
        />
      </div>

      {/* Activity Cards - 2 columns (stack on mobile) */}
      <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
        {/* Recent Invoices */}
        {/* Recent Invoices */}
        <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-all duration-300">
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
                  <DashboardInvoiceRow key={invoice.id} invoice={invoice} shopId={shopId} />
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
        {/* Pending Actions */}
        <Card className="bg-card border border-border shadow-sm hover:shadow-md transition-all duration-300">
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
                  <DashboardInvoiceRow key={invoice.id} invoice={invoice} shopId={shopId} />
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
  );
}
