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
        <Card className="h-full border-none shadow-md bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-slate-950 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
            
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                    <Share2 className="w-5 h-5" />
                    Referrals
                </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-3xl font-bold text-foreground">{stats.totalReferrals}</p>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Referrals</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Users className="w-5 h-5" />
                    </div>
                </div>

                {stats.topReferrer ? (
                    <div className="p-3 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-indigo-100 dark:border-indigo-900/30 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                                <Trophy className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Top Referrer</p>
                                <p className="font-semibold text-sm truncate max-w-[120px]">{stats.topReferrer.name}</p>
                            </div>
                            <div className="ml-auto text-right">
                                <p className="font-bold text-indigo-600 dark:text-indigo-400">{stats.topReferrer.count}</p>
                                <p className="text-[10px] text-muted-foreground">Invites</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-3 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-800 text-center">
                        <p className="text-xs text-muted-foreground">No referrals yet. Start inviting!</p>
                    </div>
                )}

                <Button 
                    variant="ghost" 
                    className="w-full text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 h-8 group-hover:translate-x-1 transition-transform"
                    onClick={() => router.push(`/shop/${shopId}/marketing/referrals`)}
                >
                    View Dashboard <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
            </CardContent>
        </Card>
    );
}
