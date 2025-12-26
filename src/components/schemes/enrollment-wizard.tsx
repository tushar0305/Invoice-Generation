'use client';

import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Search, Loader2, Check } from 'lucide-react';
import { supabase } from '@/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface EnrollmentWizardProps {
    shopId: string;
    schemeId?: string; // If provided, enroll in this scheme. If not, show scheme selector (future)
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function EnrollmentWizard({ shopId, schemeId, trigger, onSuccess }: EnrollmentWizardProps) {
    const [open, setOpen] = useState(false);
    const isMobile = useIsMobile();

    if (!isMobile) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {trigger || <Button>Enroll Customer</Button>}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Enroll Customer</DialogTitle>
                        <DialogDescription>
                            Select an existing customer or create a new one to enroll in this scheme.
                        </DialogDescription>
                    </DialogHeader>
                    <EnrollmentForm shopId={shopId} schemeId={schemeId} onSuccess={() => {
                        setOpen(false);
                        onSuccess?.();
                    }} />
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                {trigger || <Button>Enroll Customer</Button>}
            </DrawerTrigger>
            <DrawerContent>
                <DrawerHeader className="text-left">
                    <DrawerTitle>Enroll Customer</DrawerTitle>
                    <DrawerDescription>
                        Select an existing customer or create a new one.
                    </DrawerDescription>
                </DrawerHeader>
                <div className="px-4 pb-8">
                    <EnrollmentForm shopId={shopId} schemeId={schemeId} onSuccess={() => {
                        setOpen(false);
                        onSuccess?.();
                    }} />
                </div>
            </DrawerContent>
        </Drawer>
    );
}

function EnrollmentForm({ shopId, schemeId, onSuccess }: { shopId: string, schemeId?: string, onSuccess: () => void }) {
    const [step, setStep] = useState<'search' | 'create' | 'confirm'>('search');
    const [searchQuery, setSearchQuery] = useState('');
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    // New Customer Form State
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone: '',
        email: '',
        address: ''
    });

    // Search Customers
    useEffect(() => {
        const searchCustomers = async () => {
            if (searchQuery.length < 2) {
                setCustomers([]);
                return;
            }
            
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('customers')
                    .select('*')
                    .eq('shop_id', shopId)
                    .ilike('name', `%${searchQuery}%`)
                    .limit(5);
                
                if (error) throw error;
                setCustomers(data || []);
            } catch (error) {
                console.error('Error searching customers:', error);
            } finally {
                setIsLoading(false);
            }
        };

        const debounce = setTimeout(searchCustomers, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery, shopId]);

    const handleCreateCustomer = async () => {
        if (!newCustomer.name || !newCustomer.phone) {
            toast({ title: "Error", description: "Name and Phone are required", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('customers')
                .insert({
                    shop_id: shopId,
                    name: newCustomer.name,
                    phone: newCustomer.phone,
                    email: newCustomer.email,
                    address: newCustomer.address,
                    type: 'CUSTOMER'
                })
                .select()
                .single();

            if (error) throw error;
            
            setSelectedCustomer(data);
            setStep('confirm');
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnroll = async () => {
        if (!selectedCustomer || !schemeId) return;

        setIsLoading(true);
        try {
            // Generate Account Number (Simple logic for now)
            const accountNum = `SCH-${Date.now().toString().slice(-6)}`;
            
            // Get Scheme Details for maturity calculation
            const { data: scheme } = await supabase.from('schemes').select('*').eq('id', schemeId).single();
            if (!scheme) throw new Error("Scheme not found");

            const startDate = new Date();
            const maturityDate = new Date();
            maturityDate.setMonth(maturityDate.getMonth() + scheme.duration_months);

            const { error } = await supabase
                .from('scheme_enrollments')
                .insert({
                    shop_id: shopId,
                    customer_id: selectedCustomer.id,
                    scheme_id: schemeId,
                    account_number: accountNum,
                    start_date: startDate.toISOString(),
                    maturity_date: maturityDate.toISOString(),
                    status: 'ACTIVE'
                });

            if (error) throw error;

            toast({ title: "Success", description: "Customer enrolled successfully!" });
            onSuccess();
            router.refresh();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    if (step === 'search') {
        return (
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name..." 
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {isLoading && <div className="flex justify-center p-4"><Loader2 className="animate-spin h-5 w-5 text-muted-foreground" /></div>}
                    
                    {!isLoading && customers.length === 0 && searchQuery.length >= 2 && (
                        <div className="text-center p-4 text-muted-foreground text-sm">
                            No customers found.
                        </div>
                    )}

                    {customers.map(customer => (
                        <div 
                            key={customer.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => {
                                setSelectedCustomer(customer);
                                setStep('confirm');
                            }}
                        >
                            <div>
                                <p className="font-medium">{customer.name}</p>
                                <p className="text-xs text-muted-foreground">{customer.phone}</p>
                            </div>
                            <Button size="sm" variant="ghost">Select</Button>
                        </div>
                    ))}
                </div>

                <div className="pt-4 border-t">
                    <Button variant="outline" className="w-full" onClick={() => setStep('create')}>
                        <UserPlus className="mr-2 h-4 w-4" /> Create New Customer
                    </Button>
                </div>
            </div>
        );
    }

    if (step === 'create') {
        return (
            <div className="space-y-4">
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email (Optional)</Label>
                        <Input id="email" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="address">Address (Optional)</Label>
                        <Input id="address" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} />
                    </div>
                </div>
                <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="flex-1" onClick={() => setStep('search')}>Back</Button>
                    <Button className="flex-1" onClick={handleCreateCustomer} disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Create & Continue'}
                    </Button>
                </div>
            </div>
        );
    }

    if (step === 'confirm') {
        return (
            <div className="space-y-6 text-center py-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <UserPlus className="h-8 w-8 text-primary" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold">Confirm Enrollment</h3>
                    <p className="text-muted-foreground mt-1">
                        Enroll <span className="font-medium text-foreground">{selectedCustomer.name}</span> into this scheme?
                    </p>
                </div>
                
                <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setStep('search')}>Change Customer</Button>
                    <Button className="flex-1" onClick={handleEnroll} disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Confirm Enrollment'}
                    </Button>
                </div>
            </div>
        );
    }

    return null;
}
