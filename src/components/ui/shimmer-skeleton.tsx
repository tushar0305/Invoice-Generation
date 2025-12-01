'use client';

import { cn } from '@/lib/utils';

interface ShimmerSkeletonProps {
    className?: string;
    variant?: 'default' | 'gold' | 'circle' | 'text' | 'card';
    width?: string | number;
    height?: string | number;
}

export function ShimmerSkeleton({ 
    className, 
    variant = 'default',
    width,
    height 
}: ShimmerSkeletonProps) {
    const baseClasses = "rounded-[18px] shimmer-gold";
    
    const variantClasses = {
        default: "",
        gold: "bg-gradient-to-r from-amber-100/50 via-amber-200/50 to-amber-100/50 dark:from-amber-900/30 dark:via-amber-800/40 dark:to-amber-900/30",
        circle: "rounded-full",
        text: "h-4 rounded-lg",
        card: "p-4 border border-amber-200/30 dark:border-amber-800/30",
    };

    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;

    return (
        <div 
            className={cn(baseClasses, variantClasses[variant], className)}
            style={style}
        />
    );
}

// Hero skeleton loader
export function HeroSkeleton() {
    return (
        <div className="rounded-[18px] bg-gradient-to-r from-amber-50/80 via-white/90 to-amber-100/80 dark:from-amber-950/40 dark:via-background/90 dark:to-amber-900/30 p-4 shadow-md border border-amber-200/40 dark:border-amber-800/30" style={{ minHeight: '90px', maxHeight: '120px' }}>
            <div className="flex items-center justify-between h-full">
                <div className="flex flex-col gap-2">
                    <ShimmerSkeleton className="h-3 w-24" variant="text" />
                    <ShimmerSkeleton className="h-4 w-32" variant="text" />
                    <ShimmerSkeleton className="h-8 w-40" variant="text" />
                </div>
                <ShimmerSkeleton className="h-10 w-10" variant="circle" />
            </div>
        </div>
    );
}

// Metrics strip skeleton loader
export function MetricsStripSkeleton() {
    return (
        <div className="flex gap-3 overflow-hidden pb-1">
            {[...Array(4)].map((_, i) => (
                <div 
                    key={i}
                    className="flex-shrink-0 rounded-[16px] p-3 min-w-[140px] bg-gradient-to-br from-white/60 via-white/40 to-amber-50/30 dark:from-white/5 dark:via-white/3 dark:to-amber-900/10 border border-amber-200/30 dark:border-amber-700/30"
                    style={{ animationDelay: `${i * 100}ms` }}
                >
                    <div className="flex items-center gap-1.5 mb-2">
                        <ShimmerSkeleton className="h-3.5 w-3.5" variant="circle" />
                        <ShimmerSkeleton className="h-2.5 w-16" variant="text" />
                    </div>
                    <ShimmerSkeleton className="h-5 w-24 mb-1" variant="text" />
                    <ShimmerSkeleton className="h-2 w-14" variant="text" />
                </div>
            ))}
        </div>
    );
}

// Card skeleton loader
export function CardSkeleton() {
    return (
        <div className="rounded-[18px] bg-gradient-to-br from-white/80 via-white/60 to-amber-50/40 dark:from-white/5 dark:via-white/3 dark:to-amber-900/10 p-4 border border-amber-200/30 dark:border-amber-700/30 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <ShimmerSkeleton className="h-10 w-10" variant="circle" />
                <div className="flex-1">
                    <ShimmerSkeleton className="h-4 w-32 mb-2" variant="text" />
                    <ShimmerSkeleton className="h-3 w-24" variant="text" />
                </div>
            </div>
            <ShimmerSkeleton className="h-20 w-full rounded-xl" />
        </div>
    );
}

// Dashboard loading skeleton
export function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <HeroSkeleton />
            <MetricsStripSkeleton />
            <div className="h-16 rounded-[18px] shimmer-gold" /> {/* Ticker */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
            </div>
        </div>
    );
}
