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
        <Card className="h-full min-h-[400px] overflow-hidden relative flex flex-col bg-card border border-border hover:border-primary/50 shadow-lg hover:shadow-primary/10 transition-all duration-300">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />

            <CardHeader className="pb-3 border-b border-border relative">
                <CardTitle className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                        <Users className="w-4 h-4 text-primary" />
                    </div>
                    Customer Insights
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5 relative">
                {/* Retention Chart */}
                <div className="space-y-3 p-4 rounded-2xl bg-muted/50 border border-border">
                    <div className="flex justify-between text-sm font-medium">
                        <motion.span
                            className="flex items-center gap-1.5 text-primary"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                        >
                            <div className="p-1 rounded-md bg-primary/10">
                                <UserPlus className="w-3 h-3" />
                            </div>
                            <span className="text-xs">New <span className="font-bold">({newCustomers})</span></span>
                        </motion.span>
                        <motion.span
                            className="flex items-center gap-1.5 text-muted-foreground"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                        >
                            <span className="text-xs">Returning <span className="font-bold">({returningCustomers})</span></span>
                            <div className="p-1 rounded-md bg-muted">
                                <UserCheck className="w-3 h-3" />
                            </div>
                        </motion.span>
                    </div>
                    <div className="flex h-3.5 w-full rounded-full overflow-hidden bg-muted shadow-inner">
                        <motion.div
                            className="bg-gradient-to-r from-primary to-primary/80 h-full rounded-l-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${newPercentage}%` }}
                            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                        />
                        <motion.div
                            className="bg-gradient-to-r from-muted-foreground/50 to-muted-foreground/30 h-full rounded-r-full"
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
                        className="relative overflow-hidden rounded-2xl bg-primary/5 border border-primary/10 p-4 shadow-sm hover:bg-primary/10 transition-colors"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                    >
                        {/* Background crown decoration */}
                        <div className="absolute top-0 right-0 p-2 opacity-[0.08]">
                            <Crown className="w-20 h-20 text-primary" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
                                    <Crown className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Top Spender</span>
                                <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                            </div>
                            <h4 className="text-lg font-bold text-foreground truncate font-heading">{topCustomer.name}</h4>
                            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1 text-xs">
                                    <span className="font-medium text-foreground">{topCustomer.orders}</span> Orders
                                </span>
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                                <span className="font-bold text-primary text-base">{formatCurrency(topCustomer.totalSpent)}</span>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="text-center py-4 text-muted-foreground text-sm bg-muted/30 rounded-2xl border border-dashed border-border">
                        <Users className="w-7 h-7 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="font-medium text-sm">No customer data yet</p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">Customer insights will appear here</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
