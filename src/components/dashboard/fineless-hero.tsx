'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { TrendingUp, ArrowRight, Plus, Users, Package } from 'lucide-react';
import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface FinelessHeroProps {
    title: string;
    value: number;
    change: number;
    changeAmount: number;
    sparklineData: number[];
    viewMoreHref?: string;
}

export function FinelessHero({
    title,
    value,
    change,
    changeAmount,
    sparklineData,
    viewMoreHref
}: FinelessHeroProps) {
    const isPositive = change >= 0;

    // Animated number counter
    const spring = useSpring(0, { duration: 1500 });
    const displayValue = useTransform(spring, (latest) =>
        `₹${latest.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    );

    useEffect(() => {
        spring.set(value);
    }, [value, spring]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-xl border border-white/10 bg-card/40 backdrop-blur-md shadow-lg hover:shadow-glow-sm transition-all duration-300 group p-5 md:p-6"
        >
            {/* Ambient Glow Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                {/* Left: Value and Change */}
                <div className="flex flex-col justify-center space-y-2">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            {title}
                        </h2>
                        {viewMoreHref && (
                            <Link
                                href={viewMoreHref}
                                className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-0.5 group/link"
                            >
                                View Details
                                <ArrowRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
                            </Link>
                        )}
                    </div>

                    {/* Main Value - Animated */}
                    <motion.div
                        className="text-4xl md:text-5xl font-bold text-foreground tracking-tight glow-text-primary"
                    >
                        {displayValue}
                    </motion.div>

                    {/* Change Indicator */}
                    <div className="flex items-center gap-2 text-sm">
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isPositive
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                            }`}>
                            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingUp className="h-3 w-3 rotate-180" />}
                            {Math.abs(change).toFixed(1)}%
                        </div>
                        <span className="text-muted-foreground text-xs">
                            {isPositive ? '+' : ''}₹{Math.abs(changeAmount).toLocaleString('en-IN', { minimumFractionDigits: 0 })} this month
                        </span>
                    </div>
                </div>

                {/* Right: Quick Actions */}
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <Button asChild size="sm" className="flex-1 md:flex-none h-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                        <Link href={`${viewMoreHref}/new`}>
                            <Plus className="w-4 h-4 mr-2" />
                            New Invoice
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="flex-1 md:flex-none h-10 border-primary/20 hover:bg-primary/5 hover:text-primary">
                        <Link href={`${viewMoreHref?.replace('invoices', 'customers')}/new`}>
                            <Users className="w-4 h-4 mr-2" />
                            Add Customer
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="flex-1 md:flex-none h-10 border-primary/20 hover:bg-primary/5 hover:text-primary">
                        <Link href={`${viewMoreHref?.replace('invoices', 'stock')}/new`}>
                            <Package className="w-4 h-4 mr-2" />
                            Add Item
                        </Link>
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}

// Helper to generate smooth sparkline path for larger chart
function generateLargeSparklinePath(data: number[]): string {
    if (data.length === 0) return '';

    const points = data.map((value, index) => ({
        x: (index / (data.length - 1)) * 200,
        y: 60 - (value / 100) * 60,
    }));

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];
        const midX = (current.x + next.x) / 2;

        path += ` Q ${current.x} ${current.y}, ${midX} ${(current.y + next.y) / 2}`;
    }

    const last = points[points.length - 1];
    path += ` T ${last.x} ${last.y}`;

    return path;
}
