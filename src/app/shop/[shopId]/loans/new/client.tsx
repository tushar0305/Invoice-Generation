'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import {
    User,
    Gem,
    Banknote,
    CheckCircle2,
    ChevronLeft,
    Plus,
    X,
    Loader2,
    Calendar as CalendarIcon,
    Trash2,
    Edit2,
    ArrowRight,
    AlertCircle,
    Receipt,
    ChevronDown,
    ChevronUp,
    FileText,
    Upload,
    Paperclip
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
import { formatCurrency, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { CustomerFTSCombobox } from '@/components/search/customer-fts-combobox';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Import our schemas (assuming they are in schemas.ts)
import {
    loanWizardSchema,
    type LoanWizardValues,
    type CustomerValues,
    type CollateralItemValues,
    type DocumentValues,
    type LoanTermsValues
} from './schemas';

// --- Types ---
type StepId = 'customer' | 'collateral' | 'documents' | 'terms';

// --- Hooks ---
// --- Hooks ---
function useMediaQuery(query: string) {
    const [value, setValue] = useState(false);
    useEffect(() => {
        function onChange(event: MediaQueryListEvent) {
            setValue(event.matches);
        }
        const result = window.matchMedia(query);
        result.addEventListener("change", onChange);
        setValue(result.matches);
        return () => result.removeEventListener("change", onChange);
    }, [query]);
    return value;
}

function useBeforeUnload(shouldWarn: boolean) {
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (shouldWarn) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [shouldWarn]);
}

// --- Main Component ---
export function NewLoanWizardClient({ shopId, existingCustomers }: { shopId: string; existingCustomers: any[] }) {
    const router = useRouter();
    const { toast } = useToast();

    // State
    const [currentStep, setCurrentStep] = useState<StepId>('customer');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showMobileDetails, setShowMobileDetails] = useState(false);

    // Form Data
    const [formData, setFormData] = useState<LoanWizardValues>({
        customer: {
            name: '',
            phone: '',
            isNew: false
        },
        collateral: [],
        terms: {
            loan_number: `LN-${Date.now().toString().slice(-6)}`,
            start_date: new Date(),
            principal_amount: 0,
            interest_rate: 24 // Default 24% (2% monthly)
        },
        documents: []
    });

    const isDirty = useMemo(() => {
        return formData.customer.name !== '' || formData.collateral.length > 0 || formData.terms.principal_amount > 0;
    }, [formData]);

    useBeforeUnload(isDirty && !isSubmitting);

    // Derived State
    const selectedCustomer = useMemo(() => {
        if (!formData.customer.id) return null;
        return existingCustomers.find(c => c.id === formData.customer.id);
    }, [formData.customer.id, existingCustomers]);

    const totalCollateralValue = useMemo(() =>
        formData.collateral.reduce((sum, item) => sum + (item.estimated_value || 0), 0),
        [formData.collateral]);

    const interestPerMonth = (formData.terms.principal_amount * (formData.terms.interest_rate / 12)) / 100;

    // Handlers
    const handleCustomerSelect = (customer: any) => {
        setFormData(prev => ({
            ...prev,
            customer: {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                address: customer.address,
                isNew: false
            }
        }));
    };

    const handleClearCustomer = () => {
        setFormData(prev => ({
            ...prev,
            customer: { name: '', phone: '', isNew: false }
        }));
    };

    const handleAddCollateral = (item: CollateralItemValues) => {
        setFormData(prev => ({
            ...prev,
            collateral: [...prev.collateral, item]
        }));
    };

    const handleRemoveCollateral = (index: number) => {
        setFormData(prev => ({
            ...prev,
            collateral: prev.collateral.filter((_, i) => i !== index)
        }));
    };

    const handleAddDocument = (doc: DocumentValues) => {
        setFormData(prev => ({
            ...prev,
            documents: [...prev.documents, doc]
        }));
    };

    const handleRemoveDocument = (index: number) => {
        setFormData(prev => ({
            ...prev,
            documents: prev.documents.filter((_, i) => i !== index)
        }));
    };

    const handleTermsChange = (updates: Partial<LoanTermsValues>) => {
        setFormData(prev => ({
            ...prev,
            terms: { ...prev.terms, ...updates }
        }));
    };

    const validateStep = (step: StepId): boolean => {
        try {
            if (step === 'customer') {
                if (!formData.customer.name) throw new Error("Customer name is required");
                if (formData.customer.isNew && !formData.customer.phone) throw new Error("Phone number is required for new customers");
            }
            if (step === 'collateral') {
                if (formData.collateral.length === 0) throw new Error("Add at least one collateral item");
            }
            if (step === 'terms') {
                if (formData.terms.principal_amount <= 0) throw new Error("Principal amount must be positive");
            }
            return true;
        } catch (e: any) {
            toast({ title: "Validation Error", description: e.message, variant: "destructive" });
            return false;
        }
    };

    const handleNext = () => {
        if (!validateStep(currentStep)) return;

        if (currentStep === 'customer') setCurrentStep('collateral');
        else if (currentStep === 'collateral') setCurrentStep('documents');
        else if (currentStep === 'documents') setCurrentStep('terms');
        else handleSubmit();
    };

    const handleBack = () => {
        if (currentStep === 'collateral') setCurrentStep('customer');
        else if (currentStep === 'documents') setCurrentStep('collateral');
        else if (currentStep === 'terms') setCurrentStep('documents');
        else router.back();
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // 1. Create customer if new
            let customerId = formData.customer.id;
            if (formData.customer.isNew) {
                const { data: cust, error: custError } = await supabase
                    .from('loan_customers')
                    .insert({
                        shop_id: shopId,
                        name: formData.customer.name,
                        phone: formData.customer.phone,
                        address: formData.customer.address
                    })
                    .select()
                    .single();

                if (custError) throw custError;
                customerId = cust.id;
            }

            // 2. Create Loan via API
            const res = await fetch('/api/v1/loans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shopId,
                    customerId,
                    loanNumber: formData.terms.loan_number,
                    principalAmount: formData.terms.principal_amount,
                    interestRate: formData.terms.interest_rate,
                    startDate: format(formData.terms.start_date, 'yyyy-MM-dd'),
                    collateral: formData.collateral
                })
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed to create loan');

            toast({ title: "Success", description: "Loan created successfully!" });
            router.push(`/shop/${shopId}/loans/${result.id}`);

        } catch (error: any) {
            console.error(error);
            toast({
                title: "Error",
                description: error.message || "Failed to create loan",
                variant: "destructive"
            });
            setIsSubmitting(false);
        }
    };

    // Steps Configuration
    const steps = [
        { id: 'customer', title: 'Customer', icon: User },
        { id: 'collateral', title: 'Collateral', icon: Gem },
        { id: 'documents', title: 'Documents', icon: FileText },
        { id: 'terms', title: 'Terms', icon: Banknote },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === currentStep);

    return (
        <div className="h-full bg-gray-50/50 dark:bg-black/50 flex flex-col lg:flex-row">
            {/* LEFT PANEL - Interactive Form */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header */}
                <header className="flex-none bg-white dark:bg-gray-950 border-b p-3 px-4 flex items-center justify-between z-20">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="lg:hidden -ml-2 text-muted-foreground">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>

                    {/* Centered Step Indicator with larger text */}
                    {/* Simplified Header: Just the Title */}
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <span className="font-bold text-lg">{steps[currentStepIndex].title}</span>
                        <div className="flex gap-1 mt-1">
                            {steps.map((_, idx) => (
                                <div key={idx} className={cn(
                                    "h-1 w-6 rounded-full transition-colors",
                                    idx <= currentStepIndex ? "bg-primary" : "bg-muted"
                                )} />
                            ))}
                        </div>
                    </div>

                    {/* Balanced spacer */}
                    <div className="w-10 flex justify-end">
                        <span className="text-xs text-muted-foreground font-medium whitespace-nowrap hidden sm:block">
                            {currentStepIndex + 1} / 3
                        </span>
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
                    <div className="max-w-xl mx-auto space-y-8 pb-4 lg:pb-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6"
                            >
                                {currentStep === 'customer' && (
                                    <CustomerStep
                                        shopId={shopId}
                                        value={formData.customer}
                                        onChange={val => setFormData(prev => ({ ...prev, customer: val }))}
                                        onSelectFTS={handleCustomerSelect}
                                        onClear={handleClearCustomer}
                                    />
                                )}
                                {currentStep === 'collateral' && (
                                    <CollateralStep
                                        items={formData.collateral}
                                        onAdd={handleAddCollateral}
                                        onRemove={handleRemoveCollateral}
                                    />
                                )}
                                {currentStep === 'documents' && (
                                    <DocumentsStep
                                        items={formData.documents}
                                        onAdd={handleAddDocument}
                                        onRemove={handleRemoveDocument}
                                    />
                                )}
                                {currentStep === 'terms' && (
                                    <TermsStep
                                        value={formData.terms}
                                        onChange={handleTermsChange}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer Navigation (Fixed) */}
                <div className="flex-none bg-white dark:bg-gray-950 border-t z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                    {/* Collapsible Details (Mobile Only) */}
                    <div className="lg:hidden p-4 pb-0">
                        {showMobileDetails && (
                            <div className="space-y-2 text-sm pb-3 animate-in slide-in-from-bottom-2 border-b mb-3">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Total Collateral Value</span>
                                    <span>{formatCurrency(totalCollateralValue)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Principal Amount</span>
                                    <span>{formatCurrency(formData.terms.principal_amount)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Monthly Interest</span>
                                    <span>{formatCurrency(interestPerMonth)}</span>
                                </div>
                            </div>
                        )}

                        <div
                            className="flex justify-between items-center font-bold text-base cursor-pointer select-none mb-4"
                            onClick={() => setShowMobileDetails(!showMobileDetails)}
                        >
                            <div className="flex items-center gap-2">
                                <span>Loan Summary</span>
                                {showMobileDetails ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
                            </div>
                            <div className="text-right text-sm font-normal text-muted-foreground">
                                {formatCurrency(formData.terms.principal_amount)} {/* Show Principal context when collapsed */}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 lg:p-6 pt-0 lg:pt-6">
                        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                disabled={isSubmitting}
                                className="flex-1 lg:flex-none"
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleNext}
                                disabled={isSubmitting}
                                className="flex-1 lg:w-auto min-w-[120px]"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : currentStep === 'terms' ? (
                                    'Create Loan'
                                ) : (
                                    <>
                                        Next Step
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL - Live Receipt Preview (Desktop Only) */}
            <div className="hidden lg:flex w-[400px] xl:w-[450px] bg-white dark:bg-gray-900 border-l flex-col h-full shadow-xl z-20">
                <div className="flex-1 p-8 overflow-y-auto bg-[url('/patterns/paper.png')] bg-repeat">
                    <LiveReceiptPreview
                        data={formData}
                        interestPerMonth={interestPerMonth}
                        totalCollateral={totalCollateralValue}
                        shopId={shopId}
                    />
                </div>
            </div>

            {/* Removed old floating bottom sheet */}
        </div>
    );
}

// --- Sub Components ---

function CustomerStep({
    shopId,
    value,
    onChange,
    onSelectFTS,
    onClear
}: {
    shopId: string;
    value: CustomerValues;
    onChange: (val: CustomerValues) => void;
    onSelectFTS: (c: any) => void;
    onClear: () => void;
}) {
    // If we have a selected customer ID, show read-only card
    if (value.id) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Selected Customer</h2>
                    <Button variant="ghost" size="sm" onClick={onClear}>Change</Button>
                </div>
                <Card className="border-primary/50 bg-primary/5">
                    <CardContent className="p-6">
                        <div className="flex gap-4">
                            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                                <User className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{value.name}</h3>
                                <p className="text-muted-foreground">{value.phone}</p>
                                {value.address && <p className="text-sm text-muted-foreground mt-1">{value.address}</p>}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const [isCreating, setIsCreating] = useState(false);

    if (isCreating) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">New Customer</h2>
                    <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                </div>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input
                            value={value.name}
                            onChange={e => onChange({ ...value, name: e.target.value, isNew: true })}
                            placeholder="e.g. Rahul Kumar"
                            autoFocus
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input
                            value={value.phone}
                            onChange={e => onChange({ ...value, phone: e.target.value, isNew: true })}
                            placeholder="e.g. 9876543210"
                            type="tel"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Address (Optional)</Label>
                        <Textarea
                            value={value.address}
                            onChange={e => onChange({ ...value, address: e.target.value, isNew: true })}
                            placeholder="Enter full address"
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold mb-2">Find Customer</h2>
                <p className="text-muted-foreground mb-6">Search for an existing customer or create a new one.</p>
            </div>

            {/* Added relative and z-20 to fix dropdown being hidden */}
            <Card className="relative z-20 hover:border-primary/50 transition-colors cursor-text" onClick={() => document.getElementById('customer-search')?.focus()}>
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Search Directory</span>
                    </div>
                    <CustomerFTSCombobox
                        shopId={shopId}
                        onSelect={onSelectFTS}
                        placeholder="Type name or phone number..."
                        className="w-full"
                    />
                </CardContent>
            </Card>

            <div className="relative z-10">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-gray-50 dark:bg-black px-2 text-muted-foreground">Or</span>
                </div>
            </div>

            <Button
                variant="outline"
                className="w-full h-14 text-base relative z-10"
                onClick={() => setIsCreating(true)}
            >
                <Plus className="h-5 w-5 mr-2" />
                Create New Customer
            </Button>
        </div>
    );
}

function CollateralStep({ items, onAdd, onRemove }: {
    items: CollateralItemValues[];
    onAdd: (item: CollateralItemValues) => void;
    onRemove: (idx: number) => void;
}) {
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Collateral Items</h2>
                    <p className="text-muted-foreground">Add items being pledged for this loan.</p>
                </div>
                <Badge variant="outline" className="h-8 px-3">{items.length} Items</Badge>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-xl bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Gem className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">No items added</h3>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
                        Add gold, silver, or diamond items to calculate maximum loan eligibility.
                    </p>
                    <Button onClick={() => setIsSheetOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Item
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {items.map((item, idx) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            key={idx}
                        >
                            <Card className="relative group hover:shadow-md transition-all">
                                <CardContent className="p-4 flex items-start gap-4">
                                    <div className={cn(
                                        "p-3 rounded-lg flex-none",
                                        item.item_type === 'gold' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30",
                                        item.item_type === 'silver' && "bg-slate-100 text-slate-700 dark:bg-slate-800",
                                        item.item_type === 'diamond' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30",
                                    )}>
                                        <Gem className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-semibold truncate">{item.item_name}</h4>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 -mt-1 -mr-1 text-muted-foreground hover:text-destructive"
                                                onClick={() => onRemove(idx)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-1 text-sm text-muted-foreground">
                                            <Badge variant="secondary" className="text-xs">{item.purity}</Badge>
                                            <span>{item.gross_weight}g Gross</span>
                                            {item.estimated_value > 0 && (
                                                <span className="font-medium text-foreground ml-auto">
                                                    {formatCurrency(item.estimated_value)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}

                    <Button
                        variant="outline"
                        className="w-full h-12 border-dashed"
                        onClick={() => setIsSheetOpen(true)}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another Item
                    </Button>
                </div>
            )}

            <AddCollateralSheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                onAdd={onAdd}
            />
        </div>
    );
}

function DocumentsStep({ items, onAdd, onRemove }: {
    items: DocumentValues[];
    onAdd: (doc: DocumentValues) => void;
    onRemove: (idx: number) => void;
}) {
    const [name, setName] = useState('');
    const [type, setType] = useState('other');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            onAdd({
                id: Math.random().toString(36).substr(2, 9),
                name: name || file.name,
                type: type,
                file: file,
                previewUrl: URL.createObjectURL(file)
            });
            setName('');
            setType('other');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">Documents</h2>
                <p className="text-muted-foreground">Upload KYC and other related documents.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((doc, idx) => (
                    <Card key={idx} className="relative group">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-none">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{doc.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">{doc.type}</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => onRemove(idx)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}

                <Card className="border-dashed border-2 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <CardContent className="p-0">
                        <label className="flex flex-col items-center justify-center h-full p-6 cursor-pointer">
                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            <span className="text-sm font-medium text-muted-foreground">Click to upload</span>
                            <input
                                type="file"
                                className="hidden"
                                onChange={handleFileChange}
                                accept="image/*,.pdf"
                            />
                        </label>
                    </CardContent>
                </Card>
            </div>

            {/* Simple Input for Name before upload if needed, but keeping it simple for now */}
            <div className="flex gap-2 items-center text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3" />
                <span>Documents are stored locally for this session.</span>
            </div>
        </div>
    );
}

function AddCollateralSheet({ open, onOpenChange, onAdd }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAdd: (item: CollateralItemValues) => void;
}) {
    const [form, setForm] = useState<Partial<CollateralItemValues>>({
        item_type: 'gold',
        purity: '22K',
        gross_weight: 0,
        net_weight: 0,
    });

    // Responsive: Desktop = Dialog, Mobile = Sheet
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const handleSubmit = () => {
        if (!form.item_name || !form.gross_weight) {
            // Simple validation
            return;
        }
        onAdd(form as CollateralItemValues);
        setForm({ item_type: 'gold', purity: '22K', gross_weight: 0, net_weight: 0, estimated_value: 0, item_name: '' });
        onOpenChange(false);
    };

    const content = (
        <ScrollArea className="h-full max-h-[85vh]">
            <div className="p-6 space-y-6">
                <div className="space-y-2">
                    <Label>Item Name</Label>
                    <Input
                        placeholder="e.g. Gold Necklace"
                        value={form.item_name || ''}
                        onChange={e => setForm({ ...form, item_name: e.target.value })}
                        autoFocus
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                            value={form.item_type}
                            onValueChange={(v: any) => setForm({ ...form, item_type: v })}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="gold">Gold</SelectItem>
                                <SelectItem value="silver">Silver</SelectItem>
                                <SelectItem value="diamond">Diamond</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Purity</Label>
                        <Select
                            value={form.purity}
                            onValueChange={v => setForm({ ...form, purity: v })}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="24K">24K (999)</SelectItem>
                                <SelectItem value="22K">22K (916)</SelectItem>
                                <SelectItem value="18K">18K (750)</SelectItem>
                                <SelectItem value="14K">14K (585)</SelectItem>
                                <SelectItem value="Silver">Silver</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Gross Weight (g)</Label>
                        <Input
                            type="number" step="0.01"
                            value={form.gross_weight || ''}
                            onChange={e => {
                                const val = parseFloat(e.target.value);
                                setForm({ ...form, gross_weight: val, net_weight: val }); // Auto set net weight
                            }}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Net Weight (g)</Label>
                        <Input
                            type="number" step="0.01"
                            value={form.net_weight || ''}
                            onChange={e => setForm({ ...form, net_weight: parseFloat(e.target.value) })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Estimated Value (₹)</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                        <Input
                            type="number"
                            className="pl-7"
                            value={form.estimated_value || ''}
                            onChange={e => setForm({ ...form, estimated_value: parseFloat(e.target.value) })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Description / Remarks</Label>
                    <Textarea
                        value={form.description || ''}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        rows={3}
                    />
                </div>

                <div className="pt-4">
                    <Button onClick={handleSubmit} size="lg" className="w-full">
                        Add Item to Loan
                    </Button>
                </div>
            </div>
        </ScrollArea>
    );

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle>Add Collateral Item</DialogTitle>
                    </DialogHeader>
                    {content}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0">
                <SheetHeader className="p-6 pb-2">
                    <SheetTitle>Add Collateral Item</SheetTitle>
                </SheetHeader>
                {content}
            </SheetContent>
        </Sheet>
    );
}

function TermsStep({ value, onChange }: {
    value: LoanTermsValues;
    onChange: (val: Partial<LoanTermsValues>) => void;
}) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">Loan Terms</h2>
                <p className="text-muted-foreground">Configure the financials for this loan.</p>
            </div>

            <Card>
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                        <Label>Loan Number</Label>
                        <Input
                            value={value.loan_number}
                            onChange={e => onChange({ loan_number: e.target.value })}
                            className="font-mono"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Loan Amount (Principal)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
                                <Input
                                    type="number"
                                    className="pl-8 text-lg font-semibold"
                                    value={value.principal_amount || ''}
                                    onChange={e => {
                                        const val = parseFloat(e.target.value);
                                        onChange({ principal_amount: isNaN(val) ? 0 : val });
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Interest Rate (% p.a.)</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={value.interest_rate || ''}
                                    onChange={e => {
                                        const val = parseFloat(e.target.value);
                                        onChange({ interest_rate: isNaN(val) ? 0 : val });
                                    }}
                                    className="pr-12"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                    / year
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground text-right">
                                = {(value.interest_rate / 12).toFixed(2)}% / month
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Disbursement Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {format(value.start_date, "PPP")}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={value.start_date}
                                    onSelect={(date) => date && onChange({ start_date: date })}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardContent>
            </Card>

            <Alert className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-900">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Interest Calculation</AlertTitle>
                <AlertDescription>
                    Monthly interest will be {formatCurrency((value.principal_amount * value.interest_rate / 1200))} based on the entered rate.
                </AlertDescription>
            </Alert>
        </div>
    );
}

function LiveReceiptPreview({ data, interestPerMonth, totalCollateral, shopId }: {
    data: LoanWizardValues;
    interestPerMonth: number;
    totalCollateral: number;
    shopId: string;
}) {
    return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100/50 p-4 overflow-hidden text-zinc-900">
            {/* Scaled A4 Container */}
            <div
                className="w-full bg-white shadow-xl relative flex flex-col"
                style={{
                    aspectRatio: '210/297',
                    maxHeight: '100%' // Ensure it fits vertically if that's the constraint
                }}
            >
                {/* Content - Using explicit pixel/percent padding to scale better than mm */}
                <div className="flex-1 flex flex-col p-6 sm:p-8 font-serif">

                    {/* Header */}
                    <div className="text-center border-b-2 border-zinc-900 pb-2 mb-4">
                        <h1 className="text-xl font-bold uppercase tracking-widest text-zinc-900">Loan Agreement</h1>
                        <p className="text-[10px] uppercase tracking-wide text-zinc-500 font-medium">Official Pledged Receipt</p>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6 text-[11px] leading-tight">
                        <div>
                            <p className="text-[9px] uppercase text-zinc-500 font-bold mb-0.5">Lender</p>
                            <p className="font-bold text-sm truncate">{shopId.slice(0, 8).toUpperCase()}</p>
                            <p className="text-zinc-500">Gold & Finance Loan</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] uppercase text-zinc-500 font-bold mb-0.5">Agreement Date</p>
                            <p className="font-bold">{format(new Date(), 'dd MMM yyyy')}</p>
                            <div className="mt-1">
                                <span className="inline-block bg-zinc-100 text-zinc-600 text-[9px] font-bold px-1.5 py-0.5 rounded border">DRAFT COPY</span>
                            </div>
                        </div>
                    </div>

                    {/* Borrower Box */}
                    <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-sm mb-4">
                        <p className="text-[9px] uppercase text-zinc-400 font-bold mb-2 tracking-wider">Borrower Details</p>
                        {data.customer.name ? (
                            <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-[11px]">
                                <span className="text-zinc-500">Name:</span>
                                <span className="font-bold text-right truncate">{data.customer.name}</span>

                                <span className="text-zinc-500">Phone:</span>
                                <span className="font-mono text-right">{data.customer.phone}</span>

                                {data.customer.address && (
                                    <>
                                        <span className="text-zinc-500">Address:</span>
                                        <span className="text-right truncate max-w-[150px]">{data.customer.address}</span>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-2 text-zinc-400 italic text-[10px]">-- No customer selected --</div>
                        )}
                    </div>

                    {/* Items Table */}
                    <div className="flex-1 min-h-0 flex flex-col">
                        <div className="flex justify-between items-end mb-1 border-b border-black pb-1">
                            <p className="text-[10px] uppercase font-bold text-zinc-900">Pledged Items</p>
                            <span className="text-[10px] font-medium text-zinc-500">{data.collateral.length} Items</span>
                        </div>

                        <div className="relative flex-1">
                            <table className="w-full text-[10px] text-left border-collapse">
                                <thead>
                                    <tr className="text-zinc-500 border-b border-zinc-200">
                                        <th className="py-1.5 font-medium w-8">#</th>
                                        <th className="py-1.5 font-medium">Description</th>
                                        <th className="py-1.5 font-medium text-right">Net Wt</th>
                                        <th className="py-1.5 font-medium text-right">Valuation</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {data.collateral.length > 0 ? (
                                        data.collateral.map((item, i) => (
                                            <tr key={i}>
                                                <td className="py-1.5 text-zinc-400 px-0.5">{i + 1}</td>
                                                <td className="py-1.5">
                                                    <span className="font-semibold text-zinc-900 block truncate max-w-[120px]">{item.item_name}</span>
                                                    <span className="text-[9px] text-zinc-500">{item.purity} Gold</span>
                                                </td>
                                                <td className="py-1.5 text-right font-mono">{item.gross_weight}g</td>
                                                <td className="py-1.5 text-right font-mono">{formatCurrency(item.estimated_value)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="py-12 text-center text-zinc-300 italic">No collateral items added</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals Row */}
                        {data.collateral.length > 0 && (
                            <div className="flex justify-between items-center py-2 border-t border-zinc-200 mt-auto bg-zinc-50 px-2 -mx-2">
                                <span className="text-[10px] font-bold text-zinc-600">Total Valuation</span>
                                <span className="text-xs font-bold font-mono">{formatCurrency(totalCollateral)}</span>
                            </div>
                        )}
                    </div>

                    {/* Financial Footer */}
                    <div className="mt-4 border-2 border-zinc-900 p-3 bg-zinc-50/50">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="text-[9px] uppercase text-zinc-500 font-bold mb-0.5">Principal Loan Amount</p>
                                <p className="text-xl font-bold font-mono tracking-tight">{formatCurrency(data.terms.principal_amount)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] uppercase text-zinc-500 font-bold mb-0.5">Monthly Interest</p>
                                <p className="text-sm font-semibold">{data.terms.interest_rate}% p.a.</p>
                                <p className="text-[10px] text-zinc-500">~{formatCurrency(interestPerMonth)}/mo</p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-end pt-2 border-t border-zinc-200 border-dashed">
                            <div className="flex-1">
                                <div className="h-8 border-b border-zinc-300"></div>
                                <p className="text-[9px] text-zinc-400 mt-0.5 text-center uppercase">Borrower Signature</p>
                            </div>
                            <div className="flex-1">
                                <div className="h-8 border-b border-zinc-300 relative">
                                    <div className="absolute inset-0 flex items-end justify-center opacity-10">
                                        <span className="font-serif italic text-xs">For Shop Owner</span>
                                    </div>
                                </div>
                                <p className="text-[9px] text-zinc-400 mt-0.5 text-center uppercase">Authorized Signatory</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-zinc-100 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-zinc-100 to-transparent pointer-events-none" />
            </div>
        </div>
    );
}