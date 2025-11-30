'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface InvoiceSummaryProps {
    subtotal: number;
    discount: number;
    loyaltyDiscount?: number;
    sgst: number;
    cgst: number;
    grandTotal: number;
    sgstAmount: number;
    cgstAmount: number;
    onDiscountChange?: (value: number) => void;
    editable?: boolean;
}

export function InvoiceSummary({
    subtotal,
    discount,
    loyaltyDiscount = 0,
    sgst,
    cgst,
    grandTotal,
    sgstAmount,
    cgstAmount,
    onDiscountChange,
    editable = true,
}: InvoiceSummaryProps) {
    return (
        <Card className="glass-card border-gold-500/10">
            <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    {editable && onDiscountChange ? (
                        <input
                            type="number"
                            value={discount}
                            onChange={(e) => onDiscountChange(Number(e.target.value) || 0)}
                            className="w-24 text-right px-2 py-1 border rounded-md text-sm"
                            placeholder="0"
                        />
                    ) : (
                        <span className="font-medium text-red-500">-{formatCurrency(discount)}</span>
                    )}
                </div>

                {loyaltyDiscount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-purple-600 dark:text-purple-400 font-medium">Loyalty Redemption</span>
                        <span className="font-medium text-purple-600 dark:text-purple-400">-{formatCurrency(loyaltyDiscount)}</span>
                    </div>
                )}

                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">SGST ({sgst}%)</span>
                    <span className="font-medium">{formatCurrency(sgstAmount)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">CGST ({cgst}%)</span>
                    <span className="font-medium">{formatCurrency(cgstAmount)}</span>
                </div>

                <div className="pt-4 border-t border-gold-500/10">
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold">Grand Total</span>
                        <span className="text-2xl font-bold text-gold-600 dark:text-gold-400">
                            {formatCurrency(grandTotal)}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
