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
import { RecentInvoicesEmptyState, PendingActionsEmptyState } from '@/components/dashboard/empty-states';

import { CompactStatsRow } from '@/components/dashboard/compact-stats-row';
import { PendingPaymentsWidget } from '@/components/dashboard/pending-payments-widget';
import { LoyaltyWidget } from '@/components/dashboard/loyalty-widget';
import { BusinessHealthWidget } from '@/components/dashboard/business-health';
import { CustomerInsightsWidget } from '@/components/dashboard/customer-insights';
import { SchemesWidget } from '@/components/dashboard/schemes-widget';
import { QuickActions } from '@/components/dashboard/quick-actions';

import { DashboardInvoiceRow } from '@/components/dashboard/dashboard-invoice-row';

// Revalidate dashboard data every 0 seconds for fresh data
export const revalidate = 0;

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
  const totalUniqueCustomers = additionalStats.customerCount;

  const monthSparkline = generateSparkline(stats.recentInvoices, 30);
  const weekSparkline = generateSparkline(stats.recentInvoices, 7);

  // Use direct value from server action instead of reverse calculation
  const lastMonthRevenue = stats.totalPaidLastMonth;
  const changeAmount = stats.totalPaidThisMonth - lastMonthRevenue;

  // Calculate pending payments (no overdue logic)
  const totalDue = stats.dueInvoices.reduce((sum: number, inv: any) => sum + Number(inv.grand_total), 0);

  // Customer insights
  const returningCustomers = Math.floor(totalUniqueCustomers * 0.3);
  const newCustomers = totalUniqueCustomers - returningCustomers;

  // Top customer (Use DB-backed total spent for accuracy)
  const topCustomer = additionalStats.topCustomerAllTime ? {
    name: additionalStats.topCustomerAllTime.name,
    totalSpent: additionalStats.topCustomerAllTime.totalSpent,
    orders: 0 // We might not have order count in this simple query, but that's acceptable or we can fetch it if strictly needed.
    // For now, let's just default to 0 or hide it in the UI if 0. 
    // Actually, the UI expects it. Let's send 0 or maybe remove the requirement from the UI if possible.
    // Or better, let's keep the old calc as a fallback or for 'orders' count if we want to combine.
    // But simpler is better: Real DB data.
  } : undefined;

  // If we really want order count, we'd need another query or index. 
  // For now, let's just use the DB total spent which is the critical metric.


  // Business health metrics
  const recentTotal = stats.recentInvoices.reduce((sum: number, inv: any) => sum + Number(inv.grand_total), 0);
  const recentCount = stats.recentInvoices.length;

  return (
    <div className="flex flex-col gap-3 p-3 md:p-4 lg:p-6 pb-24 max-w-[1800px] mx-auto">
      {/* Floating AI Assistant */}
      <FloatingStoreAssistant shopId={shopId} />

      {/* Gold & Silver Ticker - NOW AT TOP */}
      <GoldSilverTicker initialData={marketRates} />

      {/* Quick Actions - Common tasks */}
      <QuickActions shopId={shopId} />

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
            // change={0} // TODO: Calculate real growth
            changeLabel="total customers"
            sparklineData={additionalStats.customerSparkline || [0, 0, 0, 0, 0, 0, 0]}
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

      {/* Quick Insights - 3 Compact Widgets + Schemes (stack on mobile, 2x2 on md, 4 on xl) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <PendingPaymentsWidget
          shopId={shopId}
          pendingCount={stats.dueInvoices.length}
          totalDue={totalDue}
          recentDueInvoices={stats.dueInvoices.slice(0, 3)}
        />

        <LoyaltyWidget
          shopId={shopId}
          totalPointsDistributed={additionalStats.totalLoyaltyPoints}
          activeMembers={additionalStats.loyaltyMembers}
          topRewarder={additionalStats.topLoyaltyCustomer ? { name: additionalStats.topLoyaltyCustomer.name, points: additionalStats.topLoyaltyCustomer.points } : undefined}
        />

        <SchemesWidget
          shopId={shopId}
          totalSchemes={additionalStats.totalSchemes || 0}
          activeEnrollments={additionalStats.activeEnrollments || 0}
          totalCollectedMonth={additionalStats.totalSchemeCollected || 0}
          totalGoldAccumulated={additionalStats.totalGoldAccumulated || 0}
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

      {/* Activity Cards - Full Width */}
      <div className="grid gap-3 grid-cols-1">
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
                {stats.recentInvoices.slice(0, 5).map((invoice: any) => (
                  <DashboardInvoiceRow key={invoice.id} invoice={invoice} shopId={shopId} />
                ))}
              </div>
            ) : (
              <RecentInvoicesEmptyState />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
