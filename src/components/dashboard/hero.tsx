'use client';

import { MotionWrapper, FadeIn } from '@/components/ui/motion-wrapper';
import { Button } from '@/components/ui/button';
import { PlusCircle, Settings } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/supabase/provider';
import { useEffect, useState } from 'react';
import { supabase } from '@/supabase/client';

export function DashboardHero() {
    const { user } = useUser();
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
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

    return (
        <MotionWrapper className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-[#090E1A] p-6 md:p-8 text-primary-foreground shadow-2xl border border-white/10">
            <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-5"></div>
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#D4AF37]/20 blur-3xl"></div>

            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="space-y-4 flex-1">
                    <FadeIn>
                        <div className="flex items-center gap-2 text-[#D4AF37]/80 text-sm font-medium uppercase tracking-wider">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37] animate-pulse"></span>
                            {hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening'} Briefing
                        </div>
                        <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-white">
                            {shopName ? shopName : `${greeting}, ${user?.email?.split('@')[0] || 'Jeweller'}`}
                        </h1>
                        <p className="text-gray-400 max-w-md">
                            Here's your store's performance today.
                        </p>
                    </FadeIn>

                    {/* Gold Rate Widget (Mockup) */}
                    <div className="flex gap-4 mt-4">
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 min-w-[120px]">
                            <div className="text-xs text-gray-400 mb-1">Gold (22k)</div>
                            <div className="text-lg font-bold text-[#D4AF37]">₹ 6,850 <span className="text-xs text-green-400">▲</span></div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 min-w-[120px]">
                            <div className="text-xs text-gray-400 mb-1">Silver (1kg)</div>
                            <div className="text-lg font-bold text-gray-300">₹ 74,500 <span className="text-xs text-red-400">▼</span></div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 w-full sm:flex-row sm:w-auto flex-shrink-0">
                    <Link href="/dashboard/invoices/new" className="w-full sm:w-auto">
                        <Button className="bg-[#D4AF37] hover:bg-[#B5952F] text-[#0F172A] font-semibold shadow-lg shadow-[#D4AF37]/20 w-full h-11">
                            <PlusCircle className="mr-2 h-5 w-5" />
                            New Invoice
                        </Button>
                    </Link>
                    <Link href="/dashboard/settings" className="w-full sm:w-auto">
                        <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm w-full h-11">
                            <Settings className="mr-2 h-5 w-5" />
                            Settings
                        </Button>
                    </Link>
                </div>
            </div>
        </MotionWrapper>
    );
}
