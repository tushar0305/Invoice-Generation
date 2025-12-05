'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import {
    User,
    Gem,
    Banknote,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    Plus,
    X,
    Search,
    Loader2,
    Calendar as CalendarIcon
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import type { CreateLoanCollateralInput } from '@/lib/loan-types';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

type Step = 'customer' | 'collateral' | 'terms' | 'review';

type NewLoanWizardClientProps = {
    shopId: string;
    existingCustomers: any[];
};

export function NewLoanWizardClient({ shopId, existingCustomers }: NewLoanWizardClientProps) {
    const router = useRouter();
    const { toast } = useToast();

    const [currentStep, setCurrentStep] = useState<Step>('customer');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone: '',
        address: '',
        photo_url: ''
    });
    const [isNewCustomer, setIsNewCustomer] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');

    const [collateralItems, setCollateralItems] = useState<CreateLoanCollateralInput[]>([]);
    const [currentItem, setCurrentItem] = useState<CreateLoanCollateralInput>({
        item_name: '',
        item_type: 'gold',
        gross_weight: 0,
        net_weight: 0,
        purity: '22K',
        estimated_value: 0,
        description: '',
        photo_urls: []
    });
    const [isAddingItem, setIsAddingItem] = useState(false);

    const [loanTerms, setLoanTerms] = useState({
        principal_amount: 0,
        interest_rate: 24, // Default 24% annual
        start_date: new Date(),
        loan_number: `LN-${Math.floor(Math.random() * 10000)}` // Temporary auto-gen
    });

    // Helper to filter customers
    const filteredCustomers = existingCustomers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone.includes(customerSearch)
    );

    const handleAddItem = () => {
        if (!currentItem.item_name || currentItem.gross_weight <= 0) {
            toast({
                title: "Invalid Item",
                description: "Please enter item name and valid weight",
                variant: "destructive"
            });
            return;
        }
        setCollateralItems([...collateralItems, currentItem]);
        setCurrentItem({
            item_name: '',
            item_type: 'gold',
            gross_weight: 0,
            net_weight: 0,
            purity: '22K',
            estimated_value: 0,
            description: '',
            photo_urls: []
        });
        setIsAddingItem(false);
    };

    const handleRemoveItem = (index: number) => {
        setCollateralItems(collateralItems.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);

            let customerId = selectedCustomerId;

            // 1. Create Customer if new
            if (isNewCustomer) {
                const { data: customer, error: customerError } = await supabase
                    .from('loan_customers')
                    .insert({
                        shop_id: shopId,
                        ...newCustomer
                    })
                    .select()
                    .single();

                if (customerError) throw customerError;
                customerId = customer.id;
            }

            if (!customerId) throw new Error("No customer selected");

            // 2. Create Loan
            const loanData = {
                shop_id: shopId,
                customer_id: customerId,
                loan_number: loanTerms.loan_number,
                status: 'active',
                principal_amount: loanTerms.principal_amount,
                interest_rate: loanTerms.interest_rate,
                start_date: loanTerms.start_date.toISOString().split('T')[0],
                total_interest_accrued: 0,
                total_amount_paid: 0
            };

            const { data: loan, error: loanError } = await supabase
                .from('loans')
                .insert(loanData)
                .select()
                .single();

            if (loanError) throw loanError;

            // 3. Create Collateral
            if (collateralItems.length > 0) {
                const collateralData = collateralItems.map(item => ({
                    loan_id: loan.id,
                    ...item
                }));

                const { error: collateralError } = await supabase
                    .from('loan_collateral')
                    .insert(collateralData);

                if (collateralError) throw collateralError;
            }

            toast({
                title: "Success",
                description: `Loan #${loan.loan_number} created successfully`,
            });

            router.push(`/shop/${shopId}/loans/${loan.id}`);

        } catch (error: any) {
            console.error('Error in handleSubmit:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to create loan",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const steps: { id: Step; title: string; icon: any }[] = [
        { id: 'customer', title: 'Customer', icon: User },
        { id: 'collateral', title: 'Items', icon: Gem },
        { id: 'terms', title: 'Terms', icon: Banknote },
        { id: 'review', title: 'Review', icon: CheckCircle2 },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === currentStep);

    const nextStep = () => {
        if (currentStep === 'customer' && !selectedCustomerId && !isNewCustomer) {
            toast({ title: "Select Customer", description: "Please select or create a customer", variant: "destructive" });
            return;
        }
        if (currentStep === 'customer' && isNewCustomer && !newCustomer.name) {
            toast({ title: "Invalid Customer", description: "Name is required", variant: "destructive" });
            return;
        }
        if (currentStep === 'collateral' && collateralItems.length === 0) {
            toast({ title: "No Collateral", description: "Please add at least one item", variant: "destructive" });
            return;
        }

        if (currentStepIndex < steps.length - 1) {
            setCurrentStep(steps[currentStepIndex + 1].id);
        } else {
            handleSubmit();
        }
    };

    const prevStep = () => {
        if (currentStepIndex > 0) {
            setCurrentStep(steps[currentStepIndex - 1].id);
        } else {
            router.back();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black pb-24">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                    <Button variant="ghost" size="icon" onClick={prevStep} className="-ml-2 rounded-full">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                        New Loan
                    </h1>
                    <div className="w-9" /> {/* Spacer */}
                </div>
                {/* Progress Bar */}
                <div className="flex items-center gap-1 h-1">
                    {steps.map((step, idx) => (
                        <div
                            key={step.id}
                            className={`h-full flex-1 rounded-full transition-all duration-300 ${idx <= currentStepIndex ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'
                                }`}
                        />
                    ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground font-medium">
                    <span>{steps[currentStepIndex].title}</span>
                    <span>Step {currentStepIndex + 1} of {steps.length}</span>
                </div>
            </div>

            <div className="p-4 max-w-md mx-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                    >
                        {/* STEP 1: CUSTOMER */}
                        {currentStep === 'customer' && (
                            <div className="space-y-4">
                                <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                                    <button
                                        onClick={() => setIsNewCustomer(false)}
                                        className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${!isNewCustomer ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-muted-foreground'}`}
                                    >
                                        Existing
                                    </button>
                                    <button
                                        onClick={() => { setIsNewCustomer(true); setSelectedCustomerId(null); }}
                                        className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${isNewCustomer ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-muted-foreground'}`}
                                    >
                                        New Customer
                                    </button>
                                </div>

                                {!isNewCustomer ? (
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search customers..."
                                                className="pl-9 bg-white dark:bg-gray-900"
                                                value={customerSearch}
                                                onChange={(e) => setCustomerSearch(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            {filteredCustomers.map(customer => (
                                                <div
                                                    key={customer.id}
                                                    onClick={() => setSelectedCustomerId(customer.id)}
                                                    className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedCustomerId === customer.id
                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                                                            : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="font-semibold">{customer.name}</p>
                                                            <p className="text-sm text-muted-foreground">{customer.phone}</p>
                                                        </div>
                                                        {selectedCustomerId === customer.id && (
                                                            <CheckCircle2 className="h-5 w-5 text-blue-500" />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {filteredCustomers.length === 0 && (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    No customers found
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <Card className="border-none shadow-sm">
                                        <CardContent className="p-4 space-y-4">
                                            <div className="space-y-2">
                                                <Label>Full Name</Label>
                                                <Input
                                                    value={newCustomer.name}
                                                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                                    placeholder="Enter name"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Phone Number</Label>
                                                <Input
                                                    value={newCustomer.phone}
                                                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                                    placeholder="Enter phone"
                                                    type="tel"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Address</Label>
                                                <Textarea
                                                    value={newCustomer.address}
                                                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                                                    placeholder="Enter address"
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}

                        {/* STEP 2: COLLATERAL */}
                        {currentStep === 'collateral' && (
                            <div className="space-y-4">
                                {collateralItems.map((item, idx) => (
                                    <Card key={idx} className="relative overflow-hidden border-none shadow-sm">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-semibold">{item.item_name}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {item.gross_weight}g • {item.purity}
                                                    </p>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(idx)} className="text-red-500 h-8 w-8 p-0">
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                {isAddingItem ? (
                                    <Card className="border-blue-200 dark:border-blue-800 shadow-md">
                                        <CardContent className="p-4 space-y-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="font-semibold text-blue-600">New Item</h3>
                                                <Button variant="ghost" size="sm" onClick={() => setIsAddingItem(false)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Item Name</Label>
                                                <Input
                                                    value={currentItem.item_name}
                                                    onChange={(e) => setCurrentItem({ ...currentItem, item_name: e.target.value })}
                                                    placeholder="e.g. Gold Ring"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Weight (g)</Label>
                                                    <Input
                                                        type="number"
                                                        value={currentItem.gross_weight || ''}
                                                        onChange={(e) => setCurrentItem({ ...currentItem, gross_weight: parseFloat(e.target.value) })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Purity</Label>
                                                    <Select
                                                        value={currentItem.purity || ''}
                                                        onValueChange={(v) => setCurrentItem({ ...currentItem, purity: v })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="24K">24K</SelectItem>
                                                            <SelectItem value="22K">22K</SelectItem>
                                                            <SelectItem value="18K">18K</SelectItem>
                                                            <SelectItem value="Silver">Silver</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <Button onClick={handleAddItem} className="w-full">Add Item</Button>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <Button
                                        variant="outline"
                                        className="w-full py-8 border-dashed border-2"
                                        onClick={() => setIsAddingItem(true)}
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> Add Collateral Item
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* STEP 3: TERMS */}
                        {currentStep === 'terms' && (
                            <Card className="border-none shadow-sm">
                                <CardContent className="p-4 space-y-6">
                                    <div className="space-y-2">
                                        <Label>Principal Amount (₹)</Label>
                                        <Input
                                            type="number"
                                            className="text-2xl font-bold h-14"
                                            value={loanTerms.principal_amount || ''}
                                            onChange={(e) => setLoanTerms({ ...loanTerms, principal_amount: parseFloat(e.target.value) })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Interest Rate (% Annual)</Label>
                                        <div className="flex gap-4">
                                            {[12, 18, 24, 36].map(rate => (
                                                <button
                                                    key={rate}
                                                    onClick={() => setLoanTerms({ ...loanTerms, interest_rate: rate })}
                                                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${loanTerms.interest_rate === rate
                                                            ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                                            : 'border-gray-200 dark:border-gray-800'
                                                        }`}
                                                >
                                                    {rate}%
                                                </button>
                                            ))}
                                        </div>
                                        <Input
                                            type="number"
                                            value={loanTerms.interest_rate}
                                            onChange={(e) => setLoanTerms({ ...loanTerms, interest_rate: parseFloat(e.target.value) })}
                                            className="mt-2"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Start Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !loanTerms.start_date && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {loanTerms.start_date ? format(loanTerms.start_date, "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={loanTerms.start_date}
                                                    onSelect={(date) => date && setLoanTerms({ ...loanTerms, start_date: date })}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* STEP 4: REVIEW */}
                        {currentStep === 'review' && (
                            <div className="space-y-4">
                                <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/50">
                                    <CardContent className="p-6 text-center space-y-2">
                                        <p className="text-sm text-muted-foreground uppercase tracking-wider">Principal Amount</p>
                                        <h2 className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                                            {formatCurrency(loanTerms.principal_amount)}
                                        </h2>
                                        <p className="text-sm font-medium text-blue-600 dark:text-blue-300">
                                            @ {loanTerms.interest_rate}% Interest
                                        </p>
                                    </CardContent>
                                </Card>

                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider ml-1">Customer</h3>
                                    <Card>
                                        <CardContent className="p-4">
                                            {isNewCustomer ? (
                                                <div>
                                                    <p className="font-bold">{newCustomer.name}</p>
                                                    <p className="text-sm text-muted-foreground">{newCustomer.phone}</p>
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1 inline-block">New Customer</span>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="font-bold">{existingCustomers.find(c => c.id === selectedCustomerId)?.name}</p>
                                                    <p className="text-sm text-muted-foreground">{existingCustomers.find(c => c.id === selectedCustomerId)?.phone}</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider ml-1">Collateral ({collateralItems.length})</h3>
                                    <div className="space-y-2">
                                        {collateralItems.map((item, idx) => (
                                            <Card key={idx} className="border-none shadow-sm bg-gray-50 dark:bg-gray-900">
                                                <CardContent className="p-3 flex justify-between items-center">
                                                    <span className="font-medium">{item.item_name}</span>
                                                    <span className="text-sm text-muted-foreground">{item.gross_weight}g</span>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40">
                <Button
                    onClick={nextStep}
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-xl text-lg font-semibold shadow-lg shadow-blue-500/20"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Creating Loan...
                        </>
                    ) : (
                        <>
                            {currentStep === 'review' ? 'Create Loan' : 'Next Step'}
                            {currentStep !== 'review' && <ChevronRight className="ml-2 h-5 w-5" />}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}