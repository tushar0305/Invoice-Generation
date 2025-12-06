'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { TrendingUp, ArrowRight, Eye, MessageCircle, Gem } from 'lucide-react';
import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FinelessHeroProps {
    title: string;
    value: number;
    change: number;
    changeAmount: number;
    sparklineData: number[];
    viewMoreHref?: string;
    catalogueStats?: {
        page_views: number;
        leads: number;
        product_views: number;
    };
}

export function FinelessHero({
    title,
    value,
    change,
    changeAmount,
    sparklineData,
    viewMoreHref,
    catalogueStats
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
            className="relative overflow-hidden rounded-xl border border-[#D4AF37]/20 bg-gradient-to-br from-white via-stone-50 to-[#D4AF37]/5 dark:from-[#2e2410] dark:via-[#1c1917] dark:to-[#D4AF37]/20 shadow-xl hover:shadow-[#D4AF37]/20 transition-all duration-500 group p-6"
        >
            {/* Ambient Glow Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 via-transparent to-transparent opacity-50 pointer-events-none" />

            {/* Decorative Gold Gem */}
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <Gem className="w-32 h-32 text-[#D4AF37]" />
            </div>

            <div className="relative z-10 grid md:grid-cols-2 gap-8">
                {/* Left: Revenue (Main) */}
                <div className="flex flex-col justify-between h-full space-y-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="p-1.5 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37]">
                                <TrendingUp className="w-4 h-4" />
                            </span>
                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{title}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <motion.h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                                {displayValue}
                            </motion.h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        <span className={cn(
                            "flex items-center gap-1 font-medium px-2 py-0.5 rounded-full",
                            isPositive ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" : "text-rose-600 bg-rose-50 dark:bg-rose-900/20"
                        )}>
                            {isPositive ? '+' : ''}{change.toFixed(1)}%
                        </span>
                        <span className="text-muted-foreground">from last month</span>
                    </div>
                </div>

                {/* Right: Digital Stats (Catalogue) */}
                {catalogueStats && (
                    <div className="flex flex-col justify-center space-y-4 border-t md:border-t-0 md:border-l border-[#D4AF37]/20 md:pl-8 pt-4 md:pt-0">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider">Digital Storefront</h3>
                            <Link href="/shop/dashboard/catalogue" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 z-20 relative">
                                View <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-lg bg-background/50 border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-colors">
                                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                                    <Eye className="w-3 h-3" /> Views
                                </div>
                                <p className="text-xl font-bold">{catalogueStats.page_views + catalogueStats.product_views}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-background/50 border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-colors">
                                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                                    <MessageCircle className="w-3 h-3" /> Leads
                                </div>
                                <p className="text-xl font-bold">{catalogueStats.leads}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* View More Button overlay */}
            {viewMoreHref && (
                <Link href={viewMoreHref} className="absolute inset-0 z-0" aria-label="View Details" />
            )}
        </motion.div>
    );
}
