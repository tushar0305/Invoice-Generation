'use client';

import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Users, 
  Package, 
  CreditCard, 
  ArrowRight,
  Wallet,
  Crown
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface MobileDashboardProps {
  shopId: string;
  stats: any;
  marketRates: any;
  lowStockItems: any[];
  activeLoans: number;
  khataBalance: number;
  loyaltyPoints: number;
}

export function MobileDashboardClient({
  shopId,
  stats,
  marketRates,
  lowStockItems,
  activeLoans,
  khataBalance,
  loyaltyPoints
}: MobileDashboardProps) {
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-24 md:hidden bg-gradient-to-b from-gray-50 to-white dark:from-black dark:to-gray-900 min-h-screen px-4 pt-4"
    >
      {/* Compact Hero Section */}
      <motion.div variants={item} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground">Total Revenue</h2>
            <div className="flex items-baseline gap-2">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                {formatCurrency(stats?.totalPaidThisMonth || 0)}
              </h1>
            </div>
            {stats?.revenueMoM !== 0 && (
                <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full mt-1 ${
                  stats?.revenueMoM > 0 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {stats?.revenueMoM > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(stats?.revenueMoM).toFixed(1)}% vs last month
                </div>
              )}
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <Wallet className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-white/60 dark:bg-gray-800/40 backdrop-blur-xl border-white/20 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium mb-1">Today</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats?.totalPaidToday || 0)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white/60 dark:bg-gray-800/40 backdrop-blur-xl border-white/20 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium mb-1">This Week</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats?.totalPaidThisWeek || 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2">
          <Link href={`/shop/${shopId}/invoices/new`} className="flex flex-col items-center gap-1">
            <div className="h-12 w-12 rounded-2xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">Invoice</span>
          </Link>
          <Link href={`/shop/${shopId}/stock/new`} className="flex flex-col items-center gap-1">
            <div className="h-12 w-12 rounded-2xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">Stock</span>
          </Link>
          <Link href={`/shop/${shopId}/customers/new`} className="flex flex-col items-center gap-1">
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">Customer</span>
          </Link>
          <Link href={`/shop/${shopId}/khata/new`} className="flex flex-col items-center gap-1">
            <div className="h-12 w-12 rounded-2xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-sm">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">Khata</span>
          </Link>
        </div>

        {/* Recent Invoices */}
        {stats?.recentInvoices?.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">Recent Sales</h3>
              <Link href={`/shop/${shopId}/invoices`} className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center">
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
            <div className="space-y-2">
              {stats.recentInvoices.slice(0, 3).map((invoice: any, i: number) => (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="border-none shadow-sm bg-white dark:bg-gray-900/50">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500">
                          {invoice.customer_name?.charAt(0) || '#'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{invoice.customer_name || 'Walk-in Customer'}</p>
                          <p className="text-xs text-muted-foreground">#{invoice.invoice_number}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(invoice.grand_total)}</p>
                        <p className={`text-[10px] font-medium ${
                          invoice.status === 'paid' ? 'text-emerald-600' : 'text-orange-600'
                        }`}>
                          {invoice.status}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Low Stock Alert */}
        {lowStockItems && lowStockItems.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                Low Stock
              </h3>
              <Link href={`/shop/${shopId}/stock?filter=low`} className="text-xs text-red-600 dark:text-red-400 font-medium">
                Check Inventory
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {lowStockItems.map((item: any) => (
                <Card key={item.id} className="min-w-[140px] border-none shadow-sm bg-red-50 dark:bg-red-900/10">
                  <CardContent className="p-3">
                    <p className="text-xs font-medium text-red-900 dark:text-red-200 line-clamp-1">{item.item_name}</p>
                    <div className="mt-2 flex items-end justify-between">
                      <p className="text-lg font-bold text-red-700 dark:text-red-300">{item.current_quantity}</p>
                      <p className="text-[10px] text-red-600/70 dark:text-red-400/70 mb-1">{item.unit}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Gold/Silver Rates Card */}
      {marketRates && (
        <motion.div variants={item}>
          <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-gray-900 to-gray-800 text-white">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-amber-400">Market Rates</h3>
                <span className="text-xs text-gray-400">Live Update</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">Gold (24k)</p>
                  <p className="text-xl font-bold tracking-wider">₹{marketRates.gold_24k?.toLocaleString()}</p>
                  <div className="flex items-center text-xs text-green-400">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    <span>+0.5%</span>
                  </div>
                </div>
                <div className="space-y-1 border-l border-gray-700 pl-4">
                  <p className="text-xs text-gray-400">Silver (1kg)</p>
                  <p className="text-xl font-bold tracking-wider">₹{marketRates.silver_1kg?.toLocaleString()}</p>
                  <div className="flex items-center text-xs text-red-400">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    <span>-0.2%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Action Cards Grid */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3">
        <Link href={`/shop/${shopId}/invoices/new`}>
          <Card className="h-full border-none shadow-sm bg-amber-500 text-white active:scale-95 transition-transform">
            <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center">
              <div className="p-2 bg-white/20 rounded-full">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="font-semibold text-sm">New Sale</span>
            </CardContent>
          </Card>
        </Link>
        
        <Link href={`/shop/${shopId}/stock/new`}>
          <Card className="h-full border-none shadow-sm active:scale-95 transition-transform">
            <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                <Package className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </div>
              <span className="font-semibold text-sm">Add Stock</span>
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      {/* Business Health & Insights */}
      <motion.div variants={item} className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground px-1">Overview</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/shop/${shopId}/khata`}>
            <Card className="border-none shadow-sm active:scale-95 transition-transform">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CreditCard className="h-4 w-4" />
                  <span className="text-xs font-medium">Khata</span>
                </div>
                <p className={`text-lg font-bold ${khataBalance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(khataBalance))}
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/shop/${shopId}/loans`}>
            <Card className="border-none shadow-sm active:scale-95 transition-transform">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-medium">Active Loans</span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {activeLoans}
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </motion.div>

      {/* Low Stock Alert */}
      {lowStockItems && lowStockItems.length > 0 && (
        <motion.div variants={item}>
          <Card className="border-l-4 border-l-red-500 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-semibold text-sm">Low Stock Alert</span>
                </div>
                <Link href={`/shop/${shopId}/stock`} className="text-xs text-muted-foreground flex items-center">
                  View All <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </div>
              <div className="space-y-2">
                {lowStockItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{item.item_name}</span>
                    <span className="font-medium text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded text-xs">
                      {item.current_quantity} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
