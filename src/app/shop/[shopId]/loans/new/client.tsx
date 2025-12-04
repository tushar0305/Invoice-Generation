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
    Upload,
    Plus,
    X,
    Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import type { CreateLoanInput, CreateLoanCollateralInput, LoanCollateralType } from '@/lib/loan-types';

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
        purity: '',
        estimated_value: 0,
        description: '',
        photo_urls: []
    });

    const [loanTerms, setLoanTerms] = useState({
        principal_amount: 0,
        interest_rate: 24, // Default 24% annual
        start_date: new Date().toISOString().split('T')[0],
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
            purity: '',
            estimated_value: 0,
            description: '',
            photo_urls: []
        });
    };

    const handleRemoveItem = (index: number) => {
        setCollateralItems(collateralItems.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            console.log('Starting loan creation...');

            let customerId = selectedCustomerId;

            // 1. Create Customer if new
            if (isNewCustomer) {
                console.log('Creating new customer:', newCustomer);
                const { data: customer, error: customerError } = await supabase
                    .from('loan_customers')
                    .insert({
                        shop_id: shopId,
                        ...newCustomer
                    })
                    .select()
                    .single();

                if (customerError) {
                    console.error('Error creating customer:', customerError);
                    throw customerError;
                }
                console.log('Customer created:', customer);
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
                start_date: loanTerms.start_date,
                total_interest_accrued: 0,
                total_amount_paid: 0
            };
            console.log('Creating loan with data:', loanData);

            const { data: loan, error: loanError } = await supabase
                .from('loans')
                .insert(loanData)
                .select()
                .single();

            if (loanError) {
                console.error('Error creating loan:', loanError);
                throw loanError;
            }

            if (!loan) {
                console.error('Loan created but no data returned. Possible RLS issue.');
                throw new Error("Loan created but no data returned");
            }

            console.log('Loan created successfully:', loan);

            // 3. Create Collateral
            if (collateralItems.length > 0) {
                const collateralData = collateralItems.map(item => ({
                    loan_id: loan.id,
                    ...item
                }));
                console.log('Creating collateral:', collateralData);

                const { error: collateralError } = await supabase
                    .from('loan_collateral')
                    .insert(collateralData);

                if (collateralError) {
                    console.error('Error creating collateral:', collateralError);
                    throw collateralError;
                }
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

    const steps = [
        { id: 'customer', title: 'Customer', icon: User },
        { id: 'collateral', title: 'Collateral', icon: Gem },
        { id: 'terms', title: 'Loan Terms', icon: Banknote },
        { id: 'review', title: 'Review', icon: CheckCircle2 },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            {/* Progress Steps */}
            <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 w-full h-0.5 bg-muted -z-10" />
                {steps.map((step, index) => {
                    const isActive = step.id === currentStep;
                    const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
                    const Icon = step.icon;

                    return (
                        <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-4">
                            <div className={`
                                h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors
                                ${isActive || isCompleted ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground text-muted-foreground'}
                            `}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <span className={`text-sm font-medium ${isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {step.title}
                            </span>
                        </div>
                    );
                })}
            </div>

            <Card className="border-border shadow-md">
                <CardHeader>
                    <CardTitle>
                        {currentStep === 'customer' && "Select or Add Customer"}
                        {currentStep === 'collateral' && "Add Collateral Items"}
                        {currentStep === 'terms' && "Set Loan Terms"}
                        {currentStep === 'review' && "Review & Confirm"}
                    </CardTitle>
                    <CardDescription>
                        {currentStep === 'customer' && "Choose an existing customer or register a new one for this loan."}
                        {currentStep === 'collateral' && "Enter details of the gold/silver items being pledged."}
                        {currentStep === 'terms' && "Define the principal amount, interest rate, and dates."}
                        {currentStep === 'review' && "Verify all details before creating the loan."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* STEP 1: CUSTOMER */}
                    {currentStep === 'customer' && (
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <Button
                                    variant={!isNewCustomer ? "default" : "outline"}
                                    onClick={() => setIsNewCustomer(false)}
                                    className="flex-1"
                                >
                                    Existing Customer
                                </Button>
                                <Button
                                    variant={isNewCustomer ? "default" : "outline"}
                                    onClick={() => { setIsNewCustomer(true); setSelectedCustomerId(null); }}
                                    className="flex-1"
                                >
                                    New Customer
                                </Button>
                            </div>

                            {!isNewCustomer ? (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by name or phone..."
                                            className="pl-9"
                                            value={customerSearch}
                                            onChange={(e) => setCustomerSearch(e.target.value)}
                                        />
                                    </div>
                                    <div className="border rounded-md divide-y max-h-60 overflow-y-auto">
                                        {filteredCustomers.length === 0 ? (
                                            <div className="p-4 text-center text-muted-foreground">No customers found</div>
                                        ) : (
                                            filteredCustomers.map(customer => (
                                                <div
                                                    key={customer.id}
                                                    className={`p-3 flex items-center justify-between cursor-pointer hover:bg-accent ${selectedCustomerId === customer.id ? 'bg-accent' : ''}`}
                                                    onClick={() => setSelectedCustomerId(customer.id)}
                                                >
                                                    <div>
                                                        <div className="font-medium">{customer.name}</div>
                                                        <div className="text-sm text-muted-foreground">{customer.phone}</div>
                                                    </div>
                                                    {selectedCustomerId === customer.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label>Full Name</Label>
                                        <Input
                                            value={newCustomer.name}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                            placeholder="Enter customer name"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Phone Number</Label>
                                        <Input
                                            value={newCustomer.phone}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                            placeholder="Enter phone number"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Address</Label>
                                        <Textarea
                                            value={newCustomer.address}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                                            placeholder="Enter full address"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 2: COLLATERAL */}
                    {currentStep === 'collateral' && (
                        <div className="space-y-6">
                            {/* Add Item Form */}
                            <div className="grid gap-4 p-4 border rounded-lg bg-secondary/20">
                                <h3 className="font-medium">Add New Item</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Item Name</Label>
                                        <Input
                                            value={currentItem.item_name}
                                            onChange={(e) => setCurrentItem({ ...currentItem, item_name: e.target.value })}
                                            placeholder="e.g. Gold Ring"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Type</Label>
                                        <Select
                                            value={currentItem.item_type}
                                            onValueChange={(v: any) => setCurrentItem({ ...currentItem, item_type: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="gold">Gold</SelectItem>
                                                <SelectItem value="silver">Silver</SelectItem>
                                                <SelectItem value="diamond">Diamond</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Gross Weight (g)</Label>
                                        <Input
                                            type="number"
                                            value={currentItem.gross_weight || ''}
                                            onChange={(e) => setCurrentItem({ ...currentItem, gross_weight: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Net Weight (g)</Label>
                                        <Input
                                            type="number"
                                            value={currentItem.net_weight || ''}
                                            onChange={(e) => setCurrentItem({ ...currentItem, net_weight: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Purity</Label>
                                        <Input
                                            value={currentItem.purity || ''}
                                            onChange={(e) => setCurrentItem({ ...currentItem, purity: e.target.value })}
                                            placeholder="e.g. 22K"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Est. Value (₹)</Label>
                                        <Input
                                            type="number"
                                            value={currentItem.estimated_value || ''}
                                            onChange={(e) => setCurrentItem({ ...currentItem, estimated_value: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <Button onClick={handleAddItem} variant="secondary" className="w-full mt-2">
                                    <Plus className="h-4 w-4 mr-2" /> Add Item
                                </Button>
                            </div>

                            {/* Items List */}
                            <div className="space-y-2">
                                <Label>Items Added ({collateralItems.length})</Label>
                                {collateralItems.length === 0 ? (
                                    <div className="text-sm text-muted-foreground italic">No items added yet.</div>
                                ) : (
                                    <div className="space-y-2">
                                        {collateralItems.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 border rounded-md bg-card">
                                                <div>
                                                    <div className="font-medium">{item.item_name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {item.gross_weight}g • {item.purity} • ₹{item.estimated_value}
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(idx)}>
                                                    <X className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: TERMS */}
                    {currentStep === 'terms' && (
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label>Loan Number</Label>
                                <Input
                                    value={loanTerms.loan_number}
                                    onChange={(e) => setLoanTerms({ ...loanTerms, loan_number: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Principal Amount (₹)</Label>
                                <Input
                                    type="number"
                                    className="text-lg font-bold"
                                    value={loanTerms.principal_amount || ''}
                                    onChange={(e) => setLoanTerms({ ...loanTerms, principal_amount: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Annual Interest Rate (%)</Label>
                                <Input
                                    type="number"
                                    value={loanTerms.interest_rate}
                                    onChange={(e) => setLoanTerms({ ...loanTerms, interest_rate: parseFloat(e.target.value) })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Monthly rate: {(loanTerms.interest_rate / 12).toFixed(2)}%
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label>Start Date</Label>
                                <Input
                                    type="date"
                                    value={loanTerms.start_date}
                                    onChange={(e) => setLoanTerms({ ...loanTerms, start_date: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 4: REVIEW */}
                    {currentStep === 'review' && (
                        <div className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Customer</Label>
                                    <div className="font-medium text-lg">
                                        {isNewCustomer ? newCustomer.name : existingCustomers.find(c => c.id === selectedCustomerId)?.name}
                                    </div>
                                    <div className="text-sm">
                                        {isNewCustomer ? newCustomer.phone : existingCustomers.find(c => c.id === selectedCustomerId)?.phone}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Loan Amount</Label>
                                    <div className="font-bold text-2xl text-primary">
                                        ₹{formatCurrency(loanTerms.principal_amount)}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Interest Rate</Label>
                                    <div className="font-medium">
                                        {loanTerms.interest_rate}% p.a.
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Collateral Value</Label>
                                    <div className="font-medium">
                                        ₹{formatCurrency(collateralItems.reduce((sum, item) => sum + (item.estimated_value || 0), 0))}
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <Label className="mb-2 block">Collateral Items</Label>
                                <div className="border rounded-md divide-y">
                                    {collateralItems.map((item, idx) => (
                                        <div key={idx} className="p-3 text-sm flex justify-between">
                                            <span>{item.item_name} ({item.purity})</span>
                                            <span className="text-muted-foreground">{item.gross_weight}g</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between pt-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (currentStep === 'collateral') setCurrentStep('customer');
                                if (currentStep === 'terms') setCurrentStep('collateral');
                                if (currentStep === 'review') setCurrentStep('terms');
                            }}
                            disabled={currentStep === 'customer' || isSubmitting}
                        >
                            <ChevronLeft className="h-4 w-4 mr-2" /> Back
                        </Button>

                        {currentStep !== 'review' ? (
                            <Button
                                onClick={() => {
                                    if (currentStep === 'customer') {
                                        if (!isNewCustomer && !selectedCustomerId) {
                                            toast({ title: "Select a customer", variant: "destructive" });
                                            return;
                                        }
                                        if (isNewCustomer && !newCustomer.name) {
                                            toast({ title: "Enter customer name", variant: "destructive" });
                                            return;
                                        }
                                        setCurrentStep('collateral');
                                    } else if (currentStep === 'collateral') {
                                        if (collateralItems.length === 0) {
                                            toast({ title: "Add at least one item", variant: "destructive" });
                                            return;
                                        }
                                        setCurrentStep('terms');
                                    } else if (currentStep === 'terms') {
                                        if (loanTerms.principal_amount <= 0) {
                                            toast({ title: "Enter valid amount", variant: "destructive" });
                                            return;
                                        }
                                        setCurrentStep('review');
                                    }
                                }}
                            >
                                Next <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        ) : (
                            <Button onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? "Creating..." : "Create Loan"}
                            </Button>
                        )}
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
