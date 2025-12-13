'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import { Loader2 } from 'lucide-react';
import { SchemeEnrollment } from '@/lib/scheme-types';
import { calculateGoldWeight } from '@/lib/utils/scheme-calculations';

interface PaymentEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    enrollment?: SchemeEnrollment;
    onSuccess?: () => void;
}

export function PaymentEntryModal({ isOpen, onClose, enrollment, onSuccess }: PaymentEntryModalProps) {
    const { toast } = useToast();
    const [amount, setAmount] = useState<string>('');
    const [paymentMode, setPaymentMode] = useState<string>('CASH');
    const [goldRate, setGoldRate] = useState<string>(''); // For manual entry if needed
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!enrollment || !amount) return;

        setIsSubmitting(true);
        try {
            const numericAmount = parseFloat(amount);
            const numericRate = goldRate ? parseFloat(goldRate) : 0; // Ideally fetch live rate

            // Calculate gold weight only if rate is provided (or fetch it here)
            // For now, if rate is 0, weight is 0.
            const weight = numericRate > 0 ? calculateGoldWeight(numericAmount, numericRate) : 0;

            const { error: txError } = await supabase.from('scheme_transactions').insert({
                enrollment_id: enrollment.id,
                shop_id: enrollment.shop_id,
                transaction_type: 'INSTALLMENT',
                amount: numericAmount,
                gold_rate: numericRate > 0 ? numericRate : null,
                gold_weight: weight > 0 ? weight : null,
                payment_mode: paymentMode,
                status: 'PAID',
                description: 'Monthly Installment'
            });

            if (txError) throw txError;

            // Update enrollment totals
            const { error: updateError } = await supabase.rpc('update_enrollment_totals', {
                enrollment_uuid: enrollment.id,
                amount_paid: numericAmount,
                weight_added: weight
            });

            // Fallback if RPC doesn't exist yet: Manual update
            if (updateError) {
                await supabase.from('scheme_enrollments').update({
                    total_paid: (enrollment.total_paid || 0) + numericAmount,
                    total_gold_weight_accumulated: (enrollment.total_gold_weight_accumulated || 0) + weight
                }).eq('id', enrollment.id);
            }

            toast({
                title: "Payment Recorded",
                description: `Received ₹${numericAmount} via ${paymentMode}`,
            });
            onSuccess?.();
            onClose();
            setAmount('');
            setGoldRate('');
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                    <DialogDescription>
                        {enrollment?.scheme?.name} - Account: {enrollment?.account_number}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Amount (₹)</Label>
                        <Input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Payment Mode</Label>
                        <Select value={paymentMode} onValueChange={setPaymentMode}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CASH">Cash</SelectItem>
                                <SelectItem value="UPI">UPI</SelectItem>
                                <SelectItem value="CARD">Card</SelectItem>
                                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Today's Gold Rate (per gram) {enrollment?.scheme?.rules.gold_conversion !== 'MONTHLY' && '(Optional)'}</Label>
                        <Input
                            type="number"
                            value={goldRate}
                            onChange={(e) => setGoldRate(e.target.value)}
                            placeholder="Current gold rate"
                        />
                        {enrollment?.scheme?.rules.gold_conversion === 'MONTHLY' && (
                            <p className="text-xs text-muted-foreground">Required for this scheme type to calculate accumulated weight.</p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !amount}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Record Payment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
