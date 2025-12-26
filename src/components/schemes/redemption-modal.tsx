'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertTriangle, Coins, Scale } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { calculateRedemptionValue, RedemptionCalculation } from '@/lib/utils/scheme-calculations';
import type { Scheme, SchemeEnrollment } from '@/lib/scheme-types';
import { supabase } from '@/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

interface RedemptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    enrollment: SchemeEnrollment | null;
    onSuccess?: () => void;
}

export function RedemptionModal({ isOpen, onClose, enrollment, onSuccess }: RedemptionModalProps) {
    const isMobile = useIsMobile();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentGoldRate, setCurrentGoldRate] = useState<string>('');
    const [calculation, setCalculation] = useState<RedemptionCalculation | null>(null);

    const scheme = enrollment?.scheme;

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentGoldRate('');
            setCalculation(null);
        }
    }, [isOpen]);

    // Recalculate when inputs change
    useEffect(() => {
        if (!enrollment || !scheme) return;

        const rate = parseFloat(currentGoldRate) || 0;
        const result = calculateRedemptionValue(scheme, enrollment, rate, true); // Assuming matured for now
        setCalculation(result);
    }, [enrollment, scheme, currentGoldRate]);

    const handleRedeem = async () => {
        if (!enrollment || !scheme || !calculation) return;

        setIsSubmitting(true);
        try {
            // 1. Update Enrollment Status
            const { error: updateError } = await supabase
                .from('scheme_enrollments')
                .update({ 
                    status: 'MATURED',
                    // Store final values if needed, or just rely on transactions
                })
                .eq('id', enrollment.id);

            if (updateError) throw updateError;

            // 2. Create Redemption Transaction (Payout)
            const { error: txError } = await supabase
                .from('scheme_transactions')
                .insert({
                    enrollment_id: enrollment.id,
                    shop_id: enrollment.shop_id,
                    transaction_type: 'BONUS', // Or a new type 'REDEMPTION'
                    amount: calculation.totalPayoutAmount,
                    gold_weight: calculation.totalPayoutWeight,
                    gold_rate: parseFloat(currentGoldRate) || 0,
                    payment_date: new Date().toISOString(),
                    status: 'PAID',
                    description: `Scheme Redemption/Closure. Benefit: ${calculation.benefitDescription}`
                });

            if (txError) throw txError;

            toast.success('Scheme redeemed successfully!');
            onSuccess?.();
            onClose();
        } catch (error: any) {
            console.error('Redemption error:', error);
            toast.error(error.message || 'Failed to redeem scheme');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!enrollment || !scheme) return null;

    const isGoldSIP = scheme.calculation_type === 'WEIGHT_ACCUMULATION';

    const Content = (
        <div className="space-y-6 py-4">
            {/* Warning / Info */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex gap-3 items-start">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-medium">Closing Scheme Account</p>
                    <p className="opacity-90">This action will mark the scheme as matured and calculate the final payout. It cannot be undone.</p>
                </div>
            </div>

            {/* Gold Rate Input (Only for Weight Schemes) */}
            {isGoldSIP && (
                <div className="space-y-2">
                    <Label htmlFor="gold-rate">Current Gold Rate (per gram)</Label>
                    <div className="relative">
                        <Coins className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="gold-rate"
                            type="number"
                            placeholder="e.g. 6500"
                            className="pl-9"
                            value={currentGoldRate}
                            onChange={(e) => setCurrentGoldRate(e.target.value)}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">Required to calculate the value of accumulated gold.</p>
                </div>
            )}

            {/* Calculation Summary */}
            {calculation && (
                <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Scale className="w-4 h-4" />
                        Payout Summary
                    </h4>
                    
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Principal (Cash Paid)</span>
                            <span>{formatCurrency(calculation.principalAmount)}</span>
                        </div>
                        {isGoldSIP && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Accumulated Gold</span>
                                <span className="font-medium text-amber-600">{calculation.principalWeight?.toFixed(3)}g</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Bonus / Benefit</span>
                            <span className="text-emerald-600">+{formatCurrency(calculation.benefitAmount)}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total Payout</span>
                            <span>{formatCurrency(calculation.totalPayoutAmount)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 italic">
                            {calculation.benefitDescription}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );

    const Footer = (
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
            </Button>
            <Button 
                onClick={handleRedeem} 
                disabled={isSubmitting || (isGoldSIP && !currentGoldRate)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Redemption
            </Button>
        </div>
    );

    if (isMobile) {
        return (
            <Sheet open={isOpen} onOpenChange={onClose}>
                <SheetContent side="bottom" className="rounded-t-[20px] px-4 pb-8 pt-6 max-h-[90vh] overflow-y-auto">
                    <SheetHeader className="text-left">
                        <SheetTitle>Redeem Scheme</SheetTitle>
                        <SheetDescription>
                            Calculate final payout and close enrollment #{enrollment.account_number}
                        </SheetDescription>
                    </SheetHeader>
                    {Content}
                    <SheetFooter className="mt-4">
                        {Footer}
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Redeem Scheme</DialogTitle>
                    <DialogDescription>
                        Calculate final payout and close enrollment #{enrollment.account_number}
                    </DialogDescription>
                </DialogHeader>
                {Content}
                <DialogFooter>
                    {Footer}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
