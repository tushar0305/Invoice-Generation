'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useSchemes } from '@/hooks/use-schemes';
import { useActiveShop } from '@/hooks/use-active-shop';
import { supabase } from '@/supabase/client';
import { Loader2, CheckCircle2, Share2 } from 'lucide-react';
import { EnrollCustomerPayload } from '@/lib/scheme-types';
import { getShopSlug, generatePassbookUrl, openWhatsApp, getEnrollmentMessage } from '@/lib/scheme-share';

interface EnrollmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    customerId: string;
    customerName: string;
    customerPhone?: string;
    onSuccess?: () => void;
}

export function EnrollmentModal({ isOpen, onClose, customerId, customerName, customerPhone, onSuccess }: EnrollmentModalProps) {
    const { activeShop } = useActiveShop();
    const shopId = activeShop?.id;
    const { schemes, isLoading: isLoadingSchemes } = useSchemes(shopId);
    const { toast } = useToast();

    const [selectedSchemeId, setSelectedSchemeId] = useState<string>('');
    const [accountNumber, setAccountNumber] = useState<string>(''); // Optional, or auto-generate
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [targetValue, setTargetValue] = useState<string>(''); // For target weight or amount
    const [goalName, setGoalName] = useState<string>(''); // New: Goal Name
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successData, setSuccessData] = useState<{ enrollmentId: string, schemeName: string } | null>(null);

    // Filter only active schemes
    const activeSchemes = schemes.filter(s => s.is_active);
    const selectedScheme = schemes.find(s => s.id === selectedSchemeId);

    useEffect(() => {
        if (!isOpen) {
            setSelectedSchemeId('');
            setAccountNumber('');
            setTargetValue('');
            setGoalName('');
            setStartDate(new Date().toISOString().split('T')[0]);
            setSuccessData(null);
        }
    }, [isOpen]);

    const handleEnroll = async () => {
        if (!shopId || !selectedSchemeId || !customerId) return;

        setIsSubmitting(true);
        try {
            if (!selectedScheme) throw new Error("Invalid scheme selected");

            // Calculate maturity date
            const start = new Date(startDate);
            const maturity = new Date(start);
            maturity.setMonth(maturity.getMonth() + selectedScheme.duration_months);

            // Auto-generate account number if empty (Generic format: SCHEME-CUST-RANDOM)
            const finalAccountNumber = accountNumber || `${selectedScheme.name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 10000)}`.replace(/\s/g, '');

            const payload = {
                shop_id: shopId,
                customer_id: customerId,
                scheme_id: selectedScheme.id,
                account_number: finalAccountNumber,
                start_date: startDate,
                maturity_date: maturity.toISOString(),
                status: 'ACTIVE',
                total_paid: 0,
                total_gold_weight_accumulated: 0,
                // New Fields
                goal_name: goalName || null,
                target_weight: selectedScheme.calculation_type === 'WEIGHT_ACCUMULATION' ? Number(targetValue) || 0 : 0,
                target_amount: selectedScheme.calculation_type === 'FLAT_AMOUNT' ? Number(targetValue) || 0 : 0,
            };

            const { data: enrollmentData, error } = await supabase
                .from('scheme_enrollments')
                .insert([payload])
                .select('id')
                .single();

            if (error) throw error;

            setSuccessData({ enrollmentId: enrollmentData.id, schemeName: selectedScheme.name });
            toast({
                title: "Enrolled Successfully",
                description: `${customerName} has been enrolled in ${selectedScheme.name}.`,
            });
            onSuccess?.();
            // Don't close immediately, show success state
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Enrollment Failed",
                description: error.message || "Could not enroll customer.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleShare = async () => {
        if (!successData || !shopId) return;
        
        try {
            const slug = await getShopSlug(shopId);
            if (!slug) {
                toast({ 
                    title: "Cannot Share", 
                    description: "Shop public link not configured. Please set up your online store first.", 
                    variant: "destructive" 
                });
                return;
            }
            
            const url = generatePassbookUrl(slug, successData.enrollmentId);
            const msg = getEnrollmentMessage(customerName, successData.schemeName, url);
            openWhatsApp(customerPhone, msg);
            onClose();
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Failed to generate share link", variant: "destructive" });
        }
    };

    if (successData) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-md">
                    <div className="flex flex-col items-center justify-center py-6 space-y-4">
                        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <DialogTitle className="text-center text-xl">Enrollment Successful!</DialogTitle>
                        <DialogDescription className="text-center max-w-xs">
                            {customerName} is now enrolled in <strong>{successData.schemeName}</strong>.
                        </DialogDescription>
                        
                        <div className="w-full pt-4 space-y-2">
                            <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white" onClick={handleShare}>
                                <Share2 className="mr-2 h-4 w-4" />
                                Share Passbook on WhatsApp
                            </Button>
                            <Button variant="outline" className="w-full" onClick={onClose}>
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Enroll Customer</DialogTitle>
                    <DialogDescription>
                        Add {customerName} to a saving scheme.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Select Scheme</Label>
                        <Select value={selectedSchemeId} onValueChange={setSelectedSchemeId} disabled={isLoadingSchemes}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a scheme..." />
                            </SelectTrigger>
                            <SelectContent>
                                {activeSchemes.map((scheme) => (
                                    <SelectItem key={scheme.id} value={scheme.id}>
                                        {scheme.name} ({scheme.duration_months} Months)
                                    </SelectItem>
                                ))}
                                {activeSchemes.length === 0 && !isLoadingSchemes && (
                                    <SelectItem value="none" disabled>No active schemes found</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Account No. (Optional)</Label>
                            <Input
                                placeholder="Auto-generated if empty"
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Goal Name (Optional)</Label>
                        <Input
                            placeholder="e.g. Riya's Wedding 2026"
                            value={goalName}
                            onChange={(e) => setGoalName(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Give this saving plan a personal name.</p>
                    </div>

                    {selectedScheme && selectedScheme.calculation_type === 'WEIGHT_ACCUMULATION' && (
                        <div className="space-y-2">
                            <Label>Target Gold Weight (Grams)</Label>
                            <Input
                                type="number"
                                placeholder="e.g. 50"
                                value={targetValue}
                                onChange={(e) => setTargetValue(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Optional goal for the customer.</p>
                        </div>
                    )}

                    {selectedScheme && selectedScheme.calculation_type === 'FLAT_AMOUNT' && selectedScheme.scheme_type === 'FLEXIBLE' && (
                        <div className="space-y-2">
                            <Label>Target Saving Amount (₹)</Label>
                            <Input
                                type="number"
                                placeholder="e.g. 100000"
                                value={targetValue}
                                onChange={(e) => setTargetValue(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Optional goal for the customer.</p>
                        </div>
                    )}

                    {selectedSchemeId && (
                        <div className="bg-primary/5 p-3 rounded-md text-sm text-primary">
                            <strong>Summary:</strong> {customerName} will pay
                            {selectedScheme?.scheme_type === 'FIXED_DURATION'
                                ? ` ₹${selectedScheme?.scheme_amount}/month`
                                : ' flexible amounts'}
                            {' '}for {selectedScheme?.duration_months} months.
                            {selectedScheme?.calculation_type === 'WEIGHT_ACCUMULATION' && (
                                <div className="mt-1 text-xs font-semibold">
                                    * Payments will be converted to Gold Grams at daily rate.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleEnroll} disabled={isSubmitting || !selectedSchemeId}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Enrollment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
