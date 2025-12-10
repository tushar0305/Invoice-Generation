import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { CustomerFTSCombobox } from '@/components/search/customer-fts-combobox';
import { UseFormReturn } from 'react-hook-form';

interface CustomerDetailsCardProps {
    form: UseFormReturn<any>;
    shopId: string;
    disabled?: boolean;
}

export function CustomerDetailsCard({ form, shopId, disabled }: CustomerDetailsCardProps) {
    return (
        <Card className="border-2 shadow-sm relative z-30 overflow-visible">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-primary" /> Customer Search
                </CardTitle>
            </CardHeader>
            <CardContent>
                <CustomerFTSCombobox
                    shopId={shopId}
                    onSelect={(row) => {
                        // Persist selected customer id for submission
                        // @ts-ignore
                        form.setValue('customerId', row.id, { shouldValidate: true });
                        form.setValue('customerName', row.name || '', { shouldValidate: true });
                        form.setValue('customerPhone', row.phone || '');
                        form.setValue('customerEmail', row.email || '');
                        // Pre-fill address/state/pincode if available in schema
                        // @ts-ignore
                        form.setValue('customerAddress', (row as any).address || '');
                        // @ts-ignore
                        form.setValue('customerState', (row as any).state || '');
                        // @ts-ignore
                        form.setValue('customerPincode', (row as any).pincode || '');
                    }}
                />

                {/* Selected customer detail preview */}
                {(form.watch('customerName') || form.watch('customerPhone') || form.watch('customerEmail')) && (
                    <div className="mt-4 rounded-lg border bg-card p-3 text-sm">
                        <div className="font-medium">{form.watch('customerName') || 'Unnamed'}</div>
                        <div className="text-muted-foreground">
                            {[form.watch('customerEmail'), form.watch('customerPhone')].filter(Boolean).join(' • ')}
                        </div>
                        <div className="mt-1 text-muted-foreground">
                            {[form.watch('customerAddress'), form.watch('customerState'), form.watch('customerPincode')].filter(Boolean).join(', ')}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
