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

// ... imports kept as is, this is just to show the structure I'll likely write
export function PaymentEntryModal({ isOpen, onClose, enrollment, onSuccess }: PaymentEntryModalProps) {
    const { toast } = useToast();
    const [amount, setAmount] = useState<string>('');
    const [paymentMode, setPaymentMode] = useState<string>('CASH');
    const [goldRate, setGoldRate] = useState<string>(''); // For manual entry if needed
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successData, setSuccessData] = useState<{ transaction: any, enrollment: SchemeEnrollment } | null>(null);

    // Fetch shop details for PDF
    const fetchShopDetails = async (shopId: string) => {
        const { data } = await supabase.from('shops').select('*').eq('id', shopId).single();
        return data; // Simple fetch, ideally cached or passed from parent
    };

    const handlePrintReceipt = async () => {
        if (!successData) return;
        try {
            const shop = await fetchShopDetails(successData.transaction.shop_id);
            const { generateSchemeReceiptPdf } = await import('@/lib/scheme-pdf');

            // Enrich enrollment with customer if missing (it might be missing in the prop)
            let enrollmentToPrint = successData.enrollment;

            const pdfBlob = await generateSchemeReceiptPdf({
                transaction: successData.transaction,
                enrollment: enrollmentToPrint,
                shop: shop || { shopName: 'Shop' }
            });

            const url = URL.createObjectURL(pdfBlob);
            window.open(url, '_blank');
        } catch (error) {
            console.error('PDF Error', error);
            toast({ title: 'Error', description: 'Failed to generate receipt', variant: 'destructive' });
        }
    };

    const handleSubmit = async () => {
        if (!enrollment || !amount) return;

        setIsSubmitting(true);
        try {
            const numericAmount = parseFloat(amount);
            const numericRate = goldRate ? parseFloat(goldRate) : 0;
            const weight = numericRate > 0 ? calculateGoldWeight(numericAmount, numericRate) : 0;

            const { data: newTx, error: txError } = await supabase.from('scheme_transactions').insert({
                enrollment_id: enrollment.id,
                shop_id: enrollment.shop_id,
                transaction_type: 'INSTALLMENT',
                amount: numericAmount,
                gold_rate: numericRate > 0 ? numericRate : null,
                gold_weight: weight > 0 ? weight : null,
                payment_mode: paymentMode,
                status: 'PAID',
                description: 'Monthly Installment'
            }).select().single();

            if (txError) throw txError;

            // Update enrollment totals
            const { error: updateError } = await supabase.rpc('update_enrollment_totals', {
                enrollment_uuid: enrollment.id,
                amount_paid: numericAmount,
                weight_added: weight
            });

            if (updateError) {
                // Fallback manual update
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

            // Show Success State instead of closing
            setSuccessData({ transaction: newTx, enrollment });

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

    const handleClose = () => {
        setSuccessData(null);
        setAmount('');
        setGoldRate('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{successData ? 'Payment Successful' : 'Record Payment'}</DialogTitle>
                    <DialogDescription>
                        {enrollment?.scheme?.name} - Account: {enrollment?.account_number}
                    </DialogDescription>
                </DialogHeader>

                {successData ? (
                    <div className="py-6 flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in-50">
                        <div className="h-16 w-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                            <span className="text-3xl">✅</span>
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold">₹{successData.transaction.amount} Received</h3>
                            <p className="text-sm text-muted-foreground">Transaction ID: {successData.transaction.id.slice(0, 8)}</p>
                        </div>
                        <Button className="w-full gap-2" onClick={handlePrintReceipt}>
                            <Loader2 className="h-4 w-4 hidden" /> {/* Placeholder for loading state if needed */}
                            Print Receipt
                        </Button>
                    </div>
                ) : (
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
                            <Label>Today's Gold Rate (per gram) (Optional)</Label>
                            <Input
                                type="number"
                                value={goldRate}
                                onChange={(e) => setGoldRate(e.target.value)}
                                placeholder="Current gold rate"
                            />
                            <p className="text-xs text-muted-foreground">Enter rate to convert payment amount to gold weight.</p>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {successData ? (
                        <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">Close</Button>
                    ) : (
                        <>
                            <Button variant="outline" onClick={onClose}>Cancel</Button>
                            <Button onClick={handleSubmit} disabled={isSubmitting || !amount}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Record Payment
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
