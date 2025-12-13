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
import { Loader2 } from 'lucide-react';
import { EnrollCustomerPayload } from '@/lib/scheme-types';

interface EnrollmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    customerId: string;
    customerName: string;
    onSuccess?: () => void;
}

export function EnrollmentModal({ isOpen, onClose, customerId, customerName, onSuccess }: EnrollmentModalProps) {
    const { activeShop } = useActiveShop();
    const shopId = activeShop?.id;
    const { schemes, isLoading: isLoadingSchemes } = useSchemes(shopId);
    const { toast } = useToast();

    const [selectedSchemeId, setSelectedSchemeId] = useState<string>('');
    const [accountNumber, setAccountNumber] = useState<string>(''); // Optional, or auto-generate
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter only active schemes
    const activeSchemes = schemes.filter(s => s.is_active);

    useEffect(() => {
        if (!isOpen) {
            setSelectedSchemeId('');
            setAccountNumber('');
            setStartDate(new Date().toISOString().split('T')[0]);
        }
    }, [isOpen]);

    const handleEnroll = async () => {
        if (!shopId || !selectedSchemeId || !customerId) return;

        setIsSubmitting(true);
        try {
            const selectedScheme = schemes.find(s => s.id === selectedSchemeId);
            if (!selectedScheme) throw new Error("Invalid scheme selected");

            // Calculate maturity date
            const start = new Date(startDate);
            const maturity = new Date(start);
            maturity.setMonth(maturity.getMonth() + selectedScheme.duration_months);

            // Auto-generate account number if empty (Generic format: SCHEME-CUST-RANDOM)
            // Ideally backend trigger or procedure handles this to ensure uniqueness, but we'll do best effort here
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
                total_gold_weight_accumulated: 0
            };

            const { error } = await supabase
                .from('scheme_enrollments')
                .insert([payload]);

            if (error) throw error;

            toast({
                title: "Enrolled Successfully",
                description: `${customerName} has been enrolled in ${selectedScheme.name}.`,
            });
            onSuccess?.();
            onClose();
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

                    {selectedSchemeId && (
                        <div className="bg-primary/5 p-3 rounded-md text-sm text-primary">
                            <strong>Summary:</strong> {customerName} will pay
                            {schemes.find(s => s.id === selectedSchemeId)?.type === 'FIXED_AMOUNT'
                                ? ` ₹${schemes.find(s => s.id === selectedSchemeId)?.scheme_amount}/month`
                                : ' flexible amounts'}
                            {' '}for {schemes.find(s => s.id === selectedSchemeId)?.duration_months} months.
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
