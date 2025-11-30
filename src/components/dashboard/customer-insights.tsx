'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, UserCheck, Crown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

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
        <Card className="glass-panel border-gold-500/10 h-full">
            <CardHeader className="pb-2 border-b border-gold-500/5">
                <CardTitle className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Customer Insights
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                {/* Retention Chart */}
                <div className="space-y-3">
                    <div className="flex justify-between text-sm font-medium">
                        <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                            <UserPlus className="w-3.5 h-3.5" /> New ({newCustomers})
                        </span>
                        <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                            <UserCheck className="w-3.5 h-3.5" /> Returning ({returningCustomers})
                        </span>
                    </div>
                    <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <div
                            className="bg-blue-500 h-full transition-all duration-1000"
                            style={{ width: `${newPercentage}%` }}
                        />
                        <div
                            className="bg-purple-500 h-full transition-all duration-1000"
                            style={{ width: `${returningPercentage}%` }}
                        />
                    </div>
                </div>

                {/* Top Customer Spotlight */}
                {topCustomer ? (
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gold-500/10 to-amber-500/5 border border-gold-500/20 p-4">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                            <Crown className="w-16 h-16 text-gold-900 dark:text-gold-100" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <Crown className="w-4 h-4 text-gold-600 dark:text-gold-400" />
                                <span className="text-xs font-bold uppercase tracking-wider text-gold-700 dark:text-gold-300">Top Spender</span>
                            </div>
                            <h4 className="text-lg font-bold text-foreground truncate">{topCustomer.name}</h4>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                <span>{topCustomer.orders} Orders</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                <span className="font-medium text-foreground">{formatCurrency(topCustomer.totalSpent)}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-6 text-muted-foreground text-sm bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                        No customer data yet
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
