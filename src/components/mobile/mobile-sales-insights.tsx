'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Calendar, ShoppingBag, DollarSign, BarChart3, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { format, isSameDay, isSameWeek, isSameMonth, isSameYear, subDays, startOfDay, endOfDay } from 'date-fns';
import type { Invoice } from '@/lib/definitions';

interface SalesInsightsData {
  ranges: {
    today: { revenue: number; orders: number };
    week: { revenue: number; orders: number };
    month: { revenue: number; orders: number };
    year: { revenue: number; orders: number };
  };
  chart_data: { date: string; value: number }[];
  top_products: { name: string; revenue: number; quantity: number }[];
}

interface MobileSalesInsightsProps {
  data: SalesInsightsData;
}

type TimeRange = 'today' | 'week' | 'month' | 'year';

export function MobileSalesInsights({ data }: MobileSalesInsightsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  // Use pre-calculated stats from the DB
  const stats = useMemo(() => {
    const rangeData = data.ranges[timeRange];
    const totalRevenue = rangeData.revenue;
    const totalOrders = rangeData.orders;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    return { totalRevenue, totalOrders, avgOrderValue };
  }, [data, timeRange]);

  // Top Products (already filtered by 30 days in SQL, so static for now or we could enhance SQL)
  // For V1, we just show the top products returned (which are 30-day based)
  const topProducts = data.top_products || [];

  // Chart Data (The SQL returns 30 days daily data)
  const chartData = useMemo(() => {
    if (!data.chart_data) return [];

    // For "week", slice last 7
    if (timeRange === 'week') return data.chart_data.slice(-7).map(d => ({ label: format(new Date(d.date), 'dd'), value: d.value }));
    // For "month", return all 30
    if (timeRange === 'month') return data.chart_data.map(d => ({ label: format(new Date(d.date), 'dd'), value: d.value }));

    return [];
  }, [data, timeRange]);


  const maxChartValue = Math.max(...chartData.map(d => d.value), 1);

  return (
    <div className="md:hidden min-h-screen bg-gray-50/50 dark:bg-black/50 pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            Sales Insights
          </h1>
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-full">
            <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        {/* Time Range Tabs */}
        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          {(['today', 'week', 'month', 'year'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all capitalize ${timeRange === range
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
                }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <p className="text-xs font-medium opacity-80 mb-1">Total Revenue</p>
              <h2 className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</h2>
            </CardContent>
          </Card>
          <div className="space-y-3">
            <Card className="border-none shadow-sm bg-white dark:bg-gray-900/50">
              <CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Orders</p>
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-indigo-500" />
                  <p className="text-lg font-bold">{stats.totalOrders}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-white dark:bg-gray-900/50">
              <CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Avg. Value</p>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <p className="text-lg font-bold">{formatCurrency(stats.avgOrderValue)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mini Chart (Only for Week/Month) */}
        {(timeRange === 'week' || timeRange === 'month') && (
          <Card className="border-none shadow-sm bg-white dark:bg-gray-900/50 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Revenue Trend</h3>
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="h-32 flex items-end justify-between gap-1">
                {chartData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <div
                      className="w-full bg-indigo-100 dark:bg-indigo-900/30 rounded-t-sm relative overflow-hidden transition-all group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/50"
                      style={{ height: `${(d.value / maxChartValue) * 100}%` }}
                    >
                      <div className="absolute bottom-0 left-0 right-0 h-full bg-indigo-500/20" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{d.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Products */}
        <div>
          <h3 className="font-semibold text-sm mb-3 px-1">Top Selling Products</h3>
          <div className="space-y-2">
            {topProducts.map((product, index) => (
              <motion.div
                key={`${product.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-none shadow-sm bg-white dark:bg-gray-900/50">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-100 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-slate-50 text-slate-500'
                        }`}>
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.quantity} sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatCurrency(product.revenue)}</p>
                      <ArrowUpRight className="w-3 h-3 text-emerald-500 ml-auto" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {topProducts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No sales data for this period
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
