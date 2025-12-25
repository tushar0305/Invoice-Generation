'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createLoanAction } from '@/actions/loan-actions';
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
    Paperclip,
    ArrowLeft
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
import { format, addMonths } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { CustomerFTSCombobox } from '@/components/search/customer-fts-combobox';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoanSummary } from './loan-summary';

// Import our schemas (assuming they are in schemas.ts)
import {
    loanWizardSchema,
    type LoanWizardValues,
    type CustomerValues,
    type CollateralItemValues,
    type DocumentValues,
    type LoanTermsValues
} from './schemas';

export function NewLoanWizardClient({ shopId, existingCustomers }: { shopId: string; existingCustomers: any[] }) {
    const router = useRouter();
    const { toast } = useToast();

    // State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showMobileDetails, setShowMobileDetails] = useState(false);
    const [showClearConfirmation, setShowClearConfirmation] = useState(false);

    // Form Data
    const form = useForm<LoanWizardValues>({
        resolver: zodResolver(loanWizardSchema),
        defaultValues: {
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
                interest_rate: 24, // Default 24% (2% monthly)
                repayment_type: 'interest_only',
                tenure_months: 12,
            },
            documents: []
        }
    });

    // --- Offline Drafts ---
    const DRAFT_KEY = useMemo(() => shopId ? `LOAN_DRAFT_${shopId}` : null, [shopId]);

    // Save draft on form change
    useEffect(() => {
        if (!DRAFT_KEY) return;

        const subscription = form.watch((value) => {
            // Debounce save to avoid performance hit
            const handler = setTimeout(() => {
                localStorage.setItem(DRAFT_KEY, JSON.stringify(value));
            }, 1000);
            return () => clearTimeout(handler);
        });
        return () => subscription.unsubscribe();
    }, [form, DRAFT_KEY]);

    // Restore draft on mount
    useEffect(() => {
        if (!DRAFT_KEY) return;

        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Check if draft has meaningful data
                if (parsed.customer?.name || parsed.collateral?.length > 0 || parsed.terms?.principal_amount > 0) {
                    // Convert date strings back to Date objects
                    if (parsed.terms?.start_date) {
                        parsed.terms.start_date = new Date(parsed.terms.start_date);
                    }
                    form.reset(parsed);
                    toast({
                        title: "Draft Restored",
                        description: "We restored your unsaved loan details.",
                        duration: 3000
                    });
                }
            } catch (e) {
                console.error("Failed to parse draft", e);
            }
        }
    }, [DRAFT_KEY, form, toast]);

    const formData = form.watch();

    const isDirty = useMemo(() => {
        return formData.customer.name !== '' || formData.collateral.length > 0 || formData.terms.principal_amount > 0;
    }, [formData]);

    useBeforeUnload(isDirty && !isSubmitting);

    // Derived State
    const totalCollateralValue = useMemo(() =>
        formData.collateral.reduce((sum, item) => sum + (item.estimated_value || 0), 0),
        [formData.collateral]);

    const interestPerMonth = (formData.terms.principal_amount * (formData.terms.interest_rate / 12)) / 100;

    // Handlers
    const handleCustomerSelect = (customer: any) => {
        form.setValue('customer', {
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            address: customer.address,
            isNew: false
        }, { shouldValidate: true });
    };

    const handleClearCustomer = () => {
        form.setValue('customer', { name: '', phone: '', isNew: false });
    };

    const handleAddCollateral = (item: CollateralItemValues) => {
        form.setValue('collateral', [...formData.collateral, item], { shouldValidate: true });
    };

    const handleRemoveCollateral = (index: number) => {
        form.setValue('collateral', formData.collateral.filter((_, i) => i !== index), { shouldValidate: true });
    };

    const handleAddDocument = (doc: DocumentValues) => {
        form.setValue('documents', [...formData.documents, doc]);
    };

    const handleRemoveDocument = (index: number) => {
        form.setValue('documents', formData.documents.filter((_, i) => i !== index));
    };

    const handleTermsChange = (updates: Partial<LoanTermsValues>) => {
        form.setValue('terms', { ...formData.terms, ...updates }, { shouldValidate: true });
    };

    const onSubmit = async (data: LoanWizardValues) => {
        setIsSubmitting(true);
        try {
            // 1. Upload Documents in Parallel
            const uploadedDocs = await Promise.all(data.documents.map(async (doc) => {
                if (doc.file) {
                    if (doc.file.size > 5 * 1024 * 1024) {
                        throw new Error(`File ${doc.name} exceeds the 5MB limit`);
                    }

                    const fileExt = doc.file.name.split('.').pop();
                    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
                    const filePath = `${shopId}/${data.terms.loan_number}/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('loans')
                        .upload(filePath, doc.file);

                    if (uploadError) {
                        throw new Error(`Failed to upload ${doc.name}: ${uploadError.message}`);
                    }

                    return {
                        name: doc.name,
                        type: doc.type,
                        url: filePath
                    };
                }
                return { name: doc.name, type: doc.type, url: doc.previewUrl || '' };
            }));

            // 2. Call Server Action
            const payload = {
                shopId,
                customerId: data.customer.id,
                customer: data.customer,
                loanNumber: data.terms.loan_number,
                principalAmount: data.terms.principal_amount,
                interestRate: data.terms.interest_rate,
                repaymentType: data.terms.repayment_type,
                tenureMonths: data.terms.tenure_months,
                emiAmount: data.terms.emi_amount,
                startDate: format(data.terms.start_date, 'yyyy-MM-dd'),
                collateral: data.collateral,
                documents: uploadedDocs
            };

            const formData = new FormData();
            formData.append('data', JSON.stringify(payload));

            const result = await createLoanAction({}, formData);

            if (result.error) {
                if (result.validationErrors) {
                    Object.entries(result.validationErrors).forEach(([key, errors]) => {
                        toast({ title: "Validation Error", description: `${key}: ${errors.join(', ')}`, variant: "destructive" });
                    });
                } else {
                    throw new Error(result.error);
                }
                return;
            }

            toast({ title: "Success", description: "Loan created successfully!" });
            if (DRAFT_KEY) localStorage.removeItem(DRAFT_KEY);
            router.push(`/shop/${shopId}/loans/${result.loanId}`);

        } catch (error: any) {
            console.error(error);
            toast({
                title: "Error",
                description: error.message || "Failed to create loan",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const onError = (errors: any) => {
        console.error("Validation Errors:", JSON.stringify(errors, null, 2));
        
        // Helper to find the first error message recursively
        const getFirstErrorMessage = (errorObj: any): string | null => {
            if (!errorObj) return null;
            if (typeof errorObj.message === 'string') return errorObj.message;
            
            // If it's an array (like items), iterate
            if (Array.isArray(errorObj)) {
                for (const item of errorObj) {
                    const msg = getFirstErrorMessage(item);
                    if (msg) return msg;
                }
            }
            
            // If it's an object, iterate values
            if (typeof errorObj === 'object') {
                for (const key in errorObj) {
                    const msg = getFirstErrorMessage(errorObj[key]);
                    if (msg) return msg;
                }
            }
            
            return null;
        };

        const message = getFirstErrorMessage(errors) || "Please check the form for missing or invalid fields.";

        toast({
            title: "Validation Error",
            description: message,
            variant: "destructive",
        });
    };

    return (
        <div className="min-h-screen flex flex-col lg:block">

            {/* 1. Header */}
            <div className="flex-none p-4 py-3 bg-background border-b z-50 sticky top-0 lg:static lg:p-0 lg:border-none lg:mb-4 lg:bg-transparent">
                <div className="container mx-auto px-0 max-w-6xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 -ml-2 pl-0 hover:bg-transparent lg:hover:bg-accent lg:pl-4">
                            <ArrowLeft className="h-4 w-4" /> Back
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowClearConfirmation(true)}
                            className="text-muted-foreground hover:text-destructive"
                        >
                            Clear
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col lg:flex-none lg:block container mx-auto px-0 lg:px-4 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-6">

                    {/* LEFT COLUMN: FORM */}
                    <div className="flex flex-col">
                        <div className="px-4 lg:px-1 space-y-6 pb-24 lg:pb-0">
                            {/* 1. Customer Section */}
                            <Card className="border-2 shadow-sm">
                                <CardHeader className="pb-3 border-b bg-gray-50/50 dark:bg-gray-900/20">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <User className="h-4 w-4 text-primary" /> Customer Search
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 lg:p-6">
                                    <CustomerStep
                                        shopId={shopId}
                                        value={formData.customer}
                                        onChange={val => form.setValue('customer', val, { shouldValidate: true })}
                                        onSelectFTS={handleCustomerSelect}
                                        onClear={handleClearCustomer}
                                    />
                                </CardContent>
                            </Card>

                            {/* 2. Collateral Section */}
                            <Card className="border-2 shadow-sm">
                                <CardHeader className="pb-3 border-b bg-gray-50/50 dark:bg-gray-900/20">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Gem className="h-4 w-4 text-primary" /> Collateral Items
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 lg:p-6">
                                    <CollateralStep
                                        items={formData.collateral}
                                        onAdd={handleAddCollateral}
                                        onRemove={handleRemoveCollateral}
                                    />
                                </CardContent>
                            </Card>

                            {/* 3. Documents Section */}
                            <Card className="border-2 shadow-sm">
                                <CardHeader className="pb-3 border-b bg-gray-50/50 dark:bg-gray-900/20">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <FileText className="h-4 w-4 text-primary" /> Documents <span className="text-xs font-normal text-muted-foreground ml-2">(Optional)</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 lg:p-6">
                                    <DocumentsStep
                                        items={formData.documents}
                                        onAdd={handleAddDocument}
                                        onRemove={handleRemoveDocument}
                                    />
                                </CardContent>
                            </Card>

                            {/* 4. Loan Terms Section */}
                            <Card className="border-2 shadow-sm">
                                <CardHeader className="pb-3 border-b bg-gray-50/50 dark:bg-gray-900/20">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Banknote className="h-4 w-4 text-primary" /> Loan Terms
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 lg:p-6">
                                    <TermsStep
                                        value={formData.terms}
                                        onChange={handleTermsChange}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: SUMMARY (Desktop) - Sticky */}
                    <div className="hidden lg:block sticky top-6 h-fit">
                        <LoanSummary
                            principal={formData.terms.principal_amount}
                            interestRate={formData.terms.interest_rate}
                            interestPerMonth={interestPerMonth}
                            repaymentType={formData.terms.repayment_type}
                            tenureMonths={formData.terms.tenure_months}
                            emiAmount={formData.terms.emi_amount}
                            totalCollateralValue={totalCollateralValue}
                            totalItems={formData.collateral.length}
                            startDate={formData.terms.start_date}
                            isSubmitting={isSubmitting}
                            onSave={form.handleSubmit(onSubmit, onError)}
                            onCancel={() => router.back()}
                        />
                    </div>
                </div>
            </div>

            {/* Footer Actions (Mobile Only) */}
            <div className="flex-none lg:hidden border-t bg-background p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20 sticky bottom-0">
                <div className="space-y-3">

                    {showMobileDetails && (
                        <div className="space-y-2 text-sm pb-2 animate-in slide-in-from-bottom-2">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Collateral Value</span>
                                <span>{formatCurrency(totalCollateralValue)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Interest Rate</span>
                                <span>{formData.terms.interest_rate}% p.a.</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Monthly Interest</span>
                                <span>{formatCurrency(interestPerMonth)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Start Date</span>
                                <span>{format(formData.terms.start_date, 'dd MMM yyyy')}</span>
                            </div>
                        </div>
                    )}

                    <div
                        className="flex justify-between items-center cursor-pointer select-none"
                        onClick={() => setShowMobileDetails(!showMobileDetails)}
                    >
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="text-xs font-medium uppercase">Loan Amount</span>
                            {showMobileDetails ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                        </div>
                        <span className="font-bold text-xl">{formatCurrency(formData.terms.principal_amount)}</span>
                    </div>

                    <Button
                        onClick={form.handleSubmit(onSubmit, onError)}
                        disabled={isSubmitting}
                        className="w-full h-12 text-base font-semibold shadow-md"
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        ) : (
                            <CheckCircle2 className="h-5 w-5 mr-2" />
                        )}
                        Create Loan
                    </Button>
                </div>
            </div>

            {/* Clear Form Confirmation Modal */}
            <AlertDialog open={showClearConfirmation} onOpenChange={setShowClearConfirmation}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Clear Loan Form?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to clear the form? This will discard all customer and loan details. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                form.reset({
                                    customer: { name: '', phone: '', isNew: false },
                                    collateral: [],
                                    terms: {
                                        loan_number: `LN-${Date.now().toString().slice(-6)}`,
                                        start_date: new Date(),
                                        principal_amount: 0,
                                        interest_rate: 24,
                                        repayment_type: 'interest_only',
                                        tenure_months: 12,
                                    },
                                    documents: []
                                });
                                if (DRAFT_KEY) localStorage.removeItem(DRAFT_KEY);
                                toast({ title: 'Form Cleared', description: 'Started a new loan application.' });
                                setShowClearConfirmation(false);
                            }}
                        >
                            Clear Form
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// Reuse existing hooks
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

// --- Simplified Component Sections ---
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
    if (value.id) {
        return (
            <div className="flex items-center justify-between bg-primary/5 p-4 rounded-lg border border-primary/20">
                <div className="flex gap-4 items-center">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-base">{value.name}</h3>
                        <p className="text-sm text-muted-foreground">{value.phone}</p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground hover:text-destructive">
                    Change
                </Button>
            </div>
        );
    }

    const [isCreating, setIsCreating] = useState(false);

    if (isCreating) {
        return (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">New Customer Details</h3>
                    <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>Cancel</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="space-y-2 col-span-full">
                        <Label>Address (Optional)</Label>
                        <Textarea
                            value={value.address}
                            onChange={e => onChange({ ...value, address: e.target.value, isNew: true })}
                            placeholder="Enter full address"
                            rows={2}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <CustomerFTSCombobox
                shopId={shopId}
                onSelect={onSelectFTS}
                placeholder="Type name or phone number..."
                className="w-full"
            />

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-gray-950 px-2 text-muted-foreground">Or</span>
                </div>
            </div>

            <Button
                variant="outline"
                className="w-full border-dashed"
                onClick={() => setIsCreating(true)}
            >
                <Plus className="h-4 w-4 mr-2" />
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
        <div className="space-y-4">
            {items.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed rounded-lg bg-gray-50/50 dark:bg-gray-900/50">
                    <p className="text-muted-foreground text-sm mb-4">No items added yet</p>
                    <Button variant="secondary" size="sm" onClick={() => setIsSheetOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Add Item
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group">
                            <div className="flex gap-3 items-center">
                                <div className={cn(
                                    "p-2 rounded-md",
                                    item.item_type === 'gold' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30",
                                    item.item_type === 'silver' && "bg-slate-100 text-slate-700 dark:bg-slate-800",
                                    item.item_type === 'diamond' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30",
                                )}>
                                    <Gem className="h-4 w-4" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-sm">{item.item_name}</h4>
                                    <div className="flex gap-2 text-xs text-muted-foreground">
                                        <span>{item.gross_weight}g</span>
                                        <span>•</span>
                                        <span>{item.purity}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {item.estimated_value > 0 && (
                                    <span className="font-medium text-sm">{formatCurrency(item.estimated_value)}</span>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => onRemove(idx)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full border border-dashed"
                        onClick={() => setIsSheetOpen(true)}
                    >
                        <Plus className="h-3 w-3 mr-2" /> Add Another Item
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
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 rounded-lg border bg-card">
                        <div className="h-8 w-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{doc.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{doc.type}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => onRemove(idx)}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                ))}

                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer">
                    <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs font-medium text-muted-foreground">Upload Document</span>
                    <input
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                    />
                </label>
            </div>
        </div>
    );
}

function TermsStep({ value, onChange }: {
    value: LoanTermsValues;
    onChange: (val: Partial<LoanTermsValues>) => void;
}) {
    // Calculate EMI helper
    const calculateEMI = (principal: number, rate: number, months: number) => {
        if (!principal || !rate || !months) return 0;
        const r = rate / 12 / 100;
        const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
        return Math.round(emi);
    };

    // Update EMI when relevant fields change
    useEffect(() => {
        if (value.repayment_type === 'emi' && value.principal_amount && value.interest_rate && value.tenure_months) {
            const emi = calculateEMI(value.principal_amount, value.interest_rate, value.tenure_months);
            if (emi !== value.emi_amount) {
                onChange({ emi_amount: emi });
            }
        }
    }, [value.principal_amount, value.interest_rate, value.tenure_months, value.repayment_type]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Loan Number</Label>
                    <Input
                        value={value.loan_number}
                        onChange={e => onChange({ loan_number: e.target.value })}
                        placeholder="LN-XXXXXX"
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
                                    !value.start_date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {value.start_date ? format(value.start_date, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={value.start_date}
                                onSelect={(date) => date && onChange({ start_date: date })}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Repayment Type</Label>
                <div className="grid grid-cols-3 gap-2">
                    <div
                        onClick={() => onChange({ repayment_type: 'interest_only' })}
                        className={cn(
                            "cursor-pointer rounded-lg border-2 p-3 text-center transition-all hover:border-primary/50",
                            value.repayment_type === 'interest_only'
                                ? "border-primary bg-primary/5"
                                : "border-muted bg-transparent"
                        )}
                    >
                        <div className="font-semibold text-sm">Interest Only</div>
                        <div className="text-xs text-muted-foreground mt-1">Pay interest monthly, principal at end</div>
                    </div>
                    <div
                        onClick={() => onChange({ repayment_type: 'emi' })}
                        className={cn(
                            "cursor-pointer rounded-lg border-2 p-3 text-center transition-all hover:border-primary/50",
                            value.repayment_type === 'emi'
                                ? "border-primary bg-primary/5"
                                : "border-muted bg-transparent"
                        )}
                    >
                        <div className="font-semibold text-sm">EMI</div>
                        <div className="text-xs text-muted-foreground mt-1">Fixed monthly payments (Principal + Interest)</div>
                    </div>
                    <div
                        onClick={() => onChange({ repayment_type: 'bullet' })}
                        className={cn(
                            "cursor-pointer rounded-lg border-2 p-3 text-center transition-all hover:border-primary/50",
                            value.repayment_type === 'bullet'
                                ? "border-primary bg-primary/5"
                                : "border-muted bg-transparent"
                        )}
                    >
                        <div className="font-semibold text-sm">One Time (Bullet)</div>
                        <div className="text-xs text-muted-foreground mt-1">Pay full amount + interest at end</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Principal Amount (₹)</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                        <Input
                            type="number"
                            min="0"
                            className="pl-7 font-bold text-lg"
                            value={value.principal_amount || ''}
                            onChange={e => onChange({ principal_amount: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Interest Rate (% Monthly)</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-24"
                            value={value.interest_rate > 0 ? Number((value.interest_rate / 12).toFixed(2)) : ''}
                            onChange={e => {
                                const monthly = parseFloat(e.target.value);
                                if (isNaN(monthly)) {
                                    onChange({ interest_rate: 0 });
                                } else {
                                    const yearly = parseFloat((monthly * 12).toFixed(2));
                                    onChange({ interest_rate: yearly });
                                }
                            }}
                        />
                        <span className="text-sm text-muted-foreground">% / month</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                            ({value.interest_rate.toFixed(2)}% yearly)
                        </span>
                    </div>
                </div>
            </div>

            {(value.repayment_type === 'emi' || value.repayment_type === 'bullet') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-2">
                        <Label>Tenure (Months)</Label>
                        <Input
                            type="number"
                            min="1"
                            value={value.tenure_months || ''}
                            onChange={e => onChange({ tenure_months: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Due Date</Label>
                        <div className="h-10 px-3 py-2 rounded-md border bg-muted/50 text-sm flex items-center">
                            {value.start_date && value.tenure_months
                                ? format(addMonths(value.start_date, value.tenure_months), 'dd MMM yyyy')
                                : '-'}
                        </div>
                    </div>
                </div>
            )}

            {value.repayment_type === 'emi' && value.emi_amount && (
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 animate-in fade-in">
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-primary">Monthly EMI Amount</span>
                        <span className="text-xl font-bold text-primary">{formatCurrency(value.emi_amount)}</span>
                    </div>
                </div>
            )}
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

    const isDesktop = useMediaQuery("(min-width: 768px)");

    const handleSubmit = () => {
        if (!form.item_name || !form.gross_weight) {
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
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
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
                            onValueChange={(v) => setForm({ ...form, purity: v })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="24K">24K (99.9%)</SelectItem>
                                <SelectItem value="22K">22K (91.6%)</SelectItem>
                                <SelectItem value="18K">18K (75.0%)</SelectItem>
                                <SelectItem value="14K">14K (58.3%)</SelectItem>
                                <SelectItem value="Silver 999">Silver 999</SelectItem>
                                <SelectItem value="Silver 925">Silver 925</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Gross Wt (g)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={form.gross_weight || ''}
                            onChange={e => setForm({ ...form, gross_weight: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Net Wt (g)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={form.net_weight || ''}
                            onChange={e => setForm({ ...form, net_weight: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Estimated Value (₹) <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                    <Input
                        type="number"
                        value={form.estimated_value || ''}
                        onChange={e => setForm({ ...form, estimated_value: parseFloat(e.target.value) || 0 })}
                    />
                </div>

                <div className="pt-4">
                    <Button onClick={handleSubmit} className="w-full">Add Item</Button>
                </div>
            </div>
        </ScrollArea>
    );

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle>Add Collateral</DialogTitle>
                    </DialogHeader>
                    {content}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="p-0 h-[85vh] rounded-t-xl">
                <SheetHeader className="p-6 pb-0 text-left">
                    <SheetTitle>Add Collateral</SheetTitle>
                </SheetHeader>
                {content}
            </SheetContent>
        </Sheet>
    );
}