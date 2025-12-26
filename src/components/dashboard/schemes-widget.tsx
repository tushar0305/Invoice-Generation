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
        <Card className="glass-card flex flex-col h-full bg-gradient-to-br from-card/50 to-amber-500/5 border-amber-500/10">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <PiggyBank className="h-4 w-4 text-amber-600" />
                        Gold Schemes
                    </CardTitle>
                    <Link href={`/shop/${shopId}/schemes`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-amber-600">
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center justify-center p-2 bg-primary/5 rounded-lg">
                        <Users className="h-4 w-4 text-primary mb-1" />
                        <span className="text-xl font-bold">{stats.activeEnrollments}</span>
                        <span className="text-[10px] text-muted-foreground text-center leading-tight">Active Members</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <Coins className="h-4 w-4 text-amber-600 mb-1" />
                        <span className="text-xl font-bold text-amber-700 dark:text-amber-500">
                            {stats.totalGoldLiability.toFixed(2)}g
                        </span>
                        <span className="text-[10px] text-muted-foreground text-center leading-tight">Gold Liability</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <CalendarClock className="h-4 w-4 text-blue-600 mb-1" />
                        <span className="text-xl font-bold text-blue-700 dark:text-blue-500">
                            {stats.upcomingMaturities}
                        </span>
                        <span className="text-[10px] text-muted-foreground text-center leading-tight">Maturities (30d)</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
