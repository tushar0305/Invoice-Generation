'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Plus,
    Loader2,
    ArrowRight,
    Sparkles,
    TrendingUp,
    Users,
    UserPlus,
    ShieldCheck,
    Briefcase,
    Search,
    LayoutGrid,
    List
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useActiveShop } from '@/hooks/use-active-shop';
import { useSchemes } from '@/hooks/use-schemes';
import { formatCurrency, cn } from '@/lib/utils';
// import { supabase } from '@/supabase/client'; // Removed unused import if not used elsewhere (checking validation)
import { supabase } from '@/supabase/client'; // Keeping it if needed for other things, but logic suggests removing if fully replaced.
import { getSchemeStats } from '@/actions/dashboard-actions';
import { motion, AnimatePresence } from 'framer-motion';
import { StatCard } from '@/components/schemes/stat-card';
import { SchemesHeader } from '@/components/schemes/schemes-header';
import { MaturityForecast } from '@/components/schemes/analytics/maturity-forecast';
import { DefaulterList } from '@/components/schemes/analytics/defaulter-list';
import { EnrollmentWizard } from '@/components/schemes/enrollment-wizard';
import { EnrolledCustomersDrawer } from '@/components/schemes/enrolled-customers-drawer';

export default function SchemesPage() {
    const { activeShop, isLoading: isShopLoading } = useActiveShop();
    const shopId = activeShop?.id;
    const { schemes, isLoading: isSchemesLoading } = useSchemes(shopId);
    const router = useRouter();

    const isLoading = isShopLoading || isSchemesLoading;

    // Local State
    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    const [stats, setStats] = useState({ totalEnrollments: 0, totalValue: 0 });
    const [loadingStats, setLoadingStats] = useState(true);

    // Fetch stats using Server Action
    useEffect(() => {
        if (!shopId) return;
        const fetchStats = async () => {
            try {
                const data = await getSchemeStats(shopId);
                setStats({
                    totalEnrollments: data.activeEnrollments,
                    totalValue: data.monthlyCollection || 0
                });
            } catch (error) {
                console.error("Failed to fetch scheme stats:", error);
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
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading your schemes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-24 md:pb-8 transition-colors duration-300">

            {/* HEADER */}
            <SchemesHeader
                shopName={activeShop?.shopName || 'My Shop'}
                stats={stats}
                onAddNew={() => router.push(`/shop/${shopId}/schemes/create`)}
                onLuckyDraw={() => router.push(`/shop/${shopId}/schemes/lucky-draw`)}
            />

            {/* MAIN CONTENT - Overlaps Header */}
            <div className="max-w-5xl mx-auto px-4 md:px-8 -mt-8 relative z-10 space-y-8">

                {/* TABS */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <div className="flex justify-center md:justify-start">
                        <TabsList className="h-auto p-1.5 bg-background/80 backdrop-blur-xl border border-border shadow-xl shadow-black/5 rounded-full grid grid-cols-2 w-full md:w-auto md:inline-flex md:h-14">
                            <TabsTrigger
                                value="overview"
                                className="rounded-full px-6 md:px-8 py-3 md:py-0 h-full text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all capitalize"
                            >
                                Overview
                            </TabsTrigger>
                            <TabsTrigger
                                value="schemes"
                                className="rounded-full px-6 md:px-8 py-3 md:py-0 h-full text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all capitalize"
                            >
                                All Schemes
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* OVERVIEW TAB */}
                    <TabsContent value="overview" className="space-y-6 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* Mobile Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 md:hidden">
                            <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm col-span-2">
                                <CardContent className="p-4 text-center">
                                    <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalValue)}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Value</p>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm col-span-1">
                                <CardContent className="p-4 text-center">
                                    <p className="text-2xl font-bold text-foreground">{stats.totalEnrollments}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Enrollments</p>
                                </CardContent>
                            </Card>
                            <Card className="border-none shadow-sm bg-card/60 backdrop-blur-sm col-span-1">
                                <CardContent className="p-4 text-center">
                                    <p className="text-2xl font-bold text-foreground">{activeSchemesCount}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Active Schemes</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Desktop Additional Stats (Active Schemes) */}
                        <div className="hidden md:grid md:grid-cols-3 gap-6">
                            <StatCard
                                title="Active Schemes"
                                value={activeSchemesCount}
                                subtext={`${schemes.length} total created`}
                                icon={Briefcase}
                                iconColor="text-blue-600 dark:text-blue-400"
                                bgColor="bg-blue-50 dark:bg-blue-900/20"
                            />
                            <StatCard
                                title="Active Enrollments"
                                value={stats.totalEnrollments}
                                subtext="Customers currently paying"
                                icon={Users}
                                iconColor="text-emerald-600 dark:text-emerald-400"
                                bgColor="bg-emerald-50 dark:bg-emerald-900/20"
                            />
                            <StatCard
                                title="Monthly Collection"
                                value={formatCurrency(stats.totalValue)}
                                subtext="Total active installments"
                                icon={TrendingUp}
                                iconColor="text-amber-600 dark:text-amber-400"
                                bgColor="bg-amber-50 dark:bg-amber-900/20"
                            />
                        </div>

                        {/* Quick Actions / Empty State */}
                        {schemes.length === 0 ? (
                            <Card className="border-0 bg-gradient-to-br from-primary/5 to-primary/10 border-dashed border-2 border-primary/20 shadow-none">
                                <CardContent className="p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                        <Sparkles className="w-8 h-8 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground">Launch your first Gold Scheme</h3>
                                    <p className="text-muted-foreground max-w-sm">
                                        Create attractive saving plans for your customers. Set terms, benefits, and start enrolling today.
                                    </p>
                                    <Button onClick={() => router.push(`/shop/${shopId}/schemes/create`)} className="rounded-full px-8 mt-4">
                                        <Plus className="w-4 h-4 mr-2" /> Create Scheme
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-6">
                                {/* Analytics Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <MaturityForecast shopId={shopId!} />
                                    <DefaulterList shopId={shopId!} />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <Card className="border-none shadow-xl shadow-gray-200/50 dark:shadow-black/20 bg-card overflow-hidden relative group">
                                        <CardContent className="p-6 md:p-8 flex flex-col justify-center h-full space-y-4">
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-bold">Manage Schemes</h3>
                                                <p className="text-muted-foreground text-sm leading-relaxed">
                                                    View and edit your existing schemes, or create new ones to attract more customers.
                                                </p>
                                            </div>
                                            <Button variant="outline" className="w-full sm:w-auto rounded-full" onClick={() => setActiveTab('schemes')}>
                                                View All Schemes
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-0 bg-gradient-to-br from-primary/10 to-primary/5 text-foreground shadow-xl shadow-primary/5">
                                        <CardContent className="p-6 md:p-8 flex flex-col justify-center h-full space-y-4">
                                            <div className="p-3 bg-primary/10 rounded-xl w-fit">
                                                <Sparkles className="h-6 w-6 text-primary" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-bold">Grow Your Business</h3>
                                                <p className="text-muted-foreground text-sm leading-relaxed">
                                                    Gold schemes are a great way to build customer loyalty and ensure recurring revenue.
                                                </p>
                                            </div>
                                            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-full shadow-lg shadow-primary/20" onClick={() => router.push(`/shop/${shopId}/schemes/create`)}>
                                                <Plus className="mr-2 h-4 w-4" /> Create New Scheme
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* SCHEMES LIST TAB */}
                    <TabsContent value="schemes" className="space-y-6 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* Search & Filter Bar */}
                        <div className="bg-background/95 backdrop-blur-md p-4 rounded-2xl border border-border/50 shadow-sm sticky top-0 md:top-20 z-40 transition-all duration-200 mb-6">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search schemes..."
                                        className="pl-9 h-11 rounded-xl bg-background border-border/80 focus:ring-primary/20 transition-all shadow-sm"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
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
                                </div>
                            </div>
                        </div>

                        {/* Grid */}
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
                                                "h-full group hover:border-primary/50 transition-all duration-300 hover:shadow-md overflow-hidden bg-card border-border/60",
                                                !scheme.is_active && "opacity-70 grayscale-[0.5]"
                                            )}>
                                                <CardHeader className="p-5 pb-2">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex gap-2">
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    "rounded-md px-2 py-0 border-0 font-medium",
                                                                    scheme.is_active ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : "bg-slate-100 text-slate-500"
                                                                )}
                                                            >
                                                                {scheme.is_active ? 'Active' : 'Paused'}
                                                            </Badge>
                                                            {scheme.calculation_type === 'WEIGHT_ACCUMULATION' && (
                                                                <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
                                                                    Gold SIP
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-1" onClick={(e) => e.preventDefault()}>
                                                            <EnrolledCustomersDrawer
                                                                shopId={shopId!}
                                                                schemeId={scheme.id}
                                                                schemeName={scheme.name}
                                                                trigger={
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" title="View Enrollments">
                                                                        <Users className="h-4 w-4" />
                                                                    </Button>
                                                                }
                                                            />
                                                            <EnrollmentWizard
                                                                shopId={shopId!}
                                                                schemeId={scheme.id}
                                                                trigger={
                                                                    <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 text-muted-foreground hover:text-primary" title="Enroll Customer">
                                                                        <UserPlus className="h-4 w-4" />
                                                                    </Button>
                                                                }
                                                            />
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
                                                            <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">
                                                                {scheme.payment_frequency === 'WEEKLY' ? 'Weekly' :
                                                                    scheme.payment_frequency === 'DAILY' ? 'Daily' : 'Monthly'}
                                                            </p>
                                                            <p className="text-sm font-bold">
                                                                {scheme.scheme_type === 'FIXED_DURATION'
                                                                    ? formatCurrency(scheme.scheme_amount || 0)
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
                                                                {scheme.benefit_type === 'BONUS_MONTH' ? `+${scheme.bonus_months} Mo` :
                                                                    scheme.benefit_type === 'INTEREST' ? `${scheme.interest_rate}%` :
                                                                        scheme.benefit_type === 'MAKING_CHARGE_DISCOUNT' ? 'No MC' : 'Fixed'}
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
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
