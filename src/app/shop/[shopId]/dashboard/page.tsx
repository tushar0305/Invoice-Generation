import { startOfMonth, endOfMonth, startOfWeek, startOfDay, subMonths, isSameDay, subDays, format } from 'date-fns';
import { createClient } from '@/supabase/server';
import { getDashboardData, getMarketRates, getAdditionalStats } from '@/actions/dashboard-actions';
import { DashboardClient } from './client';
import { Button } from '@/components/ui/button';
import { Store } from 'lucide-react';

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
  
  const [stats, marketRates, additionalStats] = await Promise.all([
    getDashboardData(shopId),
    getMarketRates(shopId),
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

  // Calculate metrics
  const totalUniqueCustomers = additionalStats.customerCount;

  const monthSparkline = generateSparkline(stats.recentInvoices, 30);
  const weekSparkline = generateSparkline(stats.recentInvoices, 7);

  // Use direct value from server action instead of reverse calculation
  const lastMonthRevenue = stats.totalPaidLastMonth;
  const changeAmount = stats.totalPaidThisMonth - lastMonthRevenue;

  // Calculate pending payments (no overdue logic)
  const totalDue = stats.dueInvoices.reduce((sum: number, inv: any) => sum + Number(inv.grand_total), 0);

  // Customer insights - now using actual data from RPC
  const returningCustomers = additionalStats.returningCustomerCount || 0;
  const newCustomers = additionalStats.newCustomerCount || (totalUniqueCustomers - returningCustomers);
  const returningCustomerRate = totalUniqueCustomers > 0 ? (returningCustomers / totalUniqueCustomers) * 100 : 0;

  // Top customer - map RPC field names correctly (try multiple possible field names)
  const topCustomer = additionalStats.topCustomerAllTime ? {
    name: additionalStats.topCustomerAllTime.name || 'Unknown',
    totalSpent: Number(additionalStats.topCustomerAllTime.total_spent || additionalStats.topCustomerAllTime.totalSpent) || 0,
    orders: Number(additionalStats.topCustomerAllTime.order_count || additionalStats.topCustomerAllTime.invoice_count || additionalStats.topCustomerAllTime.orders) || 0
  } : undefined;


  // Business health metrics
  const recentTotal = stats.recentInvoices.reduce((sum: number, inv: any) => sum + Number(inv.grand_total), 0);
  const recentCount = stats.recentInvoices.length;

  return (
    <DashboardClient
      shopId={shopId}
      stats={stats}
      marketRates={marketRates}
      additionalStats={additionalStats}
      monthSparkline={monthSparkline}
      weekSparkline={weekSparkline}
      totalUniqueCustomers={totalUniqueCustomers}
      lastMonthRevenue={lastMonthRevenue}
      changeAmount={changeAmount}
      totalDue={totalDue}
      returningCustomers={returningCustomers}
      newCustomers={newCustomers}
      returningCustomerRate={returningCustomerRate}
      topCustomer={topCustomer}
      recentTotal={recentTotal}
      recentCount={recentCount}
    />
  );
}
