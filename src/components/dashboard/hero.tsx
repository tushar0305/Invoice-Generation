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
        <MotionWrapper className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-primary/80 p-8 text-primary-foreground shadow-2xl">
            <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10"></div>
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold-500/20 blur-3xl"></div>

            <div className="relative z-10 flex flex-col items-start justify-between gap-4 md:gap-6 md:flex-row md:items-center">
                <div className="space-y-2 flex-1">
                    <FadeIn>
                        <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
                            {shopName ? shopName : `${greeting}, ${user?.email?.split('@')[0] || 'Jeweller'}`}
                        </h1>
                        <p className="text-primary-foreground/80 text-sm md:text-base">
                            Here's what's happening in your store today.
                        </p>
                    </FadeIn>
                </div>

                <div className="flex flex-col gap-2 w-full sm:flex-row sm:w-auto sm:gap-3 flex-shrink-0">
                    <Link href="/dashboard/invoices/new" className="w-full sm:w-auto">
                        <Button variant="premium" size="sm" className="shadow-lg shadow-black/20 w-full h-9">
                            <PlusCircle className="mr-1.5 h-4 w-4" />
                            <span className="hidden sm:inline">New Invoice</span>
                            <span className="sm:hidden">New Invoice</span>
                        </Button>
                    </Link>
                    <Link href="/dashboard/settings" className="w-full sm:w-auto">
                        <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm w-full h-9">
                            <Settings className="mr-1.5 h-4 w-4" />
                            <span className="hidden sm:inline">Settings</span>
                            <span className="sm:hidden">Settings</span>
                        </Button>
                    </Link>
                </div>
            </div>
        </MotionWrapper>
    );
}
