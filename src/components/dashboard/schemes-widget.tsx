
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, PiggyBank, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';


// We'll fetch this client-side or pass data from server. For simplicity in this widget, let's accept props.
// But to match the pattern of other widgets (which accept shopId and fetch, or take props), let's see.
// The others seem to take raw data props or do their own thing. 
// Ideally, the parent DashboardPage fetches data.

interface SchemesWidgetProps {
    totalSchemes: number;
    activeEnrollments: number;
    totalCollectedMonth: number;
    totalGoldAccumulated: number;
    shopId: string;
}

export function SchemesWidget({
    totalSchemes,
    activeEnrollments,
    totalCollectedMonth,
    totalGoldAccumulated,
    shopId
}: SchemesWidgetProps) {
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
            <CardContent className="flex-1 space-y-4">
                {totalSchemes === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                        <p className="text-sm">No schemes active.</p>
                        <Link href={`/shop/${shopId}/schemes/create`} className="mt-2 text-primary text-xs hover:underline">
                            Create one
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">Enrollments</span>
                                <p className="text-2xl font-bold">{activeEnrollments}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">Collected (Mo)</span>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCollectedMonth)}</p>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-border/50">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1.5">
                                    <Coins className="h-3.5 w-3.5 text-amber-500" />
                                    Gold Booked
                                </span>
                                <span className="font-semibold text-amber-600">{totalGoldAccumulated.toFixed(3)}g</span>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
