'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Calendar, Receipt, ShoppingBag, ArrowUpRight, Users, Tag, Package, BarChart3 } from 'lucide-react';
import type { Invoice } from '@/lib/definitions';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';

interface MetricsStripProps {
    invoices: Invoice[] | null;
    totalRevenue: number;      // This Month
    totalWeekRevenue: number;  // This Week
    totalTodayRevenue: number; // Today
    totalCustomers?: number;   // Optional: Total unique customers
    isRevenueVisible?: boolean;
}

interface MetricCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subtext?: string;
    index: number;
    accentColor: string;
    isHidden?: boolean;
    desktopOnly?: boolean;
    sparkline?: number[];
}

function MetricCard({ icon, label, value, subtext, index, accentColor, isHidden, desktopOnly, sparkline }: MetricCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
                delay: index * 0.08,
                duration: 0.35,
                type: "spring",
                stiffness: 300,
                damping: 25
            }}
            className={`flex-shrink-0 snap-start lg:flex-shrink lg:snap-align-none ${desktopOnly ? 'hidden lg:block' : ''}`}
        >
            <div className={`
                relative overflow-hidden rounded-[16px] lg:rounded-[18px] px-4 py-3 lg:px-5 lg:py-4
                min-w-[140px] max-w-[160px] lg:min-w-0 lg:max-w-none lg:w-full
                bg-white dark:bg-gray-900
                border-2 border-gray-200 dark:border-gray-700
                shadow-md hover:shadow-lg transition-all duration-300
                backdrop-blur-sm group
            `}>
                {/* Subtle gradient accent */}
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${accentColor}`} />

                {/* Muted gold hover outline - Desktop only */}
                <div className="hidden lg:block absolute inset-0 rounded-[20px] border-2 border-transparent group-hover:border-[#CBB27A]/25 transition-colors duration-300 pointer-events-none" />

                {/* Icon and label row */}
                <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                        <div className="text-[#A5833A]/80 dark:text-[#CBB27A]/70">
                            {icon}
                        </div>
                        <span className="text-[10px] lg:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                            {label}
                        </span>
                    </div>

                    {/* Mini sparkline - Desktop only */}
                    {sparkline && (
                        <div className="hidden lg:flex items-end gap-0.5 h-4">
                            {sparkline.map((h, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ delay: 0.3 + i * 0.03, duration: 0.25 }}
                                    className={`w-1 rounded-full ${i === sparkline.length - 1 ? 'bg-[#A5833A]' : 'bg-[#CBB27A]/40'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Value */}
                <div className="font-bold text-lg lg:text-xl text-[#1D1F23] dark:text-white font-heading tracking-tight">
                    {isHidden ? '••••' : value}
                </div>

                {/* Subtext */}
                {subtext && (
                    <p className="text-[10px] lg:text-[11px] text-muted-foreground mt-0.5 truncate">
                        {subtext}
                    </p>
                )}
            </div>
        </motion.div>
    );
}

export function MetricsStrip({
    invoices,
    totalRevenue,
    totalWeekRevenue,
    totalTodayRevenue,
    totalCustomers = 0
}: MetricsStripProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        const scrollLeft = container.scrollLeft;
        const cardWidth = 140 + 12; // min-width + gap (approximate)
        const index = Math.round(scrollLeft / cardWidth);
        setActiveIndex(Math.min(index, coreMetrics.length - 1));
    };

    // Calculate average order value
    const paidInvoices = invoices?.filter(inv => inv.status === 'paid') || [];
    const avgOrderValue = paidInvoices.length > 0
        ? paidInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0) / paidInvoices.length
        : 0;

    // Calculate this month's invoice count
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonthInvoices = invoices?.filter(inv => {
        const invDate = new Date(inv.invoiceDate);
        return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
    }).length || 0;

    // Calculate unique customers from invoices
    const uniqueCustomers = new Set(invoices?.map(inv => inv.customerId || inv.customerSnapshot?.phone) || []);
    const customerCount = totalCustomers || uniqueCustomers.size;

    // Estimate stock value (placeholder - would come from actual stock data)
    const estimatedStockValue = totalRevenue * 1.5; // Rough estimate

    // Core metrics (shown on mobile + desktop)
    const coreMetrics = [
        {
            icon: <Calendar className="h-3.5 w-3.5" />,
            label: 'This Week',
            value: formatCurrency(totalWeekRevenue),
            subtext: 'Last 7 days',
            accentColor: 'from-[#2AA198] to-[#2AA198]/80', // Muted teal
            isCurrency: true,
            sparkline: [30, 45, 35, 60, 50, 75, 65],
        },
        {
            icon: <TrendingUp className="h-3.5 w-3.5" />,
            label: 'This Month',
            value: formatCurrency(totalRevenue),
            subtext: `${thisMonthInvoices} invoices`,
            accentColor: 'from-[#A5833A] to-[#CBB27A]', // Muted gold
            isCurrency: true,
            sparkline: [40, 55, 45, 70, 60, 85, 80],
        },
        {
            icon: <Receipt className="h-3.5 w-3.5" />,
            label: 'Total Invoices',
            value: invoices?.length || 0,
            subtext: 'All time',
            accentColor: 'from-slate-400 to-slate-500', // Neutral slate
            isCurrency: false,
        },
        {
            icon: <ShoppingBag className="h-3.5 w-3.5" />,
            label: 'Avg Order',
            value: formatCurrency(avgOrderValue),
            subtext: 'Per invoice',
            accentColor: 'from-[#A08CD5] to-[#A08CD5]/80', // Muted lavender
            isCurrency: true,
        },
    ];

    // Desktop-only extended metrics
    const desktopMetrics = [
        {
            icon: <Users className="h-3.5 w-3.5" />,
            label: 'Customers',
            value: customerCount,
            subtext: 'Unique clients',
            accentColor: 'from-[#2AA198]/80 to-[#2AA198]/60', // Lighter teal
            isCurrency: false,
            desktopOnly: true,
        },
        {
            icon: <Package className="h-3.5 w-3.5" />,
            label: 'Stock Value',
            value: formatCurrency(estimatedStockValue),
            subtext: 'Estimated',
            accentColor: 'from-[#D97A5F] to-[#D97A5F]/80', // Muted clay
            isCurrency: true,
            desktopOnly: true,
        },
    ];

    const allMetrics = [...coreMetrics, ...desktopMetrics];

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="relative w-full"
        >
            {/* Privacy toggle */}
            <button
                onClick={() => setIsVisible(!isVisible)}
                className="absolute -top-1 right-0 z-10 p-1.5 rounded-full bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 transition-colors text-[10px] font-medium text-muted-foreground border border-stone-200/40 dark:border-stone-700/30 shadow-sm"
                aria-label={isVisible ? 'Hide values' : 'Show values'}
            >
                {isVisible ? (
                    <ArrowUpRight className="h-3 w-3 text-[#A5833A] dark:text-[#CBB27A]" />
                ) : (
                    <ArrowUpRight className="h-3 w-3 text-[#A5833A]/50 dark:text-[#CBB27A]/50 rotate-180" />
                )}
            </button>

            {/* Mobile: Horizontal scrollable / Desktop: Grid */}
            <div
                className="overflow-x-auto lg:overflow-x-visible scrollbar-hide pb-1 -mx-1 px-1"
                onScroll={handleScroll}
            >
                <div className="flex gap-3 snap-x snap-mandatory lg:grid lg:grid-cols-4 xl:grid-cols-6 lg:gap-5">
                    {allMetrics.map((metric, index) => (
                        <MetricCard
                            key={metric.label}
                            icon={metric.icon}
                            label={metric.label}
                            value={metric.value}
                            subtext={metric.subtext}
                            index={index}
                            accentColor={metric.accentColor}
                            isHidden={!isVisible && metric.isCurrency}
                            desktopOnly={(metric as any).desktopOnly}
                            sparkline={(metric as any).sparkline}
                        />
                    ))}
                </div>
            </div>

            {/* Scroll indicator dots - Mobile only */}
            <div className="flex justify-center gap-1 mt-2 lg:hidden">
                {coreMetrics.map((_, i) => (
                    <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === activeIndex
                            ? 'bg-[#A5833A] w-3'
                            : 'bg-[#CBB27A]/40 dark:bg-[#A5833A]/40'
                            }`}
                    />
                ))}
            </div>
        </motion.div>
    );
}
