'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import {
    ArrowLeft,
    Search,
    UserPlus,
    CheckCircle2,
    ArrowUpRight,
    ArrowDownLeft,
    Calendar as CalendarIcon,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn, formatCurrency } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type NewKhataTransactionClientProps = {
    shopId: string;
    existingCustomers: { id: string; name: string; phone?: string | null; total_spent?: number }[];
};

export function NewKhataTransactionClient({ shopId, existingCustomers }: NewKhataTransactionClientProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    // State
    const [step, setStep] = useState<'customer' | 'details'>('customer');
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [isNewCustomer, setIsNewCustomer] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');

    // New Customer Form
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone: '',
        address: ''
    });

    // Transaction Form
    const [transaction, setTransaction] = useState({
        type: 'given' as 'given' | 'received', // given = credit (You gave goods/money), received = debit (You got money)
        amount: '',
        description: '',
        date: new Date()
    });

    const filteredCustomers = existingCustomers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.phone && c.phone.includes(customerSearch))
    );

    const handleSubmit = () => {
        if (!transaction.amount || parseFloat(transaction.amount) <= 0) {
            toast({ title: "Invalid Amount", description: "Please enter a valid amount", variant: "destructive" });
            return;
        }

        startTransition(async () => {
            try {
                let customerId = selectedCustomerId;

                // 1. Create Customer if new
                if (isNewCustomer) {
                    if (!newCustomer.name) {
                        toast({ title: "Invalid Name", description: "Customer name is required", variant: "destructive" });
                        return;
                    }

                    // Check if customer with phone already exists
                    if (newCustomer.phone) {
                        const { data: existingCustomer } = await supabase
                            .from('customers')
                            .select('id, name')
                            .eq('shop_id', shopId)
                            .eq('phone', newCustomer.phone)
                            .single();

                        if (existingCustomer) {
                            customerId = existingCustomer.id;
                            toast({
                                title: "Customer Exists",
                                description: `Using existing customer: ${existingCustomer.name}`,
                            });
                        }
                    }

                    // If not found, create new
                    if (!customerId) {
                        // Use RPC
                        const { data: customerIdRaw, error: customerError } = await supabase.rpc('create_customer', {
                            p_shop_id: shopId,
                            p_name: newCustomer.name,
                            p_phone: newCustomer.phone || null,
                            p_email: null,
                            p_address: newCustomer.address || null,
                            p_state: null,
                            p_pincode: null,
                            p_gst_number: null
                        });

                        if (customerError) throw customerError;

                        const customerData = customerIdRaw as any;
                        customerId = customerData.id;
                    }
                }

                if (!customerId) throw new Error("No customer selected");

                // 2. Create Transaction using RPC
                const { error: txError } = await supabase.rpc('add_ledger_transaction', {
                    p_shop_id: shopId,
                    p_customer_id: customerId,
                    p_amount: parseFloat(transaction.amount),
                    p_transaction_type: transaction.type === 'given' ? 'INVOICE' : 'PAYMENT',
                    p_entry_type: transaction.type === 'given' ? 'DEBIT' : 'CREDIT',
                    p_description: transaction.description || null,
                    p_date: transaction.date.toISOString()
                });

                if (txError) throw txError;

                toast({
                    title: "Success",
                    description: "Transaction recorded successfully"
                });

                router.push(`/shop/${shopId}/khata`);
                router.refresh();

            } catch (error: any) {
                console.error('Error recording khata:', error);
                toast({
                    title: "Error",
                    description: error.message || "Failed to record transaction",
                    variant: "destructive"
                });
            }
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black pb-24">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 px-4 py-3 flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => step === 'details' ? setStep('customer') : router.back()} className="-ml-2 rounded-full">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                        Record Transaction
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        {step === 'customer' ? 'Select Customer' : 'Enter Details'}
                    </p>
                </div>
            </div>

            <div className="p-4 max-w-md mx-auto">
                <AnimatePresence mode="wait">
                    {step === 'customer' ? (
                        <motion.div
                            key="customer"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
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
                                                onClick={() => {
                                                    setSelectedCustomerId(customer.id);
                                                    setStep('details');
                                                }}
                                                className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 active:scale-[0.98] transition-transform cursor-pointer"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-semibold">{customer.name}</p>
                                                        <p className="text-sm text-muted-foreground">{customer.phone}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {/* We don't have balance here easily without calculation, so just show name */}
                                                            Customer
                                                        </p>
                                                    </div>
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
                                        <Button
                                            className="w-full"
                                            onClick={() => {
                                                if (newCustomer.name) setStep('details');
                                                else toast({ title: "Name Required", variant: "destructive" });
                                            }}
                                        >
                                            Continue
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="details"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            <Card className="border-none shadow-sm bg-white dark:bg-gray-900">
                                <CardContent className="p-4">
                                    <div className="text-center mb-6">
                                        <p className="text-sm text-muted-foreground">Transaction with</p>
                                        <h2 className="text-xl font-bold">
                                            {isNewCustomer ? newCustomer.name : existingCustomers.find(c => c.id === selectedCustomerId)?.name}
                                        </h2>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <button
                                            onClick={() => setTransaction({ ...transaction, type: 'given' })}
                                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${transaction.type === 'given'
                                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                                : 'border-gray-200 dark:border-gray-800 opacity-60'
                                                }`}
                                        >
                                            <ArrowUpRight className="w-6 h-6" />
                                            <span className="font-bold">You Gave</span>
                                            <span className="text-xs">(Credit)</span>
                                        </button>
                                        <button
                                            onClick={() => setTransaction({ ...transaction, type: 'received' })}
                                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${transaction.type === 'received'
                                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                                : 'border-gray-200 dark:border-gray-800 opacity-60'
                                                }`}
                                        >
                                            <ArrowDownLeft className="w-6 h-6" />
                                            <span className="font-bold">You Got</span>
                                            <span className="text-xs">(Payment)</span>
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Amount (₹)</Label>
                                            <Input
                                                type="number"
                                                className="text-3xl font-bold h-16 text-center"
                                                placeholder="0"
                                                value={transaction.amount}
                                                onChange={(e) => setTransaction({ ...transaction, amount: e.target.value })}
                                                autoFocus
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Date</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal",
                                                            !transaction.date && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {transaction.date ? format(transaction.date, "PPP") : <span>Pick a date</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar
                                                        mode="single"
                                                        selected={transaction.date}
                                                        onSelect={(date) => date && setTransaction({ ...transaction, date })}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Description (Optional)</Label>
                                            <Textarea
                                                placeholder="e.g. Bill payment, Advance..."
                                                value={transaction.description}
                                                onChange={(e) => setTransaction({ ...transaction, description: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Button
                                className={`w-full h-12 text-lg font-bold shadow-lg ${transaction.type === 'given'
                                    ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                                    : 'bg-green-600 hover:bg-green-700 shadow-green-500/20'
                                    }`}
                                onClick={handleSubmit}
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        Save Transaction
                                    </>
                                )}
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
