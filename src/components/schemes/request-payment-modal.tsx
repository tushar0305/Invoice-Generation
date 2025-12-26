'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Share2, Loader2, Settings, IndianRupee } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateShopUpiId, getShopUpiId } from '@/actions/shop-settings-actions';

interface RequestPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    shopId: string;
    shopName: string;
    customerName: string;
    customerPhone: string;
    amount?: number;
    note?: string;
}

export function RequestPaymentModal({
    isOpen,
    onClose,
    shopId,
    shopName,
    customerName,
    customerPhone,
    amount: initialAmount = 0,
    note = 'Scheme Payment'
}: RequestPaymentModalProps) {
    const { toast } = useToast();
    const [upiId, setUpiId] = useState<string>('');
    const [amount, setAmount] = useState<string>(initialAmount > 0 ? initialAmount.toString() : '');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditingUpi, setIsEditingUpi] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadUpiId();
            if (initialAmount > 0) setAmount(initialAmount.toString());
        }
    }, [isOpen, shopId]);

    const loadUpiId = async () => {
        setIsLoading(true);
        const id = await getShopUpiId(shopId);
        if (id) {
            setUpiId(id);
        } else {
            setIsEditingUpi(true);
        }
        setIsLoading(false);
    };

    const handleSaveUpi = async () => {
        if (!upiId) return;
        setIsSaving(true);
        try {
            await updateShopUpiId(shopId, upiId);
            setIsEditingUpi(false);
            toast({ title: "Success", description: "UPI ID saved successfully." });
        } catch (error) {
            toast({ title: "Error", description: "Failed to save UPI ID.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const generateUpiLink = () => {
        if (!upiId) return '';
        const params = new URLSearchParams();
        params.append('pa', upiId);
        params.append('pn', shopName);
        if (amount) params.append('am', amount);
        params.append('tn', note);
        params.append('cu', 'INR');
        return `upi://pay?${params.toString()}`;
    };

    const handleShare = () => {
        const link = generateUpiLink();
        const msg = `Hello ${customerName}, please pay ₹${amount} for your scheme using this UPI link: ${link}`;
        window.open(`https://wa.me/${customerPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const handleCopyLink = () => {
        const link = generateUpiLink();
        navigator.clipboard.writeText(link);
        toast({ title: "Copied", description: "Payment link copied to clipboard." });
    };

    const upiLink = generateUpiLink();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Request Payment</DialogTitle>
                    <DialogDescription>
                        Generate a UPI QR code and link for {customerName}.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : isEditingUpi ? (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Shop UPI ID (VPA)</Label>
                            <Input 
                                placeholder="e.g. shopname@upi" 
                                value={upiId} 
                                onChange={(e) => setUpiId(e.target.value)} 
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter your merchant UPI ID to receive payments directly to your bank account.
                            </p>
                        </div>
                        <Button onClick={handleSaveUpi} disabled={isSaving || !upiId} className="w-full">
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save UPI ID
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="bg-white p-4 rounded-xl shadow-sm border">
                                <QRCodeSVG value={upiLink} size={200} level="M" />
                            </div>
                            <div className="text-center">
                                <p className="font-medium text-lg">Scan to Pay</p>
                                <p className="text-sm text-muted-foreground">{upiId}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Amount (₹)</Label>
                            <div className="relative">
                                <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    type="number" 
                                    className="pl-9" 
                                    value={amount} 
                                    onChange={(e) => setAmount(e.target.value)} 
                                    placeholder="Enter amount"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="outline" onClick={handleCopyLink}>
                                <Copy className="mr-2 h-4 w-4" /> Copy Link
                            </Button>
                            <Button className="bg-[#25D366] hover:bg-[#128C7E] text-white" onClick={handleShare}>
                                <Share2 className="mr-2 h-4 w-4" /> WhatsApp
                            </Button>
                        </div>

                        <div className="flex justify-center">
                            <Button variant="link" size="sm" onClick={() => setIsEditingUpi(true)} className="text-muted-foreground">
                                <Settings className="mr-2 h-3 w-3" /> Change UPI ID
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
