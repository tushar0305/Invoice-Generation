'use client';

import { motion } from 'framer-motion';
import { Receipt, Wallet, Gift, Package, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

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
        <div className="flex flex-wrap gap-2 md:gap-3">
            {stats.map((stat, index) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                    <Link
                        href={stat.href || '#'}
                        className={`
              flex items-center gap-2 px-3 py-2 rounded-full border
              ${stat.bgColor}
              backdrop-blur-md
              hover:scale-105 hover:shadow-glow-sm
              transition-all duration-300
              group cursor-pointer
            `}
                    >
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                            {stat.label}:
                        </span>
                        <span className={`text-sm font-bold ${stat.color} glow-text-sm`}>
                            {stat.value}
                        </span>
                    </Link>
                </motion.div>
            ))}
        </div>
    );
}
