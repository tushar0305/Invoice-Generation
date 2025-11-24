'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import type { Invoice } from '@/lib/definitions';

interface SmartHeroProps {
    invoices: Invoice[] | null;
    totalRevenue: number;
    revenueMoM: number | null;
}

export function SmartHero({ invoices, totalRevenue, revenueMoM }: SmartHeroProps) {
    const isPositiveTrend = (revenueMoM ?? 0) >= 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-border shadow-gold-lg p-6 md:p-8"
        >
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-0" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/5 rounded-full blur-3xl -z-0" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                {/* Revenue Section */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            This Month's Revenue
                        </span>
                    </div>

                    <div className="flex items-baseline gap-3">
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground font-mono">
                            ₹{totalRevenue.toLocaleString('en-IN')}
                        </h2>

                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full ${isPositiveTrend
                                ? 'bg-green-500/10 text-green-600'
                                : 'bg-red-500/10 text-red-600'
                                }`}
                        >
                            {isPositiveTrend ? (
                                <TrendingUp className="h-4 w-4" />
                            ) : (
                                <TrendingDown className="h-4 w-4" />
                            )}
                            <span className="text-sm font-bold">
                                {Math.abs(revenueMoM ?? 0).toFixed(1)}%
                            </span>
                        </motion.div>
                    </div>

                    <p className="mt-2 text-sm text-muted-foreground">
                        {isPositiveTrend ? '🎉 Great growth!' : '📊 Keep pushing!'}
                        <span className="ml-1">from last month</span>
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="flex gap-6">
                    <div className="text-center">
                        <div className="text-2xl md:text-3xl font-bold text-primary font-mono">
                            {invoices?.length || 0}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">
                            Invoices
                        </div>
                    </div>

                    <div className="w-px bg-border" />

                    <div className="text-center">
                        <div className="flex items-center gap-1 text-primary">
                            <Calendar className="h-5 w-5" />
                            <div className="text-2xl md:text-3xl font-bold font-mono">
                                {new Date().toLocaleDateString('en-IN', { month: 'short' })}
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">
                            Current Period
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
