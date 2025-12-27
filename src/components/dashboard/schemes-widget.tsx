import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, PiggyBank, ArrowRight, Users, CalendarClock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

interface SchemesWidgetProps {
    stats: {
        activeEnrollments: number;
        totalGoldLiability: number;
        upcomingMaturities: number;
        totalSchemes?: number;
    };
    shopId: string;
}

export function SchemesWidget({ stats, shopId }: SchemesWidgetProps) {
    return (
        <Card className="h-full border border-amber-200/60 dark:border-amber-900/40 bg-gradient-to-br from-white to-amber-50/50 dark:from-zinc-950 dark:to-amber-950/10 shadow-sm hover:shadow-md transition-all duration-300 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

            <CardHeader className="pb-3 border-b border-amber-100/50 dark:border-amber-900/20">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-950 dark:text-amber-100 uppercase tracking-wide">
                        <div className="p-1 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                            <PiggyBank className="h-3.5 w-3.5" />
                        </div>
                        Gold Schemes
                    </CardTitle>
                    <Link href={`/shop/${shopId}/schemes`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 -mr-2 text-muted-foreground hover:text-amber-700 hover:bg-amber-50 dark:hover:text-amber-400 dark:hover:bg-amber-900/30">
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="pt-4 h-[calc(100%-60px)] flex flex-col justify-between">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Active Members</p>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.activeEnrollments}</span>
                        </div>
                    </div>

                    <div className="space-y-1 text-right">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Liability</p>
                        <div className="flex items-center justify-end gap-1.5 text-amber-600 dark:text-amber-500">
                            <Coins className="h-4 w-4" />
                            <span className="text-xl font-bold">{stats.totalGoldLiability.toFixed(2)}g</span>
                        </div>
                    </div>
                </div>

                <div className="mt-4 p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/60 dark:border-amber-900/30 rounded-lg flex items-center justify-between group-hover:bg-amber-100/50 dark:group-hover:bg-amber-900/30 transition-colors">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-white dark:bg-zinc-900 rounded-md shadow-sm text-amber-600 dark:text-amber-500">
                            <CalendarClock className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-amber-950 dark:text-amber-100">Upcoming Maturities</span>
                            <span className="text-[10px] text-muted-foreground">Next 30 Days</span>
                        </div>
                    </div>
                    <span className="text-lg font-bold text-amber-700 dark:text-amber-400">{stats.upcomingMaturities}</span>
                </div>
            </CardContent>
        </Card>
    );
}
