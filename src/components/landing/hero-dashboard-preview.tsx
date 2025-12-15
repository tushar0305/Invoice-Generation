'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { BarChart3, TrendingUp, Users, DollarSign, MousePointer2, Bell, Search, Menu, Home, Package, FileText, Settings, ShoppingBag, ArrowUpRight } from 'lucide-react';

export function HeroDashboardPreview() {
    const [hoveredCard, setHoveredCard] = useState<number | null>(null);
    const cursorControls = useAnimation();

    // Sequence for cursor animation
    // Sequence for cursor animation
    useEffect(() => {
        let isMounted = true;

        const sequence = async () => {
            // Wait for component to fully mount and Framer Motion to attach controls
            await new Promise(r => setTimeout(r, 1000));

            while (isMounted) {
                try {
                    // Initial Position outside
                    if (!isMounted) break;
                    await cursorControls.start({ x: 0, y: 0, opacity: 0, transition: { duration: 0 } });

                    // Move to first card
                    if (!isMounted) break;
                    await cursorControls.start({ opacity: 1, transition: { duration: 0.5 } });

                    if (!isMounted) break;
                    await cursorControls.start({ x: 220, y: 160, transition: { duration: 1.5, ease: "easeInOut" } });
                    if (isMounted) setHoveredCard(0); // Revenue Card
                    await new Promise(r => setTimeout(r, 600));

                    // Move to "Top Selling" item
                    if (isMounted) setHoveredCard(null);

                    if (!isMounted) break;
                    await cursorControls.start({ x: 800, y: 250, transition: { duration: 1.2, ease: "easeInOut" } });
                    // Simulate hover effect
                    await new Promise(r => setTimeout(r, 600));

                    // Move to Chart bar
                    if (!isMounted) break;
                    await cursorControls.start({ x: 400, y: 400, transition: { duration: 1, ease: "easeInOut" } });

                    // Simulate interaction
                    if (!isMounted) break;
                    await cursorControls.start({ scale: 0.9, transition: { duration: 0.1 } });
                    await cursorControls.start({ scale: 1, transition: { duration: 0.1 } });

                    // Move away
                    if (!isMounted) break;
                    await cursorControls.start({ x: 900, y: 600, opacity: 0, transition: { duration: 1.5 } });
                    await new Promise(r => setTimeout(r, 1500));
                } catch (error) {
                    // Ignore errors resulting from unmounting during animation
                    if (!isMounted) break;
                    console.error("Animation sequence error:", error);
                    break;
                }
            }
        };

        sequence();

        return () => {
            isMounted = false;
        };
    }, [cursorControls]);

    return (
        <div className="relative w-full max-w-7xl mx-auto pt-10 px-2 sm:px-6 lg:px-8 perspective-1000">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-radial from-gold-500/15 to-transparent blur-[120px] pointer-events-none" />

            {/* Desktop Mac Frame */}
            <motion.div
                initial={{ rotateX: 20, opacity: 0, y: 100 }}
                animate={{ rotateX: 0, opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="relative bg-background rounded-xl border border-border shadow-2xl overflow-hidden backdrop-blur-sm"
            >
                {/* Mac Header */}
                <div className="h-9 bg-muted/40 border-b border-border flex items-center px-4 gap-2 sticky top-0 z-20 backdrop-blur-md">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400/80 hover:bg-red-500 transition-colors" />
                        <div className="w-3 h-3 rounded-full bg-amber-400/80 hover:bg-amber-500 transition-colors" />
                        <div className="w-3 h-3 rounded-full bg-emerald-400/80 hover:bg-emerald-500 transition-colors" />
                    </div>
                </div>

                {/* Dashboard Application Shell */}
                <div className="flex h-[500px] md:h-[700px] overflow-hidden bg-muted/10">

                    {/* Sidebar */}
                    <div className="w-64 border-r border-border bg-card flex flex-col p-4 gap-2 hidden md:flex shrink-0">
                        <div className="h-10 w-full bg-primary/5 rounded-lg mb-6 flex items-center px-3 gap-3 border border-primary/10">
                            <div className="h-6 w-6 rounded bg-primary/20" />
                            <div className="h-3 w-24 bg-primary/20 rounded" />
                        </div>

                        <div className="text-xs font-medium text-muted-foreground px-2 py-1">MAIN MENU</div>
                        {[
                            { icon: Home, label: 'Dashboard', active: true },
                            { icon: ShoppingBag, label: 'Sales' },
                            { icon: Package, label: 'Inventory' },
                            { icon: Users, label: 'Customers' },
                        ].map((item, i) => (
                            <div key={i} className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                item.active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                            )}>
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </div>
                        ))}

                        <div className="mt-6 text-xs font-medium text-muted-foreground px-2 py-1">FINANCE</div>
                        {[
                            { icon: FileText, label: 'Invoices' },
                            { icon: BarChart3, label: 'Reports' },
                            { icon: Settings, label: 'Settings' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </div>
                        ))}
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                        {/* App Header */}
                        <div className="h-16 border-b border-border bg-background/50 backdrop-blur-sm px-6 flex justify-between items-center sticky top-0 z-10">
                            <div>
                                <h2 className="text-lg font-semibold tracking-tight">Overview</h2>
                                <p className="text-sm text-muted-foreground">Welcome back to your store.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="h-9 px-4 rounded-full bg-muted border border-border flex items-center gap-2 text-sm text-muted-foreground">
                                    <Search className="w-4 h-4" />
                                    <span>Search...</span>
                                </div>
                                <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center">
                                    <Bell className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-primary/50 border border-primary/20" />
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Total Revenue', value: '₹4,50,290', change: '+12.5%', trend: 'up', icon: DollarSign, color: 'text-emerald-500' },
                                    { label: 'Active Orders', value: '24', change: '+4', trend: 'up', icon: ShoppingBag, color: 'text-blue-500' },
                                    { label: 'Gold Rate (24k)', value: '₹6,240/g', change: '+0.8%', trend: 'up', icon: TrendingUp, color: 'text-amber-500' },
                                    { label: 'New Customers', value: '18', change: '+12%', trend: 'up', icon: Users, color: 'text-purple-500' },
                                ].map((stat, i) => (
                                    <motion.div
                                        key={i}
                                        className={cn(
                                            "p-4 rounded-xl border border-border bg-card transition-all duration-300",
                                            hoveredCard === i ? "scale-105 shadow-xl border-primary/50 relative z-10" : "shadow-sm"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className={cn("p-2 rounded-lg bg-primary/5", stat.color.replace('text-', 'bg-').replace('500', '500/10'))}>
                                                <stat.icon className={cn("w-4 h-4", stat.color)} />
                                            </div>
                                            <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center gap-0.5")}>
                                                <ArrowUpRight className="w-3 h-3" /> {stat.change}
                                            </span>
                                        </div>
                                        <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
                                        <div className="text-2xl font-bold tracking-tight mt-1">{stat.value}</div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Revenue Chart */}
                                <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-semibold">Revenue Analytics</h3>
                                        <div className="flex gap-2">
                                            <div className="h-8 px-3 rounded-md bg-muted text-xs font-medium flex items-center">Weekly</div>
                                            <div className="h-8 px-3 rounded-md border border-border text-xs font-medium flex items-center">Monthly</div>
                                        </div>
                                    </div>
                                    <div className="flex items-end justify-between gap-3 h-64 px-2">
                                        {[35, 55, 45, 70, 60, 75, 50, 65, 80, 55, 85, 95].map((h, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ height: 0 }}
                                                animate={{ height: `${h}%` }}
                                                transition={{ duration: 0.8, delay: i * 0.05 }}
                                                className="w-full bg-primary/20 hover:bg-primary rounded-t-sm transition-all duration-300 cursor-pointer relative group"
                                            >
                                                <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs py-1.5 px-3 rounded shadow-lg whitespace-nowrap z-50 transition-opacity">
                                                    ₹{(h * 1200).toLocaleString('en-IN')}
                                                    <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-popover rotate-45" />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Top Selling Products */}
                                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                                    <h3 className="font-semibold mb-6">Top Selling Items</h3>
                                    <div className="space-y-5">
                                        {[
                                            { name: 'Diamond Ring', category: 'Rings', sales: '₹45k', percent: 85 },
                                            { name: '22k Gold Chain', category: 'Chains', sales: '₹1.2L', percent: 65 },
                                            { name: 'Silver Anklet', category: 'Silver', sales: '₹12k', percent: 45 },
                                            { name: 'Plat. Pending', category: 'Pendants', sales: '₹35k', percent: 30 },
                                        ].map((item, i) => (
                                            <div key={i} className="group">
                                                <div className="flex justify-between text-sm mb-2">
                                                    <div className="font-medium group-hover:text-primary transition-colors">{item.name}</div>
                                                    <div className="text-muted-foreground">{item.sales}</div>
                                                </div>
                                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${item.percent}%` }}
                                                        transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                                                        className="h-full bg-primary rounded-full group-hover:bg-primary/80 transition-colors"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Recent Transactions */}
                            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
                                    <h3 className="font-semibold">Recent Transactions</h3>
                                    <div className="text-blue-500 text-xs font-semibold cursor-pointer hover:underline">View All</div>
                                </div>
                                <div className="divide-y divide-border">
                                    {[
                                        { name: 'Rahul M.', id: '#INV-001', date: '2 mins ago', amount: '₹24,500', status: 'Paid', statusColor: 'bg-emerald-500/10 text-emerald-600' },
                                        { name: 'Sneha P.', id: '#INV-002', date: '15 mins ago', amount: '₹1,20,000', status: 'Pending', statusColor: 'bg-amber-500/10 text-amber-600' },
                                        { name: 'Amit K.', id: '#INV-003', date: '1 hour ago', amount: '₹8,450', status: 'Paid', statusColor: 'bg-emerald-500/10 text-emerald-600' },
                                    ].map((tx, i) => (
                                        <div key={i} className="grid grid-cols-4 px-6 py-4 items-center hover:bg-muted/30 transition-colors text-sm">
                                            <div className="flex items-center gap-3 col-span-1">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                                                    {tx.name.charAt(0)}
                                                </div>
                                                <div className="font-medium">{tx.name}</div>
                                            </div>
                                            <div className="text-muted-foreground">{tx.date}</div>
                                            <div className="text-right font-medium">{tx.amount}</div>
                                            <div className="flex justify-end">
                                                <div className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", tx.statusColor)}>
                                                    {tx.status}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Simulated Cursor */}
                <motion.div
                    animate={cursorControls}
                    className="absolute top-0 left-0 z-50 pointer-events-none drop-shadow-xl"
                >
                    <MousePointer2 className="h-6 w-6 text-black fill-white drop-shadow-md transform -rotate-12" />
                </motion.div>
            </motion.div>
        </div>
    );
}
