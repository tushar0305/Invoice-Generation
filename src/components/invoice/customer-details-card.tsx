import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { PremiumCustomerAutocomplete } from '@/components/invoice/PremiumCustomerAutocomplete';
import { UseFormReturn } from 'react-hook-form';

interface CustomerDetailsCardProps {
    form: UseFormReturn<any>;
    customers: any[];
    onSearch: (q: string) => Promise<void>;
    disabled?: boolean;
}

export function CustomerDetailsCard({ form, customers, onSearch, disabled }: CustomerDetailsCardProps) {
    return (
        <Card className="border-2 shadow-sm relative z-30 overflow-visible">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-primary" /> Customer Details
                </CardTitle>
            </CardHeader>
            <CardContent>
                <PremiumCustomerAutocomplete
                    customers={customers}
                    value={{
                        name: form.watch('customerName'),
                        phone: form.watch('customerPhone'),
                        address: form.watch('customerAddress'),
                        state: form.watch('customerState'),
                        pincode: form.watch('customerPincode'),
                        email: form.watch('customerEmail'),
                    }}
                    onChange={(c) => {
                        if (c.name !== undefined) form.setValue('customerName', c.name, { shouldValidate: true });
                        if (c.phone !== undefined) form.setValue('customerPhone', c.phone, { shouldValidate: true });
                        if (c.address !== undefined) form.setValue('customerAddress', c.address || '');
                        if (c.state !== undefined) form.setValue('customerState', c.state || '');
                        if (c.pincode !== undefined) form.setValue('customerPincode', c.pincode || '');
                        if (c.email !== undefined) form.setValue('customerEmail', c.email || '');
                    }}
                    onSearch={onSearch}
                    disabled={disabled}
                />
            </CardContent>
        </Card>
    );
}
