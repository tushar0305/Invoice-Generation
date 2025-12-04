'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';

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
            className="relative overflow-hidden rounded-xl border border-white/10 bg-card/40 backdrop-blur-md shadow-lg hover:shadow-glow-sm transition-all duration-300 group p-4 md:p-5"
        >
            {/* Ambient Glow Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />
            
            {/* Header: Title + View More */}
            <div className="relative z-10 flex items-start justify-between mb-3">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {title}
                </h2>
                {viewMoreHref && (
                    <a
                        href={viewMoreHref}
                        className="text-xs text-muted-foreground hover:text-primary 
              transition-colors flex items-center gap-1 group"
                    >
                        View more
                        <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                )}
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left: Value and Change */}
                <div className="flex flex-col justify-center">
                    {/* Main Value - Animated */}
                    <motion.div
                        className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-2 glow-text-primary"
                    >
                        {displayValue}
                    </motion.div>

                    {/* Change Indicator */}
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground text-xs">
                            {isPositive ? 'Up' : 'Down'} by
                        </span>
                        <span className={`font-semibold flex items-center gap-1 text-sm ${isPositive ? 'text-emerald-500' : 'text-red-500'
                            }`}>
                            {isPositive && <TrendingUp className="h-4 w-4" />}
                            ₹{changeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-muted-foreground text-xs">
                            this month
                        </span>
                    </div>
                </div>

                {/* Right: Compact Sparkline */}
                <div className="flex items-center justify-end relative">
                    {/* Bottom Shader for Graph */}
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />
                    <svg
                        viewBox="0 0 200 60"
                        className="w-full h-16 md:h-20 drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                        preserveAspectRatio="none"
                    >
                        <path
                            d={generateLargeSparklinePath(sparklineData)}
                            fill="none"
                            stroke="hsl(var(--primary))"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="drop-shadow-[0_0_4px_hsl(var(--primary))]"

                        />
                        <circle
                            cx={((sparklineData.length - 1) / (sparklineData.length - 1)) * 200}
                            cy={60 - (sparklineData[sparklineData.length - 1] / 100) * 60}
                            r="3"
                            fill={isPositive ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'}
                        />
                    </svg>
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
