'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    Plus,
    Loader2,
    ArrowRight,
    Sparkles,
    Calendar,
    Gift,
    Scale,
    Search,
    Filter,
    Users,
    TrendingUp,
    ShieldCheck,
    Briefcase
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useActiveShop } from '@/hooks/use-active-shop';
import { useSchemes } from '@/hooks/use-schemes';
import { Switch } from '@/components/ui/switch';
import { formatCurrency, cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { supabase } from '@/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { StatCard } from '@/components/schemes/stat-card';

// --- Components ---



export default function SchemesPage() {
    const { activeShop } = useActiveShop();
    const shopId = activeShop?.id;
    const { schemes, isLoading, toggleSchemeStatus } = useSchemes(shopId);

    // Local State
    const [searchQuery, setSearchQuery] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    const [stats, setStats] = useState({ totalEnrollments: 0, totalValue: 0 });
    const [loadingStats, setLoadingStats] = useState(true);

    // Fetch extra stats
    useEffect(() => {
        if (!shopId) return;
        const fetchStats = async () => {
            try {
                // Get active enrollments with scheme_id
                const { data: enrollments, error } = await supabase
                    .from('scheme_enrollments')
                    .select('scheme_id')
                    .eq('shop_id', shopId)
                    .eq('status', 'ACTIVE');

                if (error) console.error('Error fetching stats:', error);

                const totalEnrollments = enrollments?.length || 0;

                // Calculate total monthly collection active
                // We map enrollment scheme_ids to the schemes we already fetched to get the amount
                // Note: schemes might be empty initially, so we need to depend on schemes as well for this calculation
                // But fetchStats runs on mount. Let's rely on the schemes context active.
                // Actually, let's just wait for schemes to load or re-run this when schemes change?
                // Better: calculate it in the render or useMemo if we have the enrollment counts per scheme.

                // Let's store the enrollments locally or just the calculated value
                // Since schemes are fetched via useSchemes, we might not have them inside this useEffect closure immediately if it runs parallel.
                // We'll trust that we can calculate it if we have the scheme objects. 
                // Wait, useSchemes `schemes` might be empty when this runs.

                // Alternative: join correctly in the query
                const { data: enrollmentValues, error: valError } = await supabase
                    .from('scheme_enrollments')
                    .select('scheme:schemes(installment_amount)')
                    .eq('shop_id', shopId)
                    .eq('status', 'ACTIVE');

                const totalValue = enrollmentValues?.reduce((sum, item: any) => sum + (item.scheme?.installment_amount || 0), 0) || 0;

                setStats({ totalEnrollments, totalValue });
            } finally {
                setLoadingStats(false);
            }
        };
        fetchStats();
    }, [shopId]);

    // Computed
    const filteredSchemes = useMemo(() => {
        return schemes.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = showInactive ? true : s.is_active;
            return matchesSearch && matchesStatus;
        });
    }, [schemes, searchQuery, showInactive]);

    const activeSchemesCount = schemes.filter(s => s.is_active).length;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading your schemes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-20 md:pb-8 space-y-6 md:space-y-8 max-w-7xl mx-auto p-4 md:p-8">



            {/* Header with Breadcrumb - Hidden on Mobile since we have Global Header */}
            <div className="hidden md:flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Gold Schemes</h1>
                    <p className="text-muted-foreground text-sm md:text-base mt-1">Manage your saving plans and portfolio.</p>
                </div>
            </div>

            {/* Financial Overview Cards */}
            {schemes.length > 0 && (
                <div className="flex overflow-x-auto pb-4 -mx-4 px-4 gap-4 snap-x snap-mandatory sm:grid sm:grid-cols-3 sm:pb-0 sm:mx-0 sm:px-0 no-scrollbar">
                    <div className="snap-center min-w-[85vw] sm:min-w-0">
                        <StatCard
                            title="Active Schemes"
                            value={activeSchemesCount}
                            subtext={`${schemes.length} total created`}
                            icon={Briefcase}
                            iconColor="text-blue-600 dark:text-blue-400"
                            bgColor="bg-blue-50 dark:bg-blue-900/20"
                        />
                    </div>
                    <div className="snap-center min-w-[85vw] sm:min-w-0">
                        <StatCard
                            title="Active Enrollments"
                            value={stats.totalEnrollments}
                            subtext="Customers currently paying"
                            icon={Users}
                            iconColor="text-emerald-600 dark:text-emerald-400"
                            bgColor="bg-emerald-50 dark:bg-emerald-900/20"
                        />
                    </div>
                    <div className="snap-center min-w-[85vw] sm:min-w-0">
                        <StatCard
                            title="Monthly Collection"
                            value={formatCurrency(stats.totalValue)}
                            subtext="Total active installments"
                            icon={TrendingUp}
                            iconColor="text-amber-600 dark:text-amber-400"
                            bgColor="bg-amber-50 dark:bg-amber-900/20"
                        />
                    </div>
                </div>
            )}

            {/* Content Area */}
            {schemes.length === 0 ? (
                // Hub-style Empty State
                <div className="border border-dashed border-border rounded-2xl p-8 md:p-12 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-muted/10">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 flex items-center justify-center mb-4">
                        <Sparkles className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Launch your first Gold Scheme</h3>
                    <p className="text-muted-foreground max-w-sm mb-6">Create attractive saving plans for your customers. Set terms, benefits, and start enrolling today.</p>
                    <Link href={`/shop/${shopId}/schemes/create`}>
                        <Button className="h-11 px-8 rounded-full gap-2 shadow-sm">
                            <Plus className="w-4 h-4" />
                            Create Scheme
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Sticky Header: Search & Actions */}
                    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 pt-2 -mx-4 px-4 md:-mx-8 md:px-8 transition-all duration-200 border-b border-border/40 md:border-none mb-4 md:mb-0">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search schemes..."
                                    className="pl-9 h-11 rounded-xl bg-card border-border/80 focus:ring-primary/20 transition-all shadow-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2 shrink-0 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                                <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl border border-border/50 h-11">
                                    <button
                                        onClick={() => setShowInactive(false)}
                                        className={cn(
                                            "px-4 h-full text-sm font-medium rounded-lg transition-all flex items-center gap-2",
                                            !showInactive ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-muted"
                                        )}
                                    >
                                        <div className={cn("w-2 h-2 rounded-full", !showInactive ? "bg-primary" : "bg-transparent")} />
                                        Active
                                    </button>
                                    <button
                                        onClick={() => setShowInactive(true)}
                                        className={cn(
                                            "px-4 h-full text-sm font-medium rounded-lg transition-all",
                                            showInactive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
                                        )}
                                    >
                                        All
                                    </button>
                                </div>

                                <Link href={`/shop/${shopId}/schemes/create`}>
                                    <Button className="h-11 rounded-xl gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                                        <Plus className="w-4 h-4" />
                                        <span className="hidden sm:inline">New Scheme</span>
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Scheme Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredSchemes.map((scheme, index) => (
                                <motion.div
                                    key={scheme.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                >
                                    <Link href={`/shop/${shopId}/schemes/${scheme.id}`} className="block h-full">
                                        <Card className={cn(
                                            "h-full group hover:border-primary/50 transition-all duration-300 hover:shadow-md overflow-hidden bg-card",
                                            !scheme.is_active && "opacity-70 grayscale-[0.5]"
                                        )}>
                                            <CardHeader className="p-5 pb-2">
                                                <div className="flex justify-between items-start mb-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "rounded-md px-2 py-0 border-0 font-medium",
                                                            scheme.is_active ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : "bg-slate-100 text-slate-500"
                                                        )}
                                                    >
                                                        {scheme.is_active ? 'Active' : 'Paused'}
                                                    </Badge>
                                                    <div
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            // e.stopPropagation(); // Avoid navigation if we had a button, but toggle is visual here mostly
                                                        }}
                                                    >
                                                        {/* Optional: Small text or icon, keeping it clean for now */}
                                                    </div>
                                                </div>
                                                <CardTitle className="text-xl font-bold line-clamp-1 group-hover:text-primary transition-colors">
                                                    {scheme.name}
                                                </CardTitle>
                                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1 min-h-[2.5em]">
                                                    {scheme.description || 'No description provided.'}
                                                </p>
                                            </CardHeader>

                                            <CardContent className="p-5 pt-2">
                                                {/* Financial Terms Grid */}
                                                <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-xl bg-muted/40 border border-border/50">
                                                    <div className="text-center">
                                                        <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Monthly</p>
                                                        <p className="text-sm font-bold">
                                                            {scheme.scheme_type === 'FIXED_DURATION'
                                                                ? formatCurrency(scheme.installment_amount || 0)
                                                                : 'Flexible'}
                                                        </p>
                                                    </div>
                                                    <div className="text-center border-l border-border/50">
                                                        <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Duration</p>
                                                        <p className="text-sm font-bold">{scheme.duration_months} Mo</p>
                                                    </div>
                                                    <div className="text-center border-l border-border/50">
                                                        <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Benefit</p>
                                                        <p className="text-sm font-bold text-emerald-600">
                                                            {scheme.bonus_months > 0 ? `+${scheme.bonus_months} Mo` : 'Fixed'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>

                                            <CardFooter className="p-5 pt-0 flex items-center justify-between text-sm text-muted-foreground group-hover:text-primary transition-colors">
                                                <span className="flex items-center gap-1.5 text-xs font-medium">
                                                    <ShieldCheck className="w-3.5 h-3.5" />
                                                    Secure Plan
                                                </span>
                                                <div className="flex items-center gap-1 font-medium bg-primary/5 px-3 py-1.5 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                    View Details <ArrowRight className="w-3.5 h-3.5" />
                                                </div>
                                            </CardFooter>
                                        </Card>
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {filteredSchemes.length === 0 && (
                            <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                                No schemes found matching your search.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
