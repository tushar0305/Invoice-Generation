'use client';

import { motion, useAnimation, useInView } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { BarChart3, TrendingUp, Users, DollarSign, MousePointer2, Bell, Search, Menu, Home, Package, FileText, Settings, ShoppingBag, ArrowUpRight } from 'lucide-react';

export function HeroDashboardPreview() {
    const [hoveredCard, setHoveredCard] = useState<number | null>(null);
    const cursorControls = useAnimation();
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { once: false, amount: 0.3 });

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
        <div ref={containerRef} className="relative w-full max-w-7xl mx-auto pt-10 px-2 sm:px-6 lg:px-8 perspective-1000">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-radial from-gold-500/15 to-transparent blur-[120px] pointer-events-none" />

            {/* Mobile iPhone Mockup - Only visible on mobile */}
            <motion.div
                initial={{ rotateX: 20, opacity: 0, y: 100 }}
                animate={{ rotateX: 0, opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="md:hidden relative mx-auto"
                style={{ maxWidth: '375px' }}
            >
                {/* Golden Glow Effect - Lighter and animated on scroll */}
                <motion.div 
                    className="absolute -inset-1 bg-gradient-to-r from-gold-400/40 via-amber-500/40 to-gold-600/40 rounded-[3.2rem] blur-lg"
                    animate={{ 
                        opacity: isInView ? [0.3, 0.5, 0.3] : 0.2,
                        scale: isInView ? [1, 1.02, 1] : 0.98
                    }}
                    transition={{ 
                        duration: 3, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                    }}
                    aria-hidden="true" 
                />
                <motion.div 
                    className="absolute -inset-0.5 bg-gradient-to-r from-gold-300/25 via-gold-400/25 to-amber-400/25 rounded-[3.1rem] bg-[length:200%_100%]"
                    animate={{ 
                        opacity: isInView ? 0.4 : 0.2,
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                    }}
                    transition={{ 
                        opacity: { duration: 0.5 },
                        backgroundPosition: { duration: 4, repeat: Infinity, ease: "linear" }
                    }}
                    aria-hidden="true" 
                />
                
                {/* iPhone Frame */}
                <div className="relative bg-slate-900 rounded-[3rem] p-3 shadow-2xl ring-1 ring-gold-400/20">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-slate-900 rounded-b-3xl z-20" />
                    
                    {/* Screen */}
                    <div className="relative bg-background rounded-[2.5rem] overflow-hidden" style={{ aspectRatio: '9/19.5' }}>
                        {/* Status Bar */}
                        <div className="absolute top-0 left-0 right-0 h-12 bg-background/95 backdrop-blur-md z-10 flex items-center justify-between px-8 pt-2">
                            <span className="text-xs font-semibold">9:41</span>
                            <div className="flex items-center gap-1">
                                <div className="w-4 h-3 border border-current rounded-sm relative">
                                    <div className="absolute inset-0.5 bg-current rounded-[1px]" />
                                </div>
                            </div>
                        </div>

                        {/* Dashboard Content */}
                        <div className="h-full overflow-y-auto pt-12 pb-20 bg-muted/10">
                            {/* Header */}
                            <div className="px-6 py-4 bg-background/50 backdrop-blur-sm">
                                <h2 className="text-lg font-bold">Overview</h2>
                                <p className="text-xs text-muted-foreground">Welcome back</p>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-3 px-4 py-4">
                                {[
                                    { label: 'Revenue', value: '₹4.5L', icon: DollarSign, color: 'text-emerald-500' },
                                    { label: 'Orders', value: '24', icon: ShoppingBag, color: 'text-blue-500' },
                                    { label: 'Gold Rate', value: '₹6,240/g', icon: TrendingUp, color: 'text-amber-500' },
                                    { label: 'Customers', value: '18', icon: Users, color: 'text-purple-500' },
                                ].map((stat, i) => (
                                    <div key={i} className="p-3 rounded-xl border border-border bg-card shadow-sm">
                                        <stat.icon className={cn("w-4 h-4 mb-2", stat.color)} />
                                        <div className="text-xs text-muted-foreground">{stat.label}</div>
                                        <div className="text-lg font-bold">{stat.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Chart */}
                            <div className="mx-4 my-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                                <h3 className="text-sm font-semibold mb-3">Weekly Sales</h3>
                                <div className="flex items-end justify-between gap-1 h-32">
                                    {[35, 55, 45, 70, 60, 75, 50].map((h, i) => (
                                        <div key={i} className="w-full bg-primary/20 rounded-t-sm" style={{ height: `${h}%` }} />
                                    ))}
                                </div>
                            </div>

                            {/* Recent Transactions */}
                            <div className="mx-4 my-4 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                                <div className="px-4 py-3 border-b border-border bg-muted/20">
                                    <h3 className="text-sm font-semibold">Recent Orders</h3>
                                </div>
                                <div className="divide-y divide-border">
                                    {[
                                        { name: 'Rahul M.', amount: '₹24,500', status: 'Paid' },
                                        { name: 'Sneha P.', amount: '₹1,20,000', status: 'Pending' },
                                        { name: 'Amit K.', amount: '₹8,450', status: 'Paid' },
                                    ].map((tx, i) => (
                                        <div key={i} className="px-4 py-3 flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                                                    {tx.name.charAt(0)}
                                                </div>
                                                <span className="font-medium">{tx.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium">{tx.amount}</div>
                                                <div className={cn("text-[10px]", tx.status === 'Paid' ? 'text-emerald-600' : 'text-amber-600')}>
                                                    {tx.status}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Navigation */}
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-md border-t border-border flex items-center justify-around px-4 pb-2">
                            {[Home, ShoppingBag, BarChart3, Settings].map((Icon, i) => (
                                <Icon key={i} className={cn("w-5 h-5", i === 0 ? "text-primary" : "text-muted-foreground")} />
                            ))}
                        </div>
                    </div>
                    
                    {/* Home Indicator */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
                </div>
            </motion.div>

            {/* Desktop Mac Frame - Hidden on mobile */}
            <motion.div
                initial={{ rotateX: 20, opacity: 0, y: 100 }}
                animate={{ rotateX: 0, opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="hidden md:block relative"
            >
                {/* Golden Border Glow Effect - Lighter and animated on scroll */}
                <motion.div 
                    className="absolute -inset-1 bg-gradient-to-r from-gold-400/35 via-amber-500/35 to-gold-600/35 rounded-2xl blur-xl"
                    animate={{ 
                        opacity: isInView ? [0.25, 0.45, 0.25] : 0.15,
                        scale: isInView ? [1, 1.01, 1] : 0.99
                    }}
                    transition={{ 
                        duration: 3.5, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                    }}
                    aria-hidden="true" 
                />
                <motion.div 
                    className="absolute -inset-0.5 bg-gradient-to-r from-gold-300/20 via-gold-400/20 to-amber-400/20 rounded-2xl bg-[length:200%_100%]"
                    animate={{ 
                        opacity: isInView ? 0.35 : 0.15,
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                    }}
                    transition={{ 
                        opacity: { duration: 0.5 },
                        backgroundPosition: { duration: 5, repeat: Infinity, ease: "linear" }
                    }}
                    aria-hidden="true" 
                />
                
                {/* Mac Frame */}
                <div className="relative bg-background rounded-xl border border-gold-400/25 shadow-2xl overflow-hidden backdrop-blur-sm ring-1 ring-gold-300/15">
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
                </div>
            </motion.div>
        </div>
    );
}
