'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

interface LoanSummaryProps {
    principal: number;
    interestRate: number; // Yearly %
    interestPerMonth: number;
    totalCollateralValue: number;
    totalItems: number;
    startDate: Date;
    isSubmitting: boolean;
    onSave: () => void;
    onCancel: () => void;
}

export function LoanSummary({
    principal,
    interestRate,
    interestPerMonth,
    totalCollateralValue,
    totalItems,
    startDate,
    isSubmitting,
    onSave,
    onCancel
}: LoanSummaryProps) {
    return (
        <Card className="border-2 shadow-lg sticky top-6">
            <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Loan Summary</h3>
                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                        New Loan
                    </Badge>
                </div>

                <div className="space-y-4 text-sm">
                    {/* Principal */}
                    <div className="flex justify-between items-baseline">
                        <span className="text-muted-foreground">Principal Amount</span>
                        <span className="font-bold text-lg font-mono tracking-tight">
                            {formatCurrency(principal)}
                        </span>
                    </div>

                    <Separator />

                    {/* Interest Details */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Interest Rate</span>
                            <span>{interestRate}% p.a.</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Monthly Interest</span>
                            <span className="font-medium text-foreground">{formatCurrency(interestPerMonth)}</span>
                        </div>
                    </div>

                    <Separator />

                    {/* Collateral Details */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Collateral Items</span>
                            <span>{totalItems} items</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Total Valuation</span>
                            <span className="font-medium text-foreground">{formatCurrency(totalCollateralValue)}</span>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 text-xs text-muted-foreground border">
                        <div className="flex justify-between mb-1">
                            <span>Start Date:</span>
                            <span className="font-medium">{format(startDate, 'dd MMM yyyy')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>LTV Ratio:</span>
                            <span className={totalCollateralValue > 0 && principal > totalCollateralValue ? "text-amber-600 font-bold" : "font-medium"}>
                                {totalCollateralValue > 0 ? Math.round((principal / totalCollateralValue) * 100) : 0}%
                            </span>
                        </div>
                    </div>
                </div>

                <div className="pt-2 space-y-3">
                    <Button
                        onClick={onSave}
                        disabled={isSubmitting}
                        className="w-full h-12 shadow-md text-base font-semibold"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                        Create Loan
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="w-full"
                    >
                        Cancel
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
