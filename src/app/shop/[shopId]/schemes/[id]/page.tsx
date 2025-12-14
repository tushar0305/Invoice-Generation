'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveShop } from '@/hooks/use-active-shop';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, UserPlus, Coins, TrendingUp, Calendar, Phone, Wallet, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import type { Scheme, SchemeEnrollment } from '@/lib/scheme-types';
import { PaymentEntryModal } from '@/components/schemes/payment-entry-modal';
import { calculateMaturityValue } from '@/lib/utils/scheme-calculations';
import { formatCurrency, cn } from '@/lib/utils';
import { StatCard } from '@/components/schemes/stat-card';

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
    const [selectedEnrollment, setSelectedEnrollment] = useState<SchemeEnrollment | undefined>(undefined);

    useEffect(() => {
        if (!shopId || !schemeId) return;

        const fetchData = async () => {
            setIsLoading(true);
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
        };

        fetchData();
    }, [shopId, schemeId, toast]);

    const handleOpenPayment = (enrollment: SchemeEnrollment) => {
        const enrollmentWithScheme = { ...enrollment, scheme: scheme! };
        setSelectedEnrollment(enrollmentWithScheme);
        setIsPaymentModalOpen(true);
    };

    const handlePaymentSuccess = () => {
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
        <div className="space-y-6 pb-24 md:pb-8 max-w-7xl mx-auto p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="shrink-0 h-10 w-10 rounded-xl bg-background/50 border border-border/50 hover:bg-background mt-1 shadow-sm md:hidden"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{scheme.name}</h1>
                            <Badge
                                variant={scheme.is_active ? 'default' : 'secondary'}
                                className={cn(
                                    "text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 border",
                                    scheme.is_active
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                        : 'bg-muted text-muted-foreground border-border/50'
                                )}
                            >
                                <span className={cn(
                                    "w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse",
                                    scheme.is_active ? "bg-emerald-500" : "bg-muted-foreground"
                                )} />
                                {scheme.is_active ? 'Active' : 'Paused'}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-primary/70" />
                                <span className="font-medium text-foreground/80">{scheme.duration_months} Months</span>
                            </div>
                            <span className="text-border">|</span>
                            <div className="flex items-center gap-1.5">
                                <Wallet className="w-4 h-4 text-primary/70" />
                                <span className="font-medium text-foreground/80">
                                    {scheme.scheme_type === 'FIXED_DURATION' ? formatCurrency(scheme.installment_amount || 0) + '/mo' : 'Flexible Amount'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Desktop Action (Optional) */}
                {/* <Button>Edit Scheme</Button> */}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                    title="Total Enrollments"
                    value={enrollments.length}
                    subtext="Active members"
                    icon={UserPlus}
                    iconColor="text-blue-600 dark:text-blue-400"
                    bgColor="bg-blue-500/10"
                />
                <StatCard
                    title="Total Collected"
                    value={formatCurrency(totalCollected)}
                    subtext={scheme.scheme_type === 'FIXED_DURATION' ? `${scheme.duration_months} months term` : `${scheme.interest_rate}% Interest`}
                    icon={Coins}
                    iconColor="text-emerald-600 dark:text-emerald-400"
                    bgColor="bg-emerald-500/10"
                />
                <StatCard
                    title="Est. Maturity"
                    value={`~${formatCurrency(calculateMaturityValue(scheme, totalCollected))}`}
                    subtext="Projected total payout"
                    icon={TrendingUp}
                    iconColor="text-pink-600 dark:text-pink-400"
                    bgColor="bg-pink-500/10"
                />
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
                                {enrollments.map((enrollment, idx) => (
                                    <div
                                        key={enrollment.id}
                                        className="p-4 hover:bg-muted/30 active:bg-muted/50 transition-colors"
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
                                                        <h4 className="font-semibold text-sm text-foreground truncate">{enrollment.customer?.name}</h4>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <span>{enrollment.customer?.phone}</span>
                                                            <span className="text-border">•</span>
                                                            <span className="font-mono bg-muted px-1 rounded">{enrollment.account_number}</span>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleOpenPayment(enrollment)}
                                                        className="h-8 px-3 text-xs font-medium bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground -mr-2"
                                                    >
                                                        Pay EMI
                                                    </Button>
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
                                        {enrollments.map((enrollment) => (
                                            <tr key={enrollment.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                            {enrollment.customer?.name?.charAt(0) || 'C'}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold">{enrollment.customer?.name}</div>
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
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleOpenPayment(enrollment)}
                                                        className="hover:border-primary hover:text-primary hover:bg-primary/5"
                                                    >
                                                        Record Payment
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <PaymentEntryModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                enrollment={selectedEnrollment}
                onSuccess={handlePaymentSuccess}
            />
        </div>
    );
}
