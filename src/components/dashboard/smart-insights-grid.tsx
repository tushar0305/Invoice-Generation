'use client';

import { motion } from 'framer-motion';
import { ArrowRight, AlertCircle, Coins, CreditCard, Users, BookOpen, Package, GraduationCap, TrendingUp, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface SmartInsightsProps {
    shopId: string;
    stats: {
        // Scheme
        activeEnrollments: number;
        totalSchemeCollected: number;
        // Invoices
        pendingCount: number;
        totalDue: number;
        recentDueInvoice?: any;
        // Loans
        activeLoans: number;
        // Khata
        khataBalance: number;
        // Inventory
        lowStockCount: number;
        lowStockItem?: any;
        // Loyalty
        loyaltyPoints: number;
        loyaltyMembers: number;
        topLoyaltyCustomer?: any;
    };
}

export function SmartInsightsGrid({ shopId, stats }: SmartInsightsProps) {

    // Helper to generate dynamic subtitles
    const getPendingSubtitle = () => {
        if (stats.pendingCount === 0) return "Great job! All clear.";
        if (stats.recentDueInvoice) {
            return `Oldest: ${stats.recentDueInvoice.customer_name} (${formatCurrency(stats.recentDueInvoice.grand_total)})`;
        }
        return `${stats.pendingCount} Invoices Overdue`;
    };

    const getInventorySubtitle = () => {
        if (stats.lowStockCount === 0) return "Stock levels healthy";
        if (stats.lowStockItem) {
            return `Low: ${stats.lowStockItem.name} (${stats.lowStockItem.weight}g)`;
        }
        return `${stats.lowStockCount} Items Low in Stock`;
    };

    const getLoyaltySubtitle = () => {
        if (stats.loyaltyMembers === 0) return "Start rewarding customers!";
        if (stats.topLoyaltyCustomer) {
            return `Top: ${stats.topLoyaltyCustomer.name} (${stats.topLoyaltyCustomer.points} pts)`;
        }
        return `${stats.loyaltyPoints} Points Redeemed`;
    };

    const insights = [
        // 1. Gold Scheme
        {
            title: "Gold Schemes",
            icon: Coins,
            value: formatCurrency(stats.totalSchemeCollected),
            subtitle: stats.activeEnrollments > 0 ? `${stats.activeEnrollments} Active Enrollments` : "No active schemes",
            action: stats.activeEnrollments > 0 ? "Manage Schemes" : "Start New Scheme",
            href: `/shop/${shopId}/schemes`,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20",
            gradient: "from-amber-500/5",
            trend: stats.activeEnrollments > 0 ? "Active" : "Inactive"
        },
        // 2. Pending Invoices
        {
            title: "Pending Payments",
            icon: AlertCircle,
            value: formatCurrency(stats.totalDue),
            subtitle: getPendingSubtitle(),
            action: stats.pendingCount > 0 ? "Review List" : "View History",
            href: `/shop/${shopId}/invoices?status=due`,
            color: "text-rose-500",
            bg: "bg-rose-500/10",
            border: "border-rose-500/20",
            gradient: "from-rose-500/5",
            alert: stats.pendingCount > 0
        },
        // 3. Loans
        {
            title: "Active Loans",
            icon: CreditCard,
            value: stats.activeLoans.toString(),
            subtitle: stats.activeLoans > 0 ? "Active Loan Accounts" : "No active loans",
            action: "View Loans",
            href: `/shop/${shopId}/loans`,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
            gradient: "from-blue-500/5"
        },
        // 4. Khatabook
        {
            title: "Khatabook",
            icon: BookOpen,
            value: formatCurrency(stats.khataBalance),
            subtitle: "Total Udhaar Market",
            action: "Open Khata",
            href: `/shop/${shopId}/khata`,
            color: "text-violet-500",
            bg: "bg-violet-500/10",
            border: "border-violet-500/20",
            gradient: "from-violet-500/5"
        },
        // 5. Inventory
        {
            title: "Inventory Alert",
            icon: Package,
            value: stats.lowStockCount.toString(),
            subtitle: getInventorySubtitle(),
            action: stats.lowStockCount > 0 ? "Restock Now" : "View Inventory",
            href: `/shop/${shopId}/inventory`,
            color: "text-orange-500",
            bg: "bg-orange-500/10",
            border: "border-orange-500/20",
            gradient: "from-orange-500/5",
            alert: stats.lowStockCount > 0
        },
        // 6. Loyalty
        {
            title: "Loyalty Program",
            icon: GraduationCap,
            value: stats.loyaltyMembers.toString(),
            subtitle: getLoyaltySubtitle(),
            action: "View Rewards",
            href: `/shop/${shopId}/loyalty`,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
            gradient: "from-emerald-500/5"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            {insights.map((item, idx) => (
                <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="h-full"
                >
                    <div className={cn(
                        "relative overflow-hidden rounded-xl border backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 group h-full bg-card/40 flex flex-col",
                        item.border
                    )}>
                        {/* Background Gradient */}
                        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-40 group-hover:opacity-60 transition-opacity", item.gradient, "to-transparent")} />

                        <div className="relative z-10 p-5 flex flex-col justify-between h-full space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-lg transition-colors shrink-0", item.bg, item.color)}>
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <h3 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{item.title}</h3>
                                        <div className="text-xl font-bold font-heading text-foreground tracking-tight leading-none">{item.value}</div>
                                    </div>
                                </div>
                                {item.alert && (
                                    <span className="flex h-2.5 w-2.5 mt-1">
                                        <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-rose-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                                    </span>
                                )}
                            </div>

                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground bg-background/50 p-2 rounded-md border border-border/50 truncate">
                                    {item.alert && <AlertTriangle className="w-3 h-3 inline mr-1 text-rose-500" />}
                                    {item.subtitle}
                                </p>
                            </div>

                            <div className="pt-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-between group/btn hover:bg-background/80 hover:text-primary transition-all border-dashed border-border/60 hover:border-primary/40 h-8 text-xs"
                                    asChild
                                >
                                    <Link href={item.href}>
                                        {item.action}
                                        <ArrowRight className="w-3 h-3 opacity-50 -translate-x-1 group-hover/btn:translate-x-0 group-hover/btn:opacity-100 transition-all" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
