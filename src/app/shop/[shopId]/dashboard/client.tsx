'use client';

import { SmartHero } from '@/components/dashboard/smart-hero';
import { SmartInsightsGrid } from '@/components/dashboard/smart-insights-grid';
import { CustomerInsightsWidget } from '@/components/dashboard/customer-insights';
import { BusinessHealthWidget } from '@/components/dashboard/business-health';
import { PendingPaymentsWidget } from '@/components/dashboard/pending-payments-widget';
import { LoyaltyWidget } from '@/components/dashboard/loyalty-widget';
import { SchemesWidget } from '@/components/dashboard/schemes-widget';
import { GoldSilverTicker } from '@/components/dashboard/gold-silver-ticker';
import { QuickActions } from '@/components/dashboard/quick-actions';

export function DashboardClient({
  shopId,
  stats,
  marketRates,
  additionalStats,
  monthSparkline,
  weekSparkline,
  totalUniqueCustomers,
  lastMonthRevenue,
  changeAmount,
  totalDue,
  returningCustomers,
  newCustomers,
  returningCustomerRate,
  topCustomer,
  recentTotal,
  recentCount
}: any) {
  return (
    <div className="space-y-6 p-6 pb-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your business performance.</p>
        </div>
        <div className="flex items-center gap-2">
           <GoldSilverTicker initialData={marketRates} shopId={shopId} />
        </div>
      </div>

      <SmartHero 
        totalTodayRevenue={stats.totalPaidToday}
        totalWeekRevenue={stats.totalPaidThisWeek}
        totalRevenue={stats.totalPaidThisMonth}
        revenueMoM={stats.revenueMoM}
        invoices={stats.recentInvoices}
      />

      <QuickActions shopId={shopId} />

      <SmartInsightsGrid 
        shopId={shopId}
        stats={{
            activeEnrollments: additionalStats.activeEnrollments,
            totalSchemeCollected: additionalStats.totalSchemeCollected,
            pendingCount: stats.dueInvoices.length,
            totalDue: totalDue,
            recentDueInvoice: stats.dueInvoices[0],
            activeLoans: additionalStats.activeLoans,
            khataBalance: additionalStats.khataBalance,
            lowStockCount: additionalStats.lowStockItems?.length || 0,
            lowStockItem: additionalStats.lowStockItems?.[0],
            loyaltyPoints: additionalStats.totalLoyaltyPoints,
            loyaltyMembers: additionalStats.loyaltyMembers,
            topLoyaltyCustomer: additionalStats.topLoyaltyCustomer
        }}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
           <BusinessHealthWidget 
             totalRevenue={stats.totalPaidThisMonth}
             totalOrders={stats.totalOrdersThisMonth}
             revenueGrowth={stats.revenueMoM}
             returningRate={returningCustomerRate}
           />
        </div>
        <div className="col-span-3">
           <CustomerInsightsWidget 
             newCustomers={newCustomers}
             returningCustomers={returningCustomers}
             topCustomer={topCustomer}
           />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <PendingPaymentsWidget 
          shopId={shopId} 
          totalDue={totalDue} 
          pendingCount={stats.dueInvoices.length} 
        />
        <LoyaltyWidget 
          shopId={shopId}
          totalPointsDistributed={additionalStats.totalLoyaltyPoints}
          activeMembers={additionalStats.loyaltyMembers}
        />
        <SchemesWidget 
          shopId={shopId}
          totalSchemes={additionalStats.totalSchemes}
          activeEnrollments={additionalStats.activeEnrollments}
          totalCollectedMonth={additionalStats.totalSchemeCollected}
          totalGoldAccumulated={additionalStats.totalGoldAccumulated}
        />
      </div>
    </div>
  );
}
