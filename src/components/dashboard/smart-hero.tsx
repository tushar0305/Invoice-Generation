'use client';

import { MotionWrapper, FadeIn } from '@/components/ui/motion-wrapper';
import { Button } from '@/components/ui/button';
import { PlusCircle, Settings, AlertTriangle, TrendingDown, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/supabase/provider';
import { useEffect, useState } from 'react';
import { supabase } from '@/supabase/client';
import { Invoice } from '@/lib/definitions';
import { formatCurrency } from '@/lib/utils';

interface SmartHeroProps {
    invoices: Invoice[] | null;
    revenueMoM: number | null;
    totalRevenue: number;
}

export function SmartHero({ invoices, revenueMoM, totalRevenue }: SmartHeroProps) {
    const { user } = useUser();
    const [shopName, setShopName] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        const load = async () => {
            if (!user?.uid) { setShopName(null); return; }
            const { data } = await supabase
                .from('user_settings')
                .select('shop_name')
                .eq('user_id', user.uid)
                .maybeSingle();
            if (!active) return;
            setShopName(data?.shop_name || null);
        };
        load();
        return () => { active = false; };
    }, [user?.uid]);

    // Determine Business State
    const dueInvoices = invoices?.filter(inv => inv.status === 'due') || [];
    const overdueCount = dueInvoices.length;

    let state: 'critical' | 'warning' | 'good' = 'good';
    let message = "All invoices up-to-date. Create a new one?";
    let actionLabel = "New Invoice";
    let actionLink = "/dashboard/invoices/new";
    let Icon = CheckCircle2;
    let gradient = "from-emerald-600 to-emerald-900";
    let accentColor = "text-emerald-400";

    if (overdueCount >= 5) {
        state = 'critical';
        message = `${overdueCount} invoices overdue - Send reminders`;
        actionLabel = "View Overdue";
        actionLink = "/dashboard?section=due"; // We can implement scrolling to due section later
        Icon = AlertTriangle;
        gradient = "from-red-600 to-red-900";
        accentColor = "text-red-400";
    } else if (revenueMoM !== null && revenueMoM < 0) {
        state = 'warning';
        message = `Revenue ${Math.abs(revenueMoM).toFixed(0)}% below last month`;
        actionLabel = "Analyze Sales";
        actionLink = "/dashboard/invoices";
        Icon = TrendingDown;
        gradient = "from-amber-600 to-amber-900";
        accentColor = "text-amber-400";
    }

    return (
        <MotionWrapper className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-6 md:p-8 text-white shadow-2xl border border-white/10`}>
            <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10"></div>
            <div className={`absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl`}></div>

            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="space-y-4 flex-1">
                    <FadeIn>
                        <div className={`flex items-center gap-2 ${accentColor} text-sm font-medium uppercase tracking-wider`}>
                            <span className={`h-1.5 w-1.5 rounded-full bg-current animate-pulse`}></span>
                            {state === 'critical' ? 'Action Required' : state === 'warning' ? 'Insight Alert' : 'Status Update'}
                        </div>
                        <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-white">
                            {shopName ? shopName : `Welcome, ${user?.email?.split('@')[0] || 'Jeweller'}`}
                        </h1>

                        {/* Smart Insight Card */}
                        <div className="mt-6 inline-flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 max-w-md">
                            <div className={`p-2 rounded-full bg-white/10 ${accentColor}`}>
                                <Icon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="font-medium text-lg leading-tight">{message}</p>
                                {state === 'good' && (
                                    <p className="text-sm text-white/70 mt-1">Great job keeping up!</p>
                                )}
                            </div>
                            {state !== 'good' && (
                                <Button size="sm" variant="secondary" className="ml-auto whitespace-nowrap" asChild>
                                    <Link href={actionLink}>
                                        {actionLabel} <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </FadeIn>
                </div>

                <div className="flex flex-col gap-3 w-full sm:flex-row sm:w-auto flex-shrink-0">
                    <Link href="/dashboard/invoices/new" className="w-full sm:w-auto">
                        <Button className="bg-white text-black hover:bg-white/90 font-semibold shadow-lg w-full h-11">
                            <PlusCircle className="mr-2 h-5 w-5" />
                            New Invoice
                        </Button>
                    </Link>
                    <Link href="/dashboard/settings" className="w-full sm:w-auto">
                        <Button variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm w-full h-11">
                            <Settings className="mr-2 h-5 w-5" />
                            Settings
                        </Button>
                    </Link>
                </div>
            </div>
        </MotionWrapper>
    );
}
