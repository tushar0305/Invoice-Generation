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
        <div className="space-y-6 pb-24 md:pb-8">
            {/* Header */}
            <div className="flex items-start gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="shrink-0 h-10 w-10 rounded-full hover:bg-muted mt-1"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h1 className="text-xl sm:text-2xl font-bold truncate">{scheme.name}</h1>
                        <Badge
                            variant={scheme.is_active ? 'default' : 'secondary'}
                            className={cn(
                                "text-xs font-medium px-2 py-0.5 rounded-full shrink-0",
                                scheme.is_active
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                    : 'bg-muted text-muted-foreground'
                            )}
                        >
                            <span className={cn(
                                "w-1.5 h-1.5 rounded-full mr-1.5",
                                scheme.is_active ? "bg-emerald-500" : "bg-muted-foreground"
                            )} />
                            {scheme.is_active ? 'Active' : 'Paused'}
                        </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
                            <Calendar className="w-3.5 h-3.5 text-primary" />
                            {scheme.duration_months} Months
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
                            <Wallet className="w-3.5 h-3.5 text-primary" />
                            {scheme.type === 'FIXED_AMOUNT' ? formatCurrency(scheme.scheme_amount || 0) + '/mo' : 'Flexible'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="glass-card border-border/50 overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            Enrollments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{enrollments.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Active members</p>
                    </CardContent>
                </Card>

                <Card className="glass-card border-border/50 overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <Coins className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            Collected
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalCollected)}</div>
                        {scheme.rules.gold_conversion === 'MONTHLY' && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">{totalGold.toFixed(3)}g booked</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="glass-card border-border/50 overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 text-primary" />
                            </div>
                            Est. Maturity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">~{formatCurrency(calculateMaturityValue(scheme, totalCollected))}</div>
                        <p className="text-xs text-muted-foreground mt-1">Projected payout</p>
                    </CardContent>
                </Card>
            </div>

            {/* Enrolled Customers */}
            <Card className="glass-card border-border/50 overflow-hidden">
                <CardHeader className="border-b border-border/50 bg-muted/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Enrolled Customers</CardTitle>
                            <CardDescription>Manage payments and track progress</CardDescription>
                        </div>
                        <Badge variant="secondary" className="bg-background/50">
                            {enrollments.length} members
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {enrollments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                <UserPlus className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="font-semibold mb-1">No Enrollments Yet</h3>
                            <p className="text-sm text-muted-foreground max-w-xs">
                                Customers can be enrolled in this scheme from their profile page.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile List */}
                            <div className="md:hidden divide-y divide-border/50">
                                {enrollments.map((enrollment, idx) => (
                                    <div
                                        key={enrollment.id}
                                        className="p-4 hover:bg-muted/30 transition-colors animate-in fade-in slide-in-from-bottom-2"
                                        style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'backwards' }}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Avatar */}
                                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-amber-500/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                                                {enrollment.customer?.name?.charAt(0) || 'C'}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <div className="font-semibold text-foreground truncate">{enrollment.customer?.name}</div>
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                                            <Phone className="w-3 h-3" />
                                                            {enrollment.customer?.phone || 'No phone'}
                                                        </div>
                                                    </div>
                                                    <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0.5 bg-muted shrink-0">
                                                        {enrollment.account_number}
                                                    </Badge>
                                                </div>

                                                {/* Stats Row */}
                                                <div className="flex items-center gap-4 mt-3 text-sm">
                                                    <div>
                                                        <span className="text-muted-foreground text-xs">Paid</span>
                                                        <div className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(enrollment.total_paid)}</div>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground text-xs">Gold</span>
                                                        <div className="font-bold text-amber-600 dark:text-amber-400">
                                                            {enrollment.total_gold_weight_accumulated > 0
                                                                ? `${enrollment.total_gold_weight_accumulated.toFixed(3)}g`
                                                                : '-'
                                                            }
                                                        </div>
                                                    </div>
                                                    <div className="flex-1" />
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleOpenPayment(enrollment)}
                                                        className="h-9 px-4 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20"
                                                        variant="ghost"
                                                    >
                                                        Pay EMI
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border/50">
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
