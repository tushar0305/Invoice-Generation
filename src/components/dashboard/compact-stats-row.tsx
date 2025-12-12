'use client';

import { motion } from 'framer-motion';
import { Receipt, Wallet, Gift, Package, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, cn } from '@/lib/utils';

interface StatChip {
    label: string;
    value: string | number;
    icon: React.ElementType;
    href?: string;
    color: string;
    bgColor: string;
}

interface CompactStatsRowProps {
    shopId: string;
    totalInvoices: number;
    activeLoans: number;
    khataBalance: number;
    loyaltyPoints: number;
}

export function CompactStatsRow({
    shopId,
    totalInvoices,
    activeLoans,
    khataBalance,
    loyaltyPoints
}: CompactStatsRowProps) {
    const stats: StatChip[] = [
        {
            label: 'Invoices',
            value: totalInvoices,
            icon: Receipt,
            href: `/shop/${shopId}/invoices`,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
        },
        {
            label: 'Loans',
            value: activeLoans,
            icon: Wallet,
            href: `/shop/${shopId}/loans`,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20'
        },
        {
            label: 'Khata',
            value: formatCurrency(Math.abs(khataBalance)),
            icon: TrendingUp,
            href: `/shop/${shopId}/khata`,
            color: khataBalance >= 0 ? 'text-emerald-500' : 'text-red-500',
            bgColor: khataBalance >= 0
                ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                : 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20'
        },
        {
            label: 'Loyalty',
            value: `${loyaltyPoints} pts`,
            icon: Gift,
            href: `/shop/${shopId}/loyalty`,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20'
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-2xl bg-card/80 backdrop-blur-xl border border-border shadow-lg shadow-primary/5 p-2 grid grid-cols-2 md:flex md:flex-nowrap items-center justify-between gap-2"
        >
            {stats.map((stat, index) => (
                <Link
                    key={stat.label}
                    href={stat.href || '#'}
                    className="flex-1 min-w-0 group relative p-3 rounded-xl hover:bg-primary/5 transition-colors duration-300 flex flex-col items-start justify-center gap-1 md:flex-row md:items-center md:justify-between md:gap-0 border border-transparent hover:border-primary/10"
                >
                    <div className="flex items-center gap-2 overflow-hidden w-full md:w-auto">
                        <div className={cn("p-1.5 rounded-lg shrink-0", stat.bgColor !== '' ? stat.bgColor : 'bg-muted')}>
                            <stat.icon className={cn("h-3 w-3 md:h-4 md:w-4 display-icon", stat.color)} />
                        </div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground group-hover:text-primary transition-colors truncate">
                            {stat.label}
                        </span>
                    </div>
                    <span className={cn("text-lg md:text-lg font-bold tabular-nums shrink-0 pl-1 md:pl-0", stat.color)}>
                        {stat.value}
                    </span>

                    {/* Hover Glow */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </Link>
            ))}
        </motion.div>
    );
}
