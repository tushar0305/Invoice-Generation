import { startOfMonth, endOfMonth, startOfWeek, startOfDay, subMonths, isSameDay, subDays, format } from 'date-fns';
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
import { Eye, ArrowRight, FileText, Calendar, Clock, Store, LayoutGrid, Zap } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RecentInvoicesEmptyState, PendingActionsEmptyState } from '@/components/dashboard/empty-states';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

import { SmartInsightsGrid } from '@/components/dashboard/smart-insights-grid';
// Widget imports - removed PendingPaymentsWidget, SchemesWidget, LoyaltyWidget
import { BusinessHealthWidget } from '@/components/dashboard/business-health';
import { CustomerInsightsWidget } from '@/components/dashboard/customer-insights';
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

import { GoldRateTicker } from '@/components/dashboard/gold-rate-ticker';

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
      <div className="min-h-screen flex items-center justify-center p-8 text-center bg-gray-50 dark:bg-black">
        <div className="max-w-md space-y-4">
          <Store className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold text-foreground">Dashboard Unavailable</h2>
          <p className="text-muted-foreground">We couldn't load your business data. Please check your connection.</p>
          <Button onClick={() => window.location.reload()} variant="outline">Refresh Page</Button>
        </div>
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
  const returningCustomerRate = totalUniqueCustomers > 0 ? (returningCustomers / totalUniqueCustomers) * 100 : 0;
  const newCustomers = totalUniqueCustomers - returningCustomers;

  // Top customer
  const topCustomer = additionalStats.topCustomerAllTime ? {
    name: additionalStats.topCustomerAllTime.name,
    totalSpent: additionalStats.topCustomerAllTime.totalSpent,
    orders: 0
  } : undefined;


  // Business health metrics
  const recentTotal = stats.recentInvoices.reduce((sum: number, inv: any) => sum + Number(inv.grand_total), 0);
  const recentCount = stats.recentInvoices.length;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#0a0a0b] pb-20">
      <div className="max-w-[1600px] mx-auto pt-1 md:pt-1 px-4 md:px-6 lg:px-8 space-y-3 animate-in fade-in duration-500">

        {/* Floating AI Assistant */}
        <FloatingStoreAssistant shopId={shopId} />

        {/* Ticker Section - Full Width, below floating buttons on mobile */}
        <div className="w-full pb-1">
          <GoldSilverTicker initialData={marketRates} />
        </div>

        {/* Hero Section */}
        <section className="-mt-1">
          <Suspense fallback={<HeroSkeleton />}>
            <FinelessHero
              title="Total Balance"
              value={stats.totalPaidThisMonth}
              change={stats.revenueMoM}
              changeAmount={changeAmount}
              sparklineData={monthSparkline}
              viewMoreHref={`/shop/${shopId}/invoices`}
              catalogueStats={stats.catalogueStats}
            />
          </Suspense>
        </section>

        {/* Quick Actions Bar */}
        <section>
          <QuickActions shopId={shopId} />
        </section>

        {/* KPI Grid */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <LayoutGrid className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold tracking-tight text-muted-foreground uppercase">Performance</h2>
          </div>

          {/* Mobile Carousel */}
          <div className="block md:hidden -mx-4 px-4">
            <Carousel opts={{ align: "start", loop: false }} className="w-full">
              <CarouselContent className="-ml-2">
                {[
                  { title: "This Month", value: formatCurrency(stats.totalPaidThisMonth), change: stats.revenueMoM, sparkline: monthSparkline.slice(-7), href: `/shop/${shopId}/invoices` },
                  { title: "This Week", value: formatCurrency(stats.totalPaidThisWeek), change: stats.totalPaidThisWeek > 0 ? ((stats.totalPaidThisWeek - (stats.totalPaidThisMonth / 4)) / (stats.totalPaidThisMonth / 4)) * 100 : 0, sparkline: weekSparkline, href: `/shop/${shopId}/invoices` },
                  { title: "Today", value: formatCurrency(stats.totalPaidToday), change: stats.totalPaidToday > 0 && stats.totalPaidThisWeek > 0 ? ((stats.totalPaidToday - (stats.totalPaidThisWeek / 7)) / (stats.totalPaidThisWeek / 7)) * 100 : 0, sparkline: weekSparkline.slice(-3) },
                  { title: "Customers", value: totalUniqueCustomers.toString(), sparkline: additionalStats.customerSparkline || [0], href: `/shop/${shopId}/customers` }
                ].map((item, idx) => (
                  <CarouselItem key={idx} className="pl-2 basis-[85%]">
                    <div className="h-40">
                      <Suspense fallback={<KPICardSkeleton index={idx} />}>
                        <KPICard
                          title={item.title}
                          value={item.value}
                          sparklineData={item.sparkline}
                          href={item.href}
                          index={idx}
                        />
                      </Suspense>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>

          {/* Desktop Grid */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="h-40">
              <Suspense fallback={<KPICardSkeleton index={0} />}>
                <KPICard
                  title="This Month"
                  value={formatCurrency(stats.totalPaidThisMonth)}
                  change={stats.revenueMoM}
                  sparklineData={monthSparkline.slice(-7)}
                  href={`/shop/${shopId}/invoices`}
                  index={0}
                />
              </Suspense>
            </div>
            <div className="h-40">
              <Suspense fallback={<KPICardSkeleton index={1} />}>
                <KPICard
                  title="This Week"
                  value={formatCurrency(stats.totalPaidThisWeek)}
                  sparklineData={weekSparkline}
                  href={`/shop/${shopId}/invoices`}
                  index={1}
                />
              </Suspense>
            </div>
            <div className="h-40">
              <Suspense fallback={<KPICardSkeleton index={2} />}>
                <KPICard
                  title="Today"
                  value={formatCurrency(stats.totalPaidToday)}
                  sparklineData={weekSparkline.slice(-3)}
                  index={2}
                />
              </Suspense>
            </div>
            <div className="h-40">
              <Suspense fallback={<KPICardSkeleton index={3} />}>
                <KPICard
                  title="Customers"
                  value={totalUniqueCustomers.toString()}
                  sparklineData={additionalStats.customerSparkline || [0, 0, 0, 0]}
                  href={`/shop/${shopId}/customers`}
                  index={3}
                />
              </Suspense>
            </div>
          </div>
        </section>

        {/* Smart Actionable Insights Grid */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h2 className="text-base font-semibold tracking-tight text-muted-foreground uppercase">Actionable Insights</h2>
          </div>

          <SmartInsightsGrid
            shopId={shopId}
            stats={{
              activeEnrollments: additionalStats.activeEnrollments || 0,
              totalSchemeCollected: additionalStats.totalSchemeCollected || 0,
              pendingCount: stats.dueInvoices.length,
              totalDue: totalDue,
              recentDueInvoice: stats.dueInvoices[0],
              activeLoans: additionalStats.activeLoans || 0,
              khataBalance: additionalStats.khataBalance || 0,
              lowStockCount: additionalStats.lowStockItems.length,
              lowStockItem: additionalStats.lowStockItems[0],
              loyaltyPoints: additionalStats.totalLoyaltyPoints || 0,
              loyaltyMembers: additionalStats.loyaltyMembers || 0,
              topLoyaltyCustomer: additionalStats.topLoyaltyCustomer
            }}
          />
        </section>

        {/* Main Content Grid: Business Health & Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left Column: Business Health & Insights */}
          <div className="xl:col-span-1 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <BusinessHealthWidget
                totalRevenue={stats.totalPaidThisMonth}
                totalOrders={stats.totalOrdersThisMonth}
                revenueGrowth={stats.revenueMoM}
                returningRate={returningCustomerRate}
              />

              {/* Fixed Customer Insights Layout - now shares prominence */}
              <CustomerInsightsWidget
                newCustomers={newCustomers}
                returningCustomers={returningCustomers}
                topCustomer={topCustomer}
              />
            </div>
          </div>

          {/* Right Column: Recent Activity */}
          <div className="space-y-6">
            <Card className="h-full border-border/60 shadow-sm flex flex-col min-h-[400px]">
              <CardHeader className="py-4 px-5 flex flex-row items-center justify-between border-b border-border/40">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="text-xs h-8 px-2.5 text-muted-foreground hover:text-primary" asChild>
                  <Link href={`/shop/${shopId}/invoices`}>
                    View All
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                {stats.recentInvoices.length > 0 ? (
                  <div className="divide-y divide-border/30">
                    {stats.recentInvoices.slice(0, 8).map((invoice: any) => (
                      <div key={invoice.id} className="p-1 px-2 hover:bg-muted/30 transition-colors">
                        <DashboardInvoiceRow invoice={invoice} shopId={shopId} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6">
                    <RecentInvoicesEmptyState />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
