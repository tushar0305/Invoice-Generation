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

// Helper to generate smooth SVG path (Catmull-Rom spline)
function getSmoothPath(data: number[], width: number, height: number): string {
    if (data.length === 0) return "";
    if (data.length === 1) return `M0,${height / 2} L${width},${height / 2}`;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Map points to coordinates
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height; // Invert Y because SVG y=0 is top
        return [x, y];
    });

    // Generate path command
    return points.reduce((acc, point, i, a) => {
        if (i === 0) return `M ${point[0]},${point[1]}`;

        // Simple bezier control points logic (smoothing)
        const [p0x, p0y] = a[i - 1];
        const [p1x, p1y] = point;

        // Midpoint for quadratic curve approximation
        const cp1x = (p0x + p1x) / 2;
        const cp1y = p0y;
        const cp2x = (p0x + p1x) / 2;
        const cp2y = p1y;

        return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p1x},${p1y}`;
    }, "");
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
    let pathD = '';
    let fillPathD = '';

    if (hasSparkline) {
        pathD = getSmoothPath(sparklineData, 100, 30);
        // Create a closed loop for the fill gradient: Start at bottom-left, go to start of line, follow line, go to bottom-right, close.
        fillPathD = `${pathD} L 100,30 L 0,30 Z`;
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
                {/* Card Container - Gold Premium Theme */}
                <div className="relative overflow-hidden rounded-xl bg-card/60 backdrop-blur-md border border-border/50 shadow-sm
          hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20
          transition-all duration-300 ease-out
          p-5 h-full flex flex-col justify-between
          group-hover:-translate-y-1">

                    {/* Ambient Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    {/* Top Section */}
                    <div className="relative z-10 w-full">
                        <div className="flex items-start justify-between mb-3">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                                {title}
                            </h3>
                            {href && (
                                <div className="p-1 rounded-full bg-primary/5 text-primary/50 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                                    <ArrowUpRight className="w-3 h-3" />
                                </div>
                            )}
                        </div>

                        <div className="text-2xl md:text-3xl font-heading font-bold tracking-tight text-foreground truncate" title={value}>
                            {value}
                        </div>
                    </div>

                    {/* Bottom Section: Trend Line */}
                    <div className="relative z-10 w-full mt-4 h-12">
                        {hasSparkline ? (
                            <div className="h-full w-full opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                                <svg width="100%" height="100%" viewBox="0 0 100 30" preserveAspectRatio="none" className="overflow-visible">
                                    <defs>
                                        <linearGradient id={`grad-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
                                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    {/* Fill Area */}
                                    <path
                                        d={fillPathD}
                                        fill={`url(#grad-${index})`}
                                        stroke="none"
                                    />
                                    {/* Stroke Line */}
                                    <path
                                        d={pathD}
                                        fill="none"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        vectorEffect="non-scaling-stroke"
                                    />
                                </svg>
                            </div>
                        ) : (
                            <div className="h-1 w-12 bg-primary/10 rounded-full mt-auto" />
                        )}
                    </div>
                </div>
            </CardWrapper>
        </motion.div>
    );
}
