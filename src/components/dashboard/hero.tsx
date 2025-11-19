'use client';

import { MotionWrapper, FadeIn } from '@/components/ui/motion-wrapper';
import { Button } from '@/components/ui/button';
import { PlusCircle, Settings } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/supabase/provider';

export function DashboardHero() {
    const { user } = useUser();
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <MotionWrapper className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-primary/80 p-8 text-primary-foreground shadow-2xl">
            <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10"></div>
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold-500/20 blur-3xl"></div>

            <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div className="space-y-2">
                    <FadeIn>
                        <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
                            {greeting}, <span className="text-gold-400">{user?.email?.split('@')[0] || 'Jeweller'}</span>
                        </h1>
                        <p className="text-primary-foreground/80">
                            Here's what's happening in your store today.
                        </p>
                    </FadeIn>
                </div>

                <div className="flex flex-row gap-3 w-full md:w-auto">
                    <Link href="/dashboard/invoices/new">
                        <Button variant="premium" size="lg" className="shadow-lg shadow-black/20">
                            <PlusCircle className="mr-2 h-5 w-5" />
                            New Invoice
                        </Button>
                    </Link>
                    <Link href="/dashboard/settings">
                        <Button variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm">
                            <Settings className="mr-2 h-5 w-5" />
                            Settings
                        </Button>
                    </Link>
                </div>
            </div>
        </MotionWrapper>
    );
}
