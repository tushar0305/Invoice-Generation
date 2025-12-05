'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Gift, TrendingUp, Star, History, ArrowRight, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import Link from 'next/link';

interface MobileLoyaltyProps {
  shopId: string;
  stats: {
    totalIssued: number;
    totalRedeemed: number;
    liability: number;
    totalCustomers: number;
  };
  recentLogs: any[];
  topCustomers: any[];
}

export function MobileLoyalty({ shopId, stats, recentLogs, topCustomers }: MobileLoyaltyProps) {
  return (
    <div className="md:hidden min-h-screen bg-gray-50/50 dark:bg-black/50 pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500 fill-amber-500" />
            Loyalty
          </h1>
          <Link href={`/shop/${shopId}/settings?tab=loyalty`}>
            <Button size="icon" variant="ghost" className="rounded-full">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Hero Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-none shadow-sm bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <CardContent className="p-4">
              <p className="text-xs font-medium opacity-80 mb-1">Total Issued</p>
              <div className="flex items-baseline gap-1">
                <h2 className="text-2xl font-bold">{stats.totalIssued}</h2>
                <span className="text-xs opacity-80">pts</span>
              </div>
            </CardContent>
          </Card>
          <div className="space-y-3">
            <Card className="border-none shadow-sm bg-white dark:bg-gray-900/50">
              <CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Redeemed</p>
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-purple-500" />
                  <p className="text-lg font-bold">{stats.totalRedeemed}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-white dark:bg-gray-900/50">
              <CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Liability</p>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-red-500" />
                  <p className="text-lg font-bold">{formatCurrency(stats.liability)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Top Customers */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Top Customers
            </h3>
          </div>
          <div className="space-y-2">
            {topCustomers.map((customer, index) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-none shadow-sm bg-white dark:bg-gray-900/50">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-100 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-50 text-slate-500'
                      }`}>
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm line-clamp-1">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-amber-600 dark:text-amber-400">
                        {customer.loyalty_points} pts
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-blue-500" />
              Recent Activity
            </h3>
          </div>
          <div className="space-y-2">
            {recentLogs.map((log, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-none shadow-sm bg-white dark:bg-gray-900/50">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{log.customer?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), 'dd MMM, hh:mm a')}
                      </p>
                    </div>
                    <div className={`text-sm font-bold ${
                      log.points_change > 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {log.points_change > 0 ? '+' : ''}{log.points_change}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
