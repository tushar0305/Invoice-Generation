'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, UserCheck, Crown, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CustomerInsightsProps {
    newCustomers: number;
    returningCustomers: number;
    topCustomer?: {
        name: string;
        totalSpent: number;
        orders: number;
    };
}

export function CustomerInsightsWidget({ newCustomers, returningCustomers, topCustomer }: CustomerInsightsProps) {
    const total = newCustomers + returningCustomers;
    const newPercentage = total > 0 ? (newCustomers / total) * 100 : 0;
    const returningPercentage = total > 0 ? (returningCustomers / total) * 100 : 0;

    return (
        <Card className="h-full min-h-[400px] overflow-hidden relative flex flex-col border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-gray-900">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 via-transparent to-purple-500/8 pointer-events-none" />

            <CardHeader className="pb-3 border-b-2 border-gray-200 dark:border-gray-700 relative">
                <CardTitle className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/20 border border-blue-200/50 dark:border-blue-700/30">
                        <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    Customer Insights
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5 relative">
                {/* Retention Chart */}
                <div className="space-y-3 p-4 rounded-2xl bg-gradient-to-br from-slate-50/80 to-white dark:from-slate-900/50 dark:to-slate-800/30 border border-slate-100/60 dark:border-slate-700/30">
                    <div className="flex justify-between text-sm font-medium">
                        <motion.span
                            className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                        >
                            <div className="p-1 rounded-md bg-blue-100/80 dark:bg-blue-900/50">
                                <UserPlus className="w-3 h-3" />
                            </div>
                            <span className="text-xs">New <span className="font-bold">({newCustomers})</span></span>
                        </motion.span>
                        <motion.span
                            className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                        >
                            <span className="text-xs">Returning <span className="font-bold">({returningCustomers})</span></span>
                            <div className="p-1 rounded-md bg-purple-100/80 dark:bg-purple-900/50">
                                <UserCheck className="w-3 h-3" />
                            </div>
                        </motion.span>
                    </div>
                    <div className="flex h-3.5 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-inner">
                        <motion.div
                            className="bg-gradient-to-r from-blue-400 to-blue-500 h-full rounded-l-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${newPercentage}%` }}
                            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                        />
                        <motion.div
                            className="bg-gradient-to-r from-purple-400 to-purple-500 h-full rounded-r-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${returningPercentage}%` }}
                            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                        />
                    </div>
                    <p className="text-[10px] text-center text-muted-foreground">
                        {returningPercentage.toFixed(0)}% customer retention rate
                    </p>
                </div>

                {/* Top Customer Spotlight */}
                {topCustomer ? (
                    <motion.div
                        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-yellow-50/80 to-orange-50/60 dark:from-amber-950/40 dark:via-yellow-900/30 dark:to-amber-800/20 border border-amber-200/50 dark:border-amber-700/30 p-4 shadow-sm"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                    >
                        {/* Background crown decoration */}
                        <div className="absolute top-0 right-0 p-2 opacity-[0.08]">
                            <Crown className="w-20 h-20 text-amber-900 dark:text-amber-100" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 rounded-lg bg-amber-200/60 dark:bg-amber-800/40 border border-amber-300/50 dark:border-amber-600/30">
                                    <Crown className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Top Spender</span>
                                <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                            </div>
                            <h4 className="text-lg font-bold text-foreground truncate font-heading">{topCustomer.name}</h4>
                            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1 text-xs">
                                    <span className="font-medium text-foreground">{topCustomer.orders}</span> Orders
                                </span>
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
                                <span className="font-bold text-amber-700 dark:text-amber-400 text-base">{formatCurrency(topCustomer.totalSpent)}</span>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="text-center py-4 text-muted-foreground text-sm bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800/30 rounded-2xl border border-dashed border-slate-200/60 dark:border-slate-700/40">
                        <Users className="w-7 h-7 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                        <p className="font-medium text-sm">No customer data yet</p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">Customer insights will appear here</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
