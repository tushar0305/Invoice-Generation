'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import { Loader2, Share2, Printer } from 'lucide-react';
import { SchemeEnrollment } from '@/lib/scheme-types';
import { calculateGoldWeight } from '@/lib/utils/scheme-calculations';
import { useMediaQuery } from '@/hooks/use-media-query';
import { getShopSlug, generatePassbookUrl, openWhatsApp, getPaymentMessage } from '@/lib/scheme-share';
import { getMarketRates } from '@/actions/dashboard-actions';

interface PaymentEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    enrollment?: SchemeEnrollment | null;
    customerName?: string;
    customerPhone?: string;
    onSuccess?: () => void;
}

export function PaymentEntryModal({ isOpen, onClose, enrollment, customerName, customerPhone, onSuccess }: PaymentEntryModalProps) {
    const { toast } = useToast();
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const [amount, setAmount] = useState<string>('');
    const [paymentMode, setPaymentMode] = useState<string>('CASH');
    const [goldRate, setGoldRate] = useState<string>(''); // For manual entry if needed
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successData, setSuccessData] = useState<{ transaction: any, enrollment: SchemeEnrollment } | null>(null);

    // Auto-fetch gold rate when modal opens
    useEffect(() => {
        if (isOpen && enrollment?.shop_id) {
            const fetchRate = async () => {
                try {
                    const rates = await getMarketRates(enrollment.shop_id);
                    if (rates && rates.gold_22k) {
                        setGoldRate(rates.gold_22k.toString());
                    }
                } catch (err) {
                    console.error('Failed to fetch market rates', err);
                }
            };
            fetchRate();
        }
    }, [isOpen, enrollment?.shop_id]);

    // Fetch shop details for PDF
    const fetchShopDetails = async (shopId: string) => {
        const { data } = await supabase.from('shops').select('*').eq('id', shopId).single();
        if (data) {
            return {
                ...data,
                shopName: data.shop_name || data.name || data.shopName,
                phoneNumber: data.phone_number || data.phone || data.phoneNumber,
                address: data.address,
                email: data.email,
                logoUrl: data.logo_url || data.logoUrl
            };
        }
        return data;
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

    const handleShare = async () => {
        if (!successData || !enrollment) return;
        try {
            const shopId = enrollment.shop_id;
            const slug = await getShopSlug(shopId);
            if (!slug) {
                toast({ title: "Cannot Share", description: "Shop public link not configured.", variant: "destructive" });
                return;
            }
            const url = generatePassbookUrl(slug, enrollment.id);
            const msg = getPaymentMessage(
                customerName || 'Customer', 
                successData.transaction.amount, 
                successData.transaction.gold_weight || 0,
                enrollment.scheme?.name || 'Scheme',
                url
            );
            openWhatsApp(customerPhone, msg);
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Failed to generate share link", variant: "destructive" });
        }
    };

    const isWeightScheme = enrollment?.scheme?.calculation_type === 'WEIGHT_ACCUMULATION';

    const handleSubmit = async () => {
        if (!enrollment || !amount) return;
        if (isWeightScheme && !goldRate) {
            toast({ title: "Error", description: "Gold Rate is required for this scheme.", variant: "destructive" });
            return;
        }

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
            // Note: We need to ensure the RPC supports weight updates or we do it manually
            // For now, manual update is safer as RPC might be old
            const { error: updateError } = await supabase.from('scheme_enrollments').update({
                total_paid: (enrollment.total_paid || 0) + numericAmount,
                total_gold_weight_accumulated: (enrollment.total_gold_weight_accumulated || 0) + weight,
                current_weight_balance: (enrollment.current_weight_balance || 0) + weight // Update balance too
            }).eq('id', enrollment.id);

            if (updateError) throw updateError;

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

    const FormContent = (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    autoFocus
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
                <Label>
                    Today's Gold Rate (per gram) 
                    {isWeightScheme ? <span className="text-red-500 ml-1">*</span> : ' (Optional)'}
                </Label>
                <Input
                    type="number"
                    value={goldRate}
                    onChange={(e) => setGoldRate(e.target.value)}
                    placeholder="Current gold rate"
                    required={isWeightScheme}
                />
                <p className="text-xs text-muted-foreground">
                    {isWeightScheme 
                        ? 'Required to calculate accumulated gold weight.' 
                        : 'Enter rate to convert payment amount to gold weight.'}
                </p>
            </div>
        </div>
    );

    const SuccessContent = successData ? (
        <div className="py-6 flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in-50">
            <div className="h-16 w-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <span className="text-3xl">✅</span>
            </div>
            <div className="text-center">
                <h3 className="text-lg font-bold">₹{successData.transaction.amount} Received</h3>
                <p className="text-sm text-muted-foreground">Transaction ID: {successData.transaction.id.slice(0, 8)}</p>
            </div>
            <div className="flex flex-col w-full gap-2">
                <Button className="w-full gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                    Share Receipt on WhatsApp
                </Button>
                <Button variant="outline" className="w-full gap-2" onClick={handlePrintReceipt}>
                    <Printer className="h-4 w-4" />
                    Print Receipt
                </Button>
            </div>
        </div>
    ) : null;

    if (isDesktop) {
        return (
            <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{successData ? 'Payment Successful' : 'Record Payment'}</DialogTitle>
                        <DialogDescription>
                            {enrollment?.scheme?.name} - Account: {enrollment?.account_number}
                        </DialogDescription>
                    </DialogHeader>

                    {successData ? SuccessContent : FormContent}

                    <DialogFooter>
                        {successData ? (
                            <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">Close</Button>
                        ) : (
                            <>
                                <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
                                <Button onClick={handleSubmit} disabled={isSubmitting || !amount} type="submit">
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

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <SheetContent side="bottom" className="rounded-t-xl px-4 pb-8 max-h-[90vh] overflow-y-auto">
                <SheetHeader className="text-left">
                    <SheetTitle>{successData ? 'Payment Successful' : 'Record Payment'}</SheetTitle>
                    <SheetDescription>
                        {enrollment?.scheme?.name} - Account: {enrollment?.account_number}
                    </SheetDescription>
                </SheetHeader>

                {successData ? SuccessContent : FormContent}

                <SheetFooter className="flex-col gap-3 sm:flex-col mt-4">
                    {successData ? (
                        <Button variant="outline" onClick={handleClose} className="w-full">Close</Button>
                    ) : (
                        <div className="flex flex-col gap-3 w-full">
                            <Button onClick={handleSubmit} disabled={isSubmitting || !amount} className="w-full">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Record Payment
                            </Button>
                            <Button variant="outline" onClick={onClose} className="w-full">Cancel</Button>
                        </div>
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
