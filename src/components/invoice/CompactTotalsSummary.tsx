'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface CompactTotalsSummaryProps {
    subtotal: number;
    discount: number;
    loyaltyDiscount: number;
    sgstAmount: number;
    cgstAmount: number;
    grandTotal: number;
    sgstRate: number;
    cgstRate: number;
    onDiscountChange?: (value: number) => void;
}

export function CompactTotalsSummary({
    subtotal,
    discount,
    loyaltyDiscount,
    sgstAmount,
    cgstAmount,
    grandTotal,
    sgstRate,
    cgstRate,
    onDiscountChange,
}: CompactTotalsSummaryProps) {
    return (
        <Card className="border-2 shadow-lg">
            <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Summary</h3>
                    <Badge variant="outline" className="text-xs">
                        Live
                    </Badge>
                </div>

                <div className="space-y-2.5 text-sm">
                    {/* Subtotal */}
                    <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span className="font-mono">{formatCurrency(subtotal)}</span>
                    </div>

                    {/* Discount */}
                    {onDiscountChange ? (
                        <div className="flex justify-between items-center gap-2">
                            <span className="text-sm text-muted-foreground">Manual Discount</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={discount || ''}
                                onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
                                className="w-24 h-8 px-2 text-sm text-right rounded-md border border-input bg-background font-mono"
                                placeholder="0.00"
                            />
                        </div>
                    ) : discount > 0 ? (
                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                            <span>Discount</span>
                            <span className="font-mono">-{formatCurrency(discount)}</span>
                        </div>
                    ) : null}

                    {/* Loyalty Discount */}
                    {loyaltyDiscount > 0 && (
                        <div className="flex justify-between text-purple-600 dark:text-purple-400">
                            <span>Loyalty Discount</span>
                            <span className="font-mono">-{formatCurrency(loyaltyDiscount)}</span>
                        </div>
                    )}

                    {/* Taxes */}
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>SGST ({sgstRate}%)</span>
                        <span className="font-mono">{formatCurrency(sgstAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>CGST ({cgstRate}%)</span>
                        <span className="font-mono">{formatCurrency(cgstAmount)}</span>
                    </div>
                </div>

                <Separator />

                {/* Grand Total */}
                <div className="flex justify-between items-baseline">
                    <span className="font-bold text-base">Grand Total</span>
                    <span className="text-2xl font-bold font-mono bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                        {formatCurrency(grandTotal)}
                    </span>
                </div>

                {/* Animation for total change */}
                <style jsx>{`
          @keyframes pulse-gentle {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }
          .font-mono {
            animation: pulse-gentle 0.3s ease-in-out;
          }
        `}</style>
            </CardContent>
        </Card>
    );
}
