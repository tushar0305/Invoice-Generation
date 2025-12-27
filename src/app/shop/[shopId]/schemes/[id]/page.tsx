'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveShop } from '@/hooks/use-active-shop';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, UserPlus, Coins, TrendingUp, Calendar, Phone, Wallet, Loader2, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import type { Scheme, SchemeEnrollment } from '@/lib/scheme-types';
import { PaymentEntryModal } from '@/components/schemes/payment-entry-modal';
import { RedemptionModal } from '@/components/schemes/redemption-modal';
import { calculateMaturityValue } from '@/lib/utils/scheme-calculations';
import { formatCurrency, cn } from '@/lib/utils';
import { StatCard } from '@/components/schemes/stat-card';



import { EnrollmentWizard } from '@/components/schemes/enrollment-wizard';

export default function SchemeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const schemeId = unwrappedParams.id;

    const router = useRouter();
    const { activeShop } = useActiveShop();
    const shopId = activeShop?.id;
    const { toast } = useToast();

    const [scheme, setScheme] = useState<Scheme | null>(null);
    const [enrollments, setEnrollments] = useState<SchemeEnrollment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isRedemptionModalOpen, setIsRedemptionModalOpen] = useState(false);
    const [selectedEnrollment, setSelectedEnrollment] = useState<SchemeEnrollment | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const totalPages = Math.ceil(enrollments.length / itemsPerPage);
    const paginatedEnrollments = enrollments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    const fetchData = useCallback(async () => {
        if (!shopId || !schemeId) return;

        // Only set loading on initial load, not on refresh
        if (!scheme) setIsLoading(true);

        try {
            const { data: schemeData, error: schemeError } = await supabase
                .from('schemes')
                .select('*')
                .eq('id', schemeId)
                .single();

            if (schemeError) throw schemeError;
            setScheme(schemeData as unknown as Scheme);

            const { data: enrollData, error: enrollError } = await supabase
                .from('scheme_enrollments')
                .select('*, customer:customers(name, phone)')
                .eq('scheme_id', schemeId)
                .order('created_at', { ascending: false });

            if (enrollError) throw enrollError;
            setEnrollments(enrollData as unknown as SchemeEnrollment[]);

        } catch (error: any) {
            console.error('Error fetching scheme details:', error);
            toast({
                title: "Error",
                description: "Could not load scheme details",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }, [shopId, schemeId, toast, scheme]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenPayment = (enrollment: SchemeEnrollment) => {
        const enrollmentWithScheme = { ...enrollment, scheme: scheme! };
        setSelectedEnrollment(enrollmentWithScheme);
        setIsPaymentModalOpen(true);
    };

    const handleOpenRedemption = (enrollment: SchemeEnrollment) => {
        const enrollmentWithScheme = { ...enrollment, scheme: scheme! };
        setSelectedEnrollment(enrollmentWithScheme);
        setIsRedemptionModalOpen(true);
    };

    const handlePaymentSuccess = () => {
        fetchData();
        router.refresh();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">Loading scheme...</p>
                </div>
            </div>
        );
    }

    if (!scheme) {
        return (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
                <p className="text-muted-foreground">Scheme not found.</p>
            </div>
        );
    }

    const totalCollected = enrollments.reduce((sum, en) => sum + (en.total_paid || 0), 0);
    const totalGold = enrollments.reduce((sum, en) => sum + (en.total_gold_weight_accumulated || 0), 0);

    return (
        <div className="relative min-h-screen pb-24 md:pb-8">
            {/* Background Elements */}
            <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-background -z-10" />
            <div className="fixed top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10" />

            <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
                {/* Glass Header */}
                <div className="relative overflow-hidden rounded-3xl border border-primary/10 shadow-xl bg-gradient-to-br from-primary/5 via-background to-background backdrop-blur-xl p-6 md:p-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50" />

                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-5">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.back()}
                                className="shrink-0 h-11 w-11 rounded-full bg-background/50 border border-border/50 hover:bg-background hover:scale-105 transition-all shadow-sm"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                                        {scheme.name}
                                    </h1>
                                    <Badge
                                        variant={scheme.is_active ? 'default' : 'secondary'}
                                        className={cn(
                                            "text-xs font-medium px-3 py-1 rounded-full shrink-0 border shadow-sm",
                                            scheme.is_active
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                : 'bg-muted text-muted-foreground border-border/50'
                                        )}
                                    >
                                        <span className={cn(
                                            "w-1.5 h-1.5 rounded-full mr-2 animate-pulse",
                                            scheme.is_active ? "bg-emerald-500" : "bg-muted-foreground"
                                        )} />
                                        {scheme.is_active ? 'Active' : 'Paused'}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-background/40 border border-border/40">
                                        <Calendar className="w-4 h-4 text-primary" />
                                        <span className="font-medium">{scheme.duration_months} Months</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-background/40 border border-border/40">
                                        <Wallet className="w-4 h-4 text-primary" />
                                        <span className="font-medium">
                                            {scheme.scheme_type === 'FIXED_DURATION' && (scheme.scheme_amount || 0) > 0
                                                ? formatCurrency(scheme.scheme_amount || 0) + '/mo'
                                                : 'Flexible Amount'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                className="rounded-full hidden md:flex"
                                onClick={() => router.push(`/shop/${shopId}/schemes/create?edit=${schemeId}`)}
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Scheme
                            </Button>
                            <EnrollmentWizard
                                shopId={shopId!}
                                schemeId={schemeId}
                                onSuccess={fetchData}
                                trigger={
                                    <Button className="rounded-full shadow-lg shadow-primary/20 w-full md:w-auto">
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Enroll Customer
                                    </Button>
                                }
                            />
                        </div>
                    </div>
                </div>

                {/* Stats Grid - Responsive Grid on Mobile */}
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="col-span-1 h-full">
                        <StatCard
                            title="Total Enrollments"
                            value={enrollments.length}
                            subtext="Active members"
                            icon={UserPlus}
                            iconColor="text-blue-600 dark:text-blue-400"
                            bgColor="bg-blue-500/10"
                        />
                    </div>
                    <div className="col-span-1 h-full">
                        <StatCard
                            title="Total Collected"
                            value={formatCurrency(totalCollected)}
                            subtext={scheme.scheme_type === 'FIXED_DURATION' ? `${scheme.duration_months} months term` : `${scheme.interest_rate}% Interest`}
                            icon={Coins}
                            iconColor="text-emerald-600 dark:text-emerald-400"
                            bgColor="bg-emerald-500/10"
                        />
                    </div>
                    <div className="col-span-1 xs:col-span-2 md:col-span-1 h-full">
                        <StatCard
                            title="Est. Maturity"
                            value={`~${formatCurrency(
                                scheme.benefit_type === 'BONUS_MONTH'
                                    ? totalCollected + ((totalCollected / (scheme.duration_months || 1)) * (scheme.bonus_months || 1))
                                    : calculateMaturityValue(scheme, totalCollected)
                            )}`}
                            subtext="Projected total payout"
                            icon={TrendingUp}
                            iconColor="text-pink-600 dark:text-pink-400"
                            bgColor="bg-pink-500/10"
                        />
                    </div>
                </div>

                {/* Enrolled Customers Table/List */}
                <Card className="border-border/60 shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-semibold">Enrolled Customers</CardTitle>
                                <CardDescription className="mt-1">Manage payments and track progress</CardDescription>
                            </div>
                            <Badge variant="outline" className="bg-background">
                                {enrollments.length} members
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {enrollments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                                <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                                    <UserPlus className="h-10 w-10 text-muted-foreground/40" />
                                </div>
                                <h3 className="font-semibold text-lg mb-2">No Enrollments Yet</h3>
                                <p className="text-muted-foreground max-w-sm">
                                    Use the customer profile page to enroll customers into this scheme.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Mobile List - Transaction Style */}
                                <div className="md:hidden divide-y divide-border/50">
                                    {paginatedEnrollments.map((enrollment, idx) => (
                                        <div
                                            key={enrollment.id}
                                            className="p-4 hover:bg-muted/30 active:bg-muted/50 transition-colors cursor-pointer"
                                            onClick={(e) => {
                                                // Prevent navigation if clicking the Pay button
                                                if ((e.target as HTMLElement).closest('button')) return;
                                                router.push(`/shop/${shopId}/customers/view?name=${encodeURIComponent(enrollment.customer?.name || '')}`);
                                            }}
                                        >
                                            <div className="flex items-start gap-4">
                                                {/* Avatar */}
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary font-bold text-sm shrink-0 border border-primary/10">
                                                    {enrollment.customer?.name?.charAt(0) || 'C'}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <div>
                                                            <h4 className="font-semibold text-sm text-foreground truncate flex items-center gap-1">
                                                                {enrollment.customer?.name}
                                                                <ArrowRight className="w-3 h-3 text-muted-foreground opacity-50" />
                                                            </h4>
                                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mt-0.5">
                                                                {enrollment.customer?.phone && (
                                                                    <>
                                                                        <span>{enrollment.customer.phone}</span>
                                                                        <span className="text-border/50 hidden xxs:inline">•</span>
                                                                    </>
                                                                )}
                                                                <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded border border-border/50 text-[10px] tracking-wide">
                                                                    #{enrollment.account_number}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {enrollment.status === 'ACTIVE' ? (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleOpenPayment(enrollment);
                                                                        }}
                                                                        className="h-8 px-3 text-xs font-medium bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                                                                    >
                                                                        Pay EMI
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleOpenRedemption(enrollment);
                                                                        }}
                                                                        className="h-8 px-3 text-xs font-medium text-emerald-600 hover:bg-emerald-50"
                                                                    >
                                                                        Redeem
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <Badge variant="secondary" className={cn(
                                                                    "h-8 px-3 text-xs font-medium",
                                                                    enrollment.status === 'MATURED' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" : "bg-slate-100 text-slate-600"
                                                                )}>
                                                                    {enrollment.status}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Stats Row */}
                                                    <div className="grid grid-cols-2 gap-2 mt-3 p-2 bg-muted/30 rounded-lg border border-border/50">
                                                        <div>
                                                            <span className="text-[10px] uppercase text-muted-foreground font-semibold">Paid</span>
                                                            <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                                                                {formatCurrency(enrollment.total_paid)}
                                                            </div>
                                                        </div>
                                                        <div className="border-l pl-3 border-border/50">
                                                            <span className="text-[10px] uppercase text-muted-foreground font-semibold">Gold</span>
                                                            <div className="font-bold text-sm text-amber-600 dark:text-amber-400">
                                                                {enrollment.total_gold_weight_accumulated > 0
                                                                    ? `${enrollment.total_gold_weight_accumulated.toFixed(3)}g`
                                                                    : '0.000g'
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop Table (Keep existing) */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="text-xs uppercase bg-muted/40 text-muted-foreground border-b border-border/50">
                                            <tr>
                                                <th className="px-6 py-4 font-semibold text-left">Customer</th>
                                                <th className="px-6 py-4 font-semibold text-left">Account</th>
                                                <th className="px-6 py-4 font-semibold text-right">Paid</th>
                                                <th className="px-6 py-4 font-semibold text-right">Gold</th>
                                                <th className="px-6 py-4 font-semibold text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {paginatedEnrollments.map((enrollment) => (
                                                <tr
                                                    key={enrollment.id}
                                                    className="hover:bg-muted/20 transition-colors cursor-pointer group"
                                                    onClick={() => router.push(`/shop/${shopId}/customers/view?name=${encodeURIComponent(enrollment.customer?.name || '')}`)}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                                {enrollment.customer?.name?.charAt(0) || 'C'}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold group-hover:text-primary transition-colors flex items-center gap-2">
                                                                    {enrollment.customer?.name}
                                                                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">{enrollment.customer?.phone || 'No phone'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-mono text-xs bg-muted/50 inline-block px-2 py-1 rounded">{enrollment.account_number}</div>
                                                        <div className="text-xs text-muted-foreground mt-1">Since {new Date(enrollment.start_date).toLocaleDateString()}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(enrollment.total_paid)}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {enrollment.total_gold_weight_accumulated > 0 ? (
                                                            <span className="font-medium text-amber-600 dark:text-amber-400">
                                                                {enrollment.total_gold_weight_accumulated.toFixed(3)}g
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {enrollment.status === 'ACTIVE' ? (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleOpenPayment(enrollment);
                                                                        }}
                                                                        className="hover:border-primary hover:text-primary hover:bg-primary/5"
                                                                    >
                                                                        Record Payment
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleOpenRedemption(enrollment);
                                                                        }}
                                                                        className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                                                    >
                                                                        Redeem
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <Badge variant="secondary" className={cn(
                                                                    "px-3 py-1",
                                                                    enrollment.status === 'MATURED' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" : "bg-slate-100 text-slate-600"
                                                                )}>
                                                                    {enrollment.status}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </CardContent>

                    {/* Pagination Footer */}
                    {enrollments.length > 0 && totalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t border-border/50 bg-muted/20">
                            <div className="text-xs text-muted-foreground">
                                Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, enrollments.length)} of {enrollments.length}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePrevPage}
                                    disabled={currentPage === 1}
                                    className="h-8 w-8 p-0"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-xs font-medium min-w-[3rem] text-center">
                                    Page {currentPage}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                    className="h-8 w-8 p-0"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>

                <PaymentEntryModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    enrollment={selectedEnrollment}
                    onSuccess={handlePaymentSuccess}
                />

                <RedemptionModal
                    isOpen={isRedemptionModalOpen}
                    onClose={() => setIsRedemptionModalOpen(false)}
                    enrollment={selectedEnrollment}
                    onSuccess={handlePaymentSuccess}
                />
            </div>
        </div>
    );
}
