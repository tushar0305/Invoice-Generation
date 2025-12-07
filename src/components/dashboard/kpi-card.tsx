'use client';

import { TrendingUp, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface KPICardProps {
    title: string;
    value: string;
    change?: number; // Kept for interface compatibility but ignored in render
    changeLabel?: string;
    sparklineData?: number[];
    href?: string;
    index?: number;
}

export function KPICard({
    title,
    value,
    sparklineData = [],
    href,
    index = 0
}: KPICardProps) {
    const CardWrapper = href ? Link : 'div';

    // Sparkline Logic
    const hasSparkline = sparklineData.length > 1;
    let sparklinePoints = '';

    if (hasSparkline) {
        const min = Math.min(...sparklineData);
        const max = Math.max(...sparklineData);
        const range = max - min || 1;
        const width = 100;
        const height = 30;

        sparklinePoints = sparklineData.map((val, i) => {
            const x = (i / (sparklineData.length - 1)) * width;
            const y = height - ((val - min) / range) * height; // Invert Y
            return `${x},${y}`;
        }).join(' ');
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="h-full"
        >
            <CardWrapper
                href={href || '#'}
                className={cn(
                    "block relative group h-full",
                    href ? "cursor-pointer" : "cursor-default"
                )}
            >
                {/* Card Container - Gold Theme */}
                <div className="relative overflow-hidden rounded-xl bg-card border border-border shadow-sm
          hover:shadow-md transition-all duration-300 ease-out
          p-5 h-full
          group-hover:-translate-y-0.5">

                    {/* Ambient Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    {/* Header: Title + View More */}
                    <div className="relative z-10 flex items-start justify-between mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                            {title}
                        </h3>
                        {href && (
                            <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:text-[#D4AF37] transition-all" />
                        )}
                    </div>

                    <div className="relative z-10 flex flex-col justify-between min-h-[60px]">
                        <div className="text-2xl font-bold tracking-tight mb-2 text-foreground truncate" title={value}>
                            {value}
                        </div>

                        {/* Trend Line (Sparkline) only - No Percentage Text */}
                        {hasSparkline ? (
                            <div className="h-8 w-full mt-auto opacity-70 group-hover:opacity-100 transition-opacity">
                                <svg width="100%" height="100%" viewBox="0 0 100 30" preserveAspectRatio="none">
                                    <polyline
                                        points={sparklinePoints}
                                        fill="none"
                                        stroke="#D4AF37"
                                        strokeWidth="2"
                                        vectorEffect="non-scaling-stroke"
                                        strokeOpacity="0.8"
                                    />
                                    <linearGradient id={`grad-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.2" />
                                        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
                                    </linearGradient>
                                    <polygon
                                        points={`${0},30 ${sparklinePoints} ${100},30`}
                                        fill={`url(#grad-${index})`}
                                        opacity="0.5"
                                    />
                                </svg>
                            </div>
                        ) : (
                            // Fallback if no data, maybe show a flat line or nothing
                            <div className="h-0.5 w-full bg-[#D4AF37]/10 mt-auto rounded-full" />
                        )}
                    </div>
                </div>
            </CardWrapper>
        </motion.div>
    );
}
