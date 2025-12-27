'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Trophy, ArrowRight, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ReferralWidgetProps {
    shopId: string;
    stats: {
        totalReferrals: number;
        topReferrer: {
            name: string;
            count: number;
        } | null;
    };
}

export function ReferralWidget({ shopId, stats }: ReferralWidgetProps) {
    const router = useRouter();

    return (
        <Card className="glass-card flex flex-col h-full bg-gradient-to-br from-indigo-50/50 via-white to-indigo-100/50 dark:from-indigo-950/30 dark:via-black dark:to-indigo-900/20 border-indigo-200/50 dark:border-indigo-800/30 shadow-md hover:shadow-lg transition-all duration-300 group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-indigo-400/20 transition-all" />

            <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-indigo-950 dark:text-indigo-100">
                    <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                        <Share2 className="w-4 h-4" />
                    </div>
                    Referrals
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 flex-1 flex flex-col justify-between relative z-10">
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.totalReferrals}</p>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Total Referrals</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-white dark:bg-indigo-950 shadow-sm border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                        <Users className="w-5 h-5" />
                    </div>
                </div>

                {stats.topReferrer ? (
                    <div className="p-3 bg-white/60 dark:bg-zinc-900/60 rounded-xl border border-indigo-100 dark:border-indigo-900/30 backdrop-blur-sm group-hover:-translate-y-0.5 transition-transform duration-300">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400 shadow-sm">
                                <Trophy className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Top Referrer</p>
                                <p className="font-bold text-sm truncate text-slate-800 dark:text-slate-200">{stats.topReferrer.name}</p>
                            </div>
                            <div className="text-right pl-2 border-l border-indigo-100 dark:border-indigo-800">
                                <p className="font-bold text-indigo-600 dark:text-indigo-400">{stats.topReferrer.count}</p>
                                <p className="text-[10px] text-muted-foreground">Invites</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-3 bg-white/60 dark:bg-zinc-900/60 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-800 text-center">
                        <p className="text-xs text-muted-foreground">No referrals yet. Start inviting!</p>
                    </div>
                )}

                <Button
                    variant="ghost"
                    className="w-full text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 h-8 group-hover:translate-x-1 transition-transform border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30"
                    onClick={() => router.push(`/shop/${shopId}/marketing/referrals`)}
                >
                    View Dashboard <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
            </CardContent>
        </Card>
    );
}
