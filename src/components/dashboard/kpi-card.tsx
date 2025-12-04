'use client';

import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface KPICardProps {
    title: string;
    value: string;
    change?: number;
    changeLabel?: string;
    sparklineData?: number[]; // Array of values for mini chart (0-100 range)
    href?: string;
    index?: number;
}

export function KPICard({
    title,
    value,
    change,
    changeLabel = 'vs last month',
    sparklineData = [],
    href,
    index = 0
}: KPICardProps) {
    const isPositive = (change ?? 0) >= 0;

    const CardWrapper = href ? 'a' : 'div';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
        >
            <CardWrapper
                {...(href && { href })}
                className={cn(
                    "block relative group h-full",
                    href && "cursor-pointer"
                )}
            >
                {/* Card Container - Compact with enhanced borders */}
                <div className="relative overflow-hidden rounded-xl bg-card/40 backdrop-blur-md
          border border-white/10
          hover:border-primary/50
          shadow-lg hover:shadow-glow-sm
          transition-all duration-300 ease-out
          p-5 h-full
          group-hover:-translate-y-0.5">
                    
                    {/* Ambient Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    {/* Header: Title + View More */}
                    <div className="relative z-10 flex items-start justify-between mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground">
                            {title}
                        </h3>
                        {href && (
                            <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 -mr-1 transform translate-x-2 group-hover:translate-x-0">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10">
                                    <ArrowUpRight className="w-3.5 h-3.5 text-primary" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main Value - Compact */}
                    <div className="relative z-10 mb-1">
                        <div className="text-2xl font-bold text-foreground tracking-tight glow-text-primary">
                            {value}
                        </div>
                    </div>

                    {/* Change Indicator */}
                    {change !== undefined && (
                        <div className="relative z-10 flex items-center gap-1 mb-2">
                            <div className={cn(
                                "flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full",
                                isPositive 
                                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                                    : "bg-red-500/10 text-red-500 border border-red-500/20"
                            )}>
                                {isPositive ? (
                                    <TrendingUp className="h-3 w-3" />
                                ) : (
                                    <TrendingDown className="h-3 w-3" />
                                )}
                                <span>{isPositive ? '+' : ''}{change.toFixed(0)}%</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">{changeLabel}</span>
                        </div>
                    )}

                    {/* Sparkline Chart - Compact */}
                    {sparklineData.length > 0 && (
                        <div className="relative z-10 mt-auto pt-2">
                            <svg
                                viewBox="0 0 100 24"
                                className="w-full h-6 drop-shadow-[0_0_4px_rgba(var(--primary),0.3)]"
                                preserveAspectRatio="none"
                            >
                                {/* Generate smooth line path */}
                                <path
                                    d={generateSparklinePath(sparklineData)}
                                    fill="none"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                            </svg>
                        </div>
                    )}
                </div>
            </CardWrapper>
        </motion.div>
    );
}

// Helper function to generate smooth sparkline path
function generateSparklinePath(data: number[]): string {
    if (data.length === 0) return '';

    const points = data.map((value, index) => ({
        x: (index / (data.length - 1)) * 100,
        y: 24 - (value / 100) * 24, // Invert Y and scale to viewBox height
    }));

    // Generate smooth curve using quadratic bezier
    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];
        const midX = (current.x + next.x) / 2;

        path += ` Q ${current.x} ${current.y}, ${midX} ${(current.y + next.y) / 2}`;
    }

    // Connect to last point
    const last = points[points.length - 1];
    path += ` T ${last.x} ${last.y}`;

    return path;
}
