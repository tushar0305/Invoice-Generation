import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, User, Phone, MapPin } from 'lucide-react';
import { CustomerFTSCombobox } from '@/components/search/customer-fts-combobox';
import { UseFormReturn } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CustomerDetailsCardProps {
    form: UseFormReturn<any>;
    shopId: string;
    disabled?: boolean;
}

export function CustomerDetailsCard({ form, shopId, disabled }: CustomerDetailsCardProps) {
    const customerName = form.watch('customerName');
    const customerPhone = form.watch('customerPhone');
    const customerEmail = form.watch('customerEmail');
    const customerAddress = form.watch('customerAddress');

    const clearCustomer = () => {
        form.setValue('customerId', '');
        form.setValue('customerName', '');
        form.setValue('customerPhone', '');
        form.setValue('customerEmail', '');
        form.setValue('customerAddress', '');
        form.setValue('customerState', '');
        form.setValue('customerPincode', '');
    };

    return (
        <Card className="border-2 shadow-sm relative z-30 overflow-visible">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-primary" /> Customer Details
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {!customerName ? (
                    <div className="space-y-2">
                        <CustomerFTSCombobox
                            shopId={shopId}
                            onSelect={(row) => {
                                // Persist selected customer id for submission
                                // @ts-ignore
                                form.setValue('customerId', row.id, { shouldValidate: true });
                                form.setValue('customerName', row.name || '', { shouldValidate: true });
                                form.setValue('customerPhone', row.phone || '', { shouldValidate: true });
                                form.setValue('customerEmail', row.email || '');
                                // Pre-fill address/state/pincode if available in schema
                                // @ts-ignore
                                form.setValue('customerAddress', (row as any).address || '');
                                // @ts-ignore
                                form.setValue('customerState', (row as any).state || '');
                                // @ts-ignore
                                form.setValue('customerPincode', (row as any).pincode || '');
                            }}
                            placeholder="Search or Add Customer (Name/Phone)"
                            disabled={disabled}
                        />
                        <p className="text-xs text-muted-foreground">
                            Search by name or phone. If not found, you can add a new customer directly from the dropdown.
                        </p>
                        {form.formState.errors.customerName && (
                            <p className="text-xs text-destructive font-medium animate-in slide-in-from-top-1">
                                {form.formState.errors.customerName.message as string}
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="rounded-xl border bg-card/50 p-4 space-y-3 relative group">
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" onClick={clearCustomer} className="h-8 text-muted-foreground hover:text-destructive">
                                Change
                            </Button>
                        </div>
                        
                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                {customerName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-bold text-base">{customerName}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                                    <Phone className="h-3 w-3" />
                                    <span>+91 {customerPhone}</span>
                                </div>
                            </div>
                        </div>

                        {(customerEmail || customerAddress) && (
                            <div className="pt-2 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                                {customerEmail && (
                                    <div className="flex items-center gap-1.5">
                                        <User className="h-3 w-3" /> {customerEmail}
                                    </div>
                                )}
                                {customerAddress && (
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="h-3 w-3" /> {customerAddress}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
