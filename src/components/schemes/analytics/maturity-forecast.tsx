'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/supabase/client';
import { addMonths, differenceInDays } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface MaturityForecastProps {
    shopId: string;
}

interface MaturingScheme {
    id: string;
    enrollmentId: string;
    customerName: string;
    schemeName: string;
    maturityDate: Date;
    expectedPayout: number;
    status: string;
}

export function MaturityForecast({ shopId }: MaturityForecastProps) {
    const [maturingList, setMaturingList] = useState<MaturingScheme[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchMaturities = async () => {
            try {
                // Fetch active enrollments with scheme details
                // Updated to select 'rules' instead of flattened columns
                const { data: enrollments, error } = await supabase
                    .from('scheme_enrollments')
                    .select(`
                        id,
                        created_at,
                        start_date,
                        status,
                        total_paid,
                        customer:customers(name),
                        scheme:schemes(id, name, duration_months, scheme_amount, rules)
                    `)
                    .eq('shop_id', shopId)
                    .eq('status', 'ACTIVE');

                if (error) throw error;

                const today = new Date();

                const upcoming = enrollments
                    .filter((enrollment: any) => enrollment.scheme) // Filter out enrollments with missing scheme data
                    .map((enrollment: any) => {
                        const startDate = new Date(enrollment.start_date || enrollment.created_at);
                        const duration = enrollment.scheme?.duration_months || 11;
                        const maturityDate = addMonths(startDate, duration);

                        // Estimate Payout
                        const principal = enrollment.total_paid || 0;
                        let estimatedBonus = 0;
                        const scheme = enrollment.scheme;
                        const rules = scheme.rules || {};

                        const benefitType = rules.benefit_type || 'BONUS_MONTH';
                        // Handle legacy or nested fields
                        const benefitValue = rules.benefit_value ?? rules.bonus_months ?? rules.interest_rate ?? 0;

                        if (benefitType === 'INTEREST') {
                            estimatedBonus = (principal * (benefitValue || 0)) / 100;
                        } else if (benefitType === 'BONUS_MONTH') {
                            // Bonus = Installment Amount * Bonus Months
                            estimatedBonus = (scheme.scheme_amount || 0) * (benefitValue || 1);
                        } else if (benefitType === 'FIXED_AMOUNT') {
                            estimatedBonus = Number(benefitValue) || 0;
                        }

                        return {
                            id: scheme.id, // Link to scheme page
                            enrollmentId: enrollment.id,
                            customerName: enrollment.customer?.name || 'Unknown',
                            schemeName: scheme.name || 'Scheme',
                            maturityDate,
                            expectedPayout: principal + estimatedBonus,
                            status: enrollment.status
                        };
                    })
                    .filter(item => {
                        // Filter for maturity within next 60 days (or overdue)
                        const daysUntil = differenceInDays(item.maturityDate, today);
                        return daysUntil <= 60;
                    })
                    .sort((a, b) => a.maturityDate.getTime() - b.maturityDate.getTime())
                    .slice(0, 5); // Top 5

                setMaturingList(upcoming);
            } catch (err: any) {
                console.error('Error fetching maturities:', err.message || err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMaturities();
    }, [shopId]);

    if (isLoading) {
        return (
            <Card className="h-full border-none shadow-sm bg-card/50">
                <CardContent className="flex items-center justify-center h-48">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full border-none shadow-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                            Maturity Forecast
                        </CardTitle>
                        <CardDescription>Upcoming payouts in next 30 days</CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {maturingList.length} Due
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                {maturingList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                        <Calendar className="w-10 h-10 mb-3 opacity-20" />
                        <p className="text-sm">No schemes maturing in next 60 days.</p>
                        <p className="text-xs opacity-70">Great for cash flow!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {maturingList.map((item) => {
                            const daysLeft = differenceInDays(item.maturityDate, new Date());
                            const isOverdue = daysLeft < 0;

                            return (
                                <div
                                    key={item.enrollmentId}
                                    className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                    onClick={() => router.push(`/shop/${shopId}/schemes/${item.id}`)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 font-bold text-xs">
                                            {item.customerName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm group-hover:text-emerald-600 transition-colors">{item.customerName}</p>
                                            <p className="text-xs text-muted-foreground">{item.schemeName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm">{formatCurrency(item.expectedPayout)}</p>
                                        <p className={`text-[10px] font-medium ${isOverdue ? 'text-red-500' : 'text-amber-500'}`}>
                                            {isOverdue ? `${Math.abs(daysLeft)} days overdue` : `Due in ${daysLeft} days`}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        <Button
                            variant="ghost"
                            className="w-full text-xs text-muted-foreground hover:text-foreground h-8"
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/shop/${shopId}/schemes/maturity`);
                            }}
                        >
                            View All Maturities <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
