'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { TrendingUp, ArrowRight, Eye, MessageCircle, Gem, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import Link from 'next/link';
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
            className="relative overflow-hidden rounded-2xl border border-white/20 bg-background/60 backdrop-blur-xl shadow-xl hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 group"
        >
            {/* Ambient Glow Background - Premium Gold Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-60 pointer-events-none" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            {/* Decorative Elements */}
            <div className="absolute top-4 right-4 p-2 opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none">
                <Gem className="w-24 h-24 text-primary rotate-12" />
            </div>

            <div className="relative z-10 p-6 md:p-8 grid md:grid-cols-2 gap-8 items-center">
                {/* Left: Revenue (Main) */}
                <div className="flex flex-col justify-center space-y-5">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="p-2 rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                                <TrendingUp className="w-4 h-4" />
                            </span>
                            <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{title}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <motion.h2 className="text-5xl md:text-6xl font-heading font-bold tracking-tight text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                                {displayValue}
                            </motion.h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm font-medium">
                        <span className={cn(
                            "flex items-center gap-1 px-2.5 py-1 rounded-full border",
                            isPositive 
                                ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" 
                                : "text-rose-600 bg-rose-500/10 border-rose-500/20"
                        )}>
                            {isPositive ? <TrendingUp className="w-3 h-3" /> : null}
                            {change > 0 ? '+' : ''}{change.toFixed(1)}%
                        </span>
                        <span className="text-muted-foreground/80">vs last month</span>
                    </div>
                </div>

                {/* Right: Digital Stats (Catalogue) */}
                {catalogueStats && (
                    <div className="flex flex-col justify-center space-y-5 relative">
                        {/* Divider for mobile */}
                        <div className="md:hidden w-full h-px bg-border/50 my-2" />
                        
                        {/* Vertical Divider for desktop */}
                        <div className="hidden md:block absolute left-0 top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-border to-transparent" />

                        <div className="md:pl-8 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Storefront Stats</h3>
                                </div>
                                <Link 
                                    href="/shop/dashboard/catalogue" 
                                    className="group/link text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 z-20 relative transition-colors"
                                >
                                    View Analytics <ArrowRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-white/50 dark:bg-black/20 border border-primary/5 hover:border-primary/20 transition-colors backdrop-blur-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1.5 uppercase tracking-wide">
                                        <Eye className="w-3 h-3" /> Views
                                    </div>
                                    <p className="text-2xl font-bold font-heading text-foreground">
                                        {(catalogueStats.page_views + catalogueStats.product_views).toLocaleString()}
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/50 dark:bg-black/20 border border-primary/5 hover:border-primary/20 transition-colors backdrop-blur-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1.5 uppercase tracking-wide">
                                        <MessageCircle className="w-3 h-3" /> Leads
                                    </div>
                                    <p className="text-2xl font-bold font-heading text-foreground">
                                        {catalogueStats.leads.toLocaleString()}
                                    </p>
                                </div>
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
