'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import { format, addMonths, isAfter } from 'date-fns';
import {
    ArrowLeft,
    Calendar,
    CreditCard,
    DollarSign,
    FileText,
    Gem,
    MoreVertical,
    Printer,
    User,
    Plus,
    Lock,
    AlertCircle,
    Wallet
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import type { Loan, LoanCollateral, LoanPayment, LoanCustomer } from '@/lib/loan-types';
import { createRoot } from 'react-dom/client';
import { LoanPdfTemplate } from '@/components/loan-pdf-template';

type LoanDetailsClientProps = {
    shopId: string;
    loan: Loan & {
        customer: LoanCustomer;
        collateral: LoanCollateral[];
        payments: LoanPayment[];
    };
    currentUser: any;
    shopDetails: any;
};

export function LoanDetailsClient({ shopId, loan, currentUser, shopDetails }: LoanDetailsClientProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
    const [isCloseLoanOpen, setIsCloseLoanOpen] = useState(false);
    const [isSubmittingClose, setIsSubmittingClose] = useState(false);

    // Payment Form State
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentType, setPaymentType] = useState<'principal' | 'interest' | 'full_settlement'>('interest');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'bank_transfer'>('cash');
    const [paymentNotes, setPaymentNotes] = useState('');

    // Close Loan Form State
    const [settlementAmount, setSettlementAmount] = useState('');
    const [settlementNotes, setSettlementNotes] = useState('');
    const [collateralConfirmed, setCollateralConfirmed] = useState(false);

    // Helpers
    const getMonthlyInterest = (principal: number, rate: number) => {
        return (principal * rate) / 1200;
    };

    const getNextDueDate = (startDateStr: string) => {
        const start = new Date(startDateStr);
        const today = new Date();
        let due = new Date(today.getFullYear(), today.getMonth(), start.getDate());

        if (isAfter(today, due)) {
            due = addMonths(due, 1);
        }
        return due;
    };

    const handlePrint = () => {
        // Create a hidden iframe
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) return;

        // Write the content
        doc.open();
        doc.write('<!DOCTYPE html><html><head><title>Loan Agreement</title>');

        // Add Tailwind CDN for styling in the iframe (simplest way for dynamic content)
        doc.write('<script src="https://cdn.tailwindcss.com"></script>');
        doc.write('<style>@media print { body { -webkit-print-color-adjust: exact; } }</style>');

        doc.write('</head><body><div id="print-root"></div></body></html>');
        doc.close();

        // Wait for the DOM to be ready
        setTimeout(() => {
            // Ensure the element exists before rendering
            const printRoot = doc.getElementById('print-root');
            if (!printRoot) {
                console.error('Print root element not found');
                document.body.removeChild(iframe);
                return;
            }

            // Render the React component into the iframe
            const root = createRoot(printRoot);
            root.render(
                <LoanPdfTemplate
                    loan={loan}
                    customer={loan.customer}
                    collateral={loan.collateral}
                    shopDetails={shopDetails}
                />
            );

            // Wait for content and styles to load then print
            setTimeout(() => {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
                // Cleanup after print dialog closes (or a reasonable timeout)
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 1000);
            }, 1000);
        }, 100);
    };

    const generateEMISchedule = () => {
        if (loan.repayment_type !== 'emi' || !loan.emi_amount || !loan.tenure_months) return [];

        const schedule = [];
        let balance = loan.principal_amount;
        let currentDate = new Date(loan.start_date);

        for (let i = 1; i <= loan.tenure_months; i++) {
            currentDate = addMonths(currentDate, 1);
            const interest = (balance * loan.interest_rate) / 100;
            const principalComponent = loan.emi_amount - interest;
            balance -= principalComponent;

            schedule.push({
                installmentNo: i,
                dueDate: new Date(currentDate),
                principal: principalComponent,
                interest: interest,
                total: loan.emi_amount,
                balance: balance > 0 ? balance : 0
            });
        }
        return schedule;
    };

    const handleAddPayment = async () => {
        if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
            toast({ title: "Invalid Amount", description: "Please enter a valid payment amount", variant: "destructive" });
            return;
        }

        try {
            setIsSubmittingPayment(true);

            const amount = parseFloat(paymentAmount);

            // ✅ NEW: Call API endpoint instead of direct DB access
            const response = await fetch(`/api/v1/loans/${loan.id}/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount,
                    paymentType,
                    paymentMethod,
                    notes: paymentNotes || undefined,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to add payment');
            }

            toast({
                title: "Payment Recorded",
                description: result.data.message || `Payment of ₹${amount.toLocaleString()} added successfully`
            });

            setIsPaymentOpen(false);
            setPaymentAmount('');
            setPaymentNotes('');

            // Refresh data
            router.refresh();

        } catch (error: any) {
            console.error('Error adding payment:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to record payment",
                variant: "destructive"
            });
        } finally {
            setIsSubmittingPayment(false);
        }
    };

    const handleCloseLoan = async () => {
        if (!collateralConfirmed) {
            toast({ title: "Confirmation Required", description: "Please confirm that all collateral has been returned to the customer.", variant: "destructive" });
            return;
        }

        try {
            setIsSubmittingClose(true);

            // ✅ NEW: Call API endpoint instead of direct DB access
            const response = await fetch(`/api/v1/loans/${loan.id}/close`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    settlementAmount: settlementAmount ? parseFloat(settlementAmount) : undefined,
                    settlementNotes: settlementNotes || undefined,
                    collateralConfirmed: true,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to close loan');
            }

            toast({
                title: "Loan Closed",
                description: result.data.message || `Loan #${loan.loan_number} has been successfully closed.`
            });

            setIsCloseLoanOpen(false);

            // Refresh data
            router.refresh();

        } catch (error: any) {
            console.error('Error closing loan:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to close loan",
                variant: "destructive"
            });
        } finally {
            setIsSubmittingClose(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'default';
            case 'closed': return 'secondary';
            case 'overdue': return 'destructive';
            case 'rejected': return 'outline';
            default: return 'default';
        }
    };

    if (!loan.customer) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                <h2 className="text-xl font-bold">Customer Data Missing</h2>
                <p>Could not load customer details for this loan.</p>
                <Button variant="outline" className="mt-4" onClick={() => router.push(`/shop/${shopId}/loans`)}>
                    Back to Loans
                </Button>
            </div>
        );
    }

    const collateral = loan.collateral || [];
    const payments = loan.payments || [];

    // Unified Transaction History
    const transactions = [
        {
            id: 'disbursement',
            type: 'disbursement',
            amount: loan.principal_amount,
            date: loan.start_date,
            method: 'Cash/Online', // Default assumption or add field to DB
            notes: 'Loan Disbursed',
            payment_type: 'disbursement'
        },
        ...payments.map(p => ({
            ...p,
            type: 'payment',
            date: p.payment_date,
            method: p.payment_method
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Add Upcoming Payment to History if Active
    if (loan.status === 'active') {
        const nextInterest = getMonthlyInterest(loan.principal_amount, loan.interest_rate);
        const nextDate = getNextDueDate(loan.start_date);

        const upcomingTx = {
            id: 'upcoming-payment',
            type: 'upcoming',
            amount: nextInterest,
            date: nextDate.toISOString(),
            method: 'Pending',
            notes: 'Estimated Interest Due',
            payment_type: 'interest_due'
        };

        // precise sort to ensure it appears at the top if future
        transactions.unshift(upcomingTx);
        transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    const handleWhatsAppReminder = () => {
        if (!loan.customer.phone) {
            toast({ title: "No Phone Number", description: "Customer phone number is missing.", variant: "destructive" });
            return;
        }

        const interest = getMonthlyInterest(loan.principal_amount, loan.interest_rate);
        const dueDate = getNextDueDate(loan.start_date);

        const message = `Hello ${loan.customer.name},\nThis is a gentle reminder for your loan payment.\n\nLoan #${loan.loan_number}\nInterest Due: ₹${formatCurrency(interest, true)}\nDue Date: ${format(dueDate, 'dd MMM yyyy')}\n\nPlease pay at the earliest to avoid late fees.\nThank you.`;

        const url = `https://wa.me/91${loan.customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');

        toast({
            title: "WhatsApp Opened",
            description: "Please send the message in the new tab.",
        });
    };

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Header Section matching Marketing/Catalogue */}
            <div className="relative overflow-hidden pb-12">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />

                {/* Floating Orbs */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-primary/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-56 h-56 bg-primary/15 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />

                {/* Glass Container */}
                <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
                    <div className="backdrop-blur-xl bg-white/60 dark:bg-gray-900/60 rounded-3xl border border-white/40 dark:border-white/10 shadow-2xl shadow-primary/10 p-6 md:p-10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="space-y-3 w-full md:w-auto">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <Button variant="ghost" size="icon" onClick={() => router.push(`/shop/${shopId}/loans`)} className="rounded-full hover:bg-primary/10 -ml-2">
                                        <ArrowLeft className="h-5 w-5" />
                                    </Button>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/10 backdrop-blur-md text-xs font-medium text-primary">
                                        <FileText className="h-3 w-3" />
                                        <span>Loan Details</span>
                                    </div>
                                    <Badge variant={getStatusColor(loan.status) as any} className="capitalize shadow-sm">
                                        {loan.status}
                                    </Badge>
                                </div>
                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
                                    Loan #{loan.loan_number}
                                </h1>
                                <div className="flex items-center gap-2 text-muted-foreground text-base md:text-lg">
                                    <User className="h-4 w-4" />
                                    <span className="font-medium text-foreground">{loan.customer.name}</span>
                                    <span>•</span>
                                    <span>{loan.customer.phone}</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3 w-full md:w-auto">
                                <Button variant="outline" onClick={handlePrint} className="rounded-full border-primary/20 hover:bg-primary/5 hover:text-primary flex-1 md:flex-none">
                                    <Printer className="h-4 w-4 mr-2" /> Print
                                </Button>
                                {loan.status === 'active' && (
                                    <>
                                        <Button onClick={() => setIsPaymentOpen(true)} className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 flex-1 md:flex-none">
                                            <Plus className="h-4 w-4 mr-2" /> Add Payment
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="icon" className="rounded-full">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setIsCloseLoanOpen(true)}>
                                                    <Lock className="h-4 w-4 mr-2" /> Close Loan
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-8 relative z-10 space-y-8 pb-12">
                <div className="grid gap-6 md:grid-cols-7">
                {/* Main Content - Left Side */}
                <div className="md:col-span-5 space-y-6">
                    {/* Key Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Principal Amount</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(loan.principal_amount)}</div>
                                <div className="text-xs text-muted-foreground mt-1 space-y-1">
                                    <p>{loan.interest_rate}% Interest p.a.</p>
                                    {loan.repayment_type && (
                                        <p className="capitalize font-medium text-primary">
                                            {loan.repayment_type.replace('_', ' ')}
                                            {loan.repayment_type === 'emi' && loan.emi_amount && ` - ${formatCurrency(loan.emi_amount)}/mo`}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(loan.total_amount_paid || 0)}</div>
                                <p className="text-xs text-muted-foreground">
                                    Last payment: {payments.length > 0 ? format(new Date(payments[0].payment_date), 'MMM d, yyyy') : 'No payments'}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Start Date</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{format(new Date(loan.start_date), 'MMM d, yyyy')}</div>
                                <p className="text-xs text-muted-foreground">
                                    Due Date: {loan.end_date ? format(new Date(loan.end_date), 'MMM d, yyyy') : 'Open-ended'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="collateral" className="w-full">
                        <TabsList>
                            <TabsTrigger value="collateral">Collateral Items</TabsTrigger>
                            <TabsTrigger value="payments">Payment History</TabsTrigger>
                            {loan.repayment_type === 'emi' && <TabsTrigger value="schedule">EMI Schedule</TabsTrigger>}
                            <TabsTrigger value="documents">Documents</TabsTrigger>
                        </TabsList>

                        {loan.repayment_type === 'emi' && (
                            <TabsContent value="schedule" className="space-y-4 mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>EMI Repayment Schedule</CardTitle>
                                        <CardDescription>Projected repayment plan</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="rounded-md border">
                                            {/* Mobile View - Cards */}
                                            <div className="md:hidden space-y-3 p-4">
                                                {generateEMISchedule().map((row) => (
                                                    <div key={row.installmentNo} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <Badge variant="outline" className="font-mono">
                                                                #{row.installmentNo}
                                                            </Badge>
                                                            <span className="text-sm font-medium text-muted-foreground">
                                                                Due: {format(row.dueDate, 'dd MMM yyyy')}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-end border-t border-border pt-2 mt-2">
                                                            <div>
                                                                <div className="text-xs text-muted-foreground">EMI Amount</div>
                                                                <div className="font-bold text-lg text-primary">{formatCurrency(row.total)}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-xs text-muted-foreground">Balance</div>
                                                                <div className="font-medium text-orange-600">{formatCurrency(row.balance)}</div>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                                                            <div>Prin: {formatCurrency(row.principal)}</div>
                                                            <div className="text-right">Int: {formatCurrency(row.interest)}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Desktop View - Table */}
                                            <table className="hidden md:table w-full text-sm text-left">
                                                <thead className="bg-muted/50 text-muted-foreground font-medium">
                                                    <tr>
                                                        <th className="px-4 py-3">#</th>
                                                        <th className="px-4 py-3">Due Date</th>
                                                        <th className="px-4 py-3 text-right">Principal</th>
                                                        <th className="px-4 py-3 text-right">Interest</th>
                                                        <th className="px-4 py-3 text-right">Total EMI</th>
                                                        <th className="px-4 py-3 text-right">Balance</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {generateEMISchedule().map((row) => (
                                                        <tr key={row.installmentNo} className="border-b last:border-0">
                                                            <td className="px-4 py-3">{row.installmentNo}</td>
                                                            <td className="px-4 py-3">{format(row.dueDate, 'dd MMM yyyy')}</td>
                                                            <td className="px-4 py-3 text-right">{formatCurrency(row.principal)}</td>
                                                            <td className="px-4 py-3 text-right">{formatCurrency(row.interest)}</td>
                                                            <td className="px-4 py-3 text-right font-medium">{formatCurrency(row.total)}</td>
                                                            <td className="px-4 py-3 text-right">{formatCurrency(row.balance)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        )}

                        <TabsContent value="collateral" className="space-y-4 mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Collateral Details</CardTitle>
                                    <CardDescription>Items pledged against this loan</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {collateral.map((item, idx) => (
                                            <div key={item.id} className="flex items-start justify-between p-4 border rounded-lg">
                                                <div className="flex gap-4">
                                                    <div className="h-12 w-12 bg-secondary rounded-full flex items-center justify-center">
                                                        <Gem className="h-6 w-6 text-primary" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold">{item.item_name}</h4>
                                                        <p className="text-sm text-muted-foreground capitalize">{item.item_type} • {item.purity}</p>
                                                        <div className="mt-1 text-sm">
                                                            <span className="mr-4">Gross: {item.gross_weight}g</span>
                                                            <span>Net: {item.net_weight}g</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold">{formatCurrency(item.estimated_value || 0)}</div>
                                                    <p className="text-xs text-muted-foreground">Est. Value</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="payments" className="space-y-4 mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Transaction History</CardTitle>
                                    <CardDescription>Visual timeline of all loan transactions</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0 md:p-6">
                                    {/* Desktop Table View */}
                                    <div className="hidden md:block overflow-hidden rounded-md border">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-muted/50 text-muted-foreground font-medium">
                                                <tr>
                                                    <th className="px-4 py-3">Date</th>
                                                    <th className="px-4 py-3">Description</th>
                                                    <th className="px-4 py-3">Method</th>
                                                    <th className="px-4 py-3 text-right">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {transactions.map((tx) => (
                                                    <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                                                        <td className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                                                            {format(new Date(tx.date), 'MMM d, yyyy')}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Badge
                                                                variant={tx.type === 'disbursement' ? 'secondary' : (tx.type === 'upcoming' ? 'outline' : 'outline')}
                                                                className={
                                                                    tx.type === 'disbursement' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200' :
                                                                        (tx.type === 'upcoming' ? 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 dashed border-2' : '')
                                                                }
                                                            >
                                                                {tx.id === 'disbursement' ? 'Principal Disbursed' : (tx.type === 'upcoming' ? 'Upcoming Due' : tx.payment_type?.replace('_', ' '))}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 capitalize text-muted-foreground">
                                                            {tx.type === 'upcoming' ? <span className="italic text-primary">Expected</span> : tx.method?.replace('_', ' ')}
                                                        </td>
                                                        <td className={`px-4 py-3 text-right font-bold ${tx.type === 'disbursement' ? 'text-red-600' :
                                                            (tx.type === 'upcoming' ? 'text-primary' : 'text-green-600')
                                                            }`}>
                                                            {tx.type === 'disbursement' ? '-' : (tx.type === 'upcoming' ? '~' : '+')} {formatCurrency(tx.amount)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Card View */}
                                    <div className="md:hidden space-y-3 px-4 pb-4">
                                        {transactions.map((tx) => (
                                            <div key={tx.id} className="flex items-start justify-between p-3 border rounded-lg bg-card shadow-sm">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-semibold text-muted-foreground">
                                                            {format(new Date(tx.date), 'dd MMM yyyy')}
                                                        </span>
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[10px] h-5 px-1.5 ${tx.type === 'disbursement'
                                                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                                : (tx.type === 'upcoming'
                                                                    ? 'bg-primary/5 text-primary border-primary/20 border-dashed'
                                                                    : 'bg-green-50 text-green-700 border-green-200')
                                                                }`}
                                                        >
                                                            {tx.id === 'disbursement' ? 'OUT' : (tx.type === 'upcoming' ? 'DUE' : 'IN')}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm font-medium capitalize">
                                                        {tx.id === 'disbursement' ? 'Principal Disbursed' : (tx.type === 'upcoming' ? 'Upcoming Interest' : tx.payment_type?.replace('_', ' '))}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground capitalize">
                                                        Via {tx.type === 'upcoming' ? 'Expected' : tx.method?.replace('_', ' ')}
                                                    </p>
                                                </div>
                                                <div className={`text-right font-bold ${tx.type === 'disbursement' ? 'text-red-600' :
                                                    (tx.type === 'upcoming' ? 'text-primary' : 'text-green-600')
                                                    }`}>
                                                    <div className="text-base">
                                                        {tx.type === 'disbursement' ? '-' : (tx.type === 'upcoming' ? '~' : '+')} {formatCurrency(tx.amount)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="documents" className="space-y-4 mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Documents</CardTitle>
                                    <CardDescription>KYC and other related documents</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-8 text-muted-foreground">
                                        <FileText className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                        <p>No documents uploaded.</p>
                                        <Button variant="link" className="mt-2">Upload Document</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Sidebar - Right Side */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col items-center p-4 bg-secondary/20 rounded-lg">
                                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                                    <User className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="font-bold text-lg">{loan.customer.name}</h3>
                                <p className="text-sm text-muted-foreground">{loan.customer.phone}</p>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Email:</span>
                                    <div className="font-medium">{loan.customer.email || 'N/A'}</div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Address:</span>
                                    <div className="font-medium">{loan.customer.address || 'N/A'}</div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Customer Since:</span>
                                    <div className="font-medium">{format(new Date(loan.customer.created_at!), 'MMM d, yyyy')}</div>
                                </div>
                            </div>


                        </CardContent>
                    </Card>

                    {/* Upcoming Payment / Reminder Card */}
                    {loan.status === 'active' && (
                        <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10 dark:border-primary/20">
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-2 text-primary">
                                    <AlertCircle className="h-5 w-5" />
                                    <CardTitle className="text-base">Upcoming Payment</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Estimated Interest</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-primary">
                                            {formatCurrency(getMonthlyInterest(loan.principal_amount, loan.interest_rate))}
                                        </span>
                                        <span className="text-sm font-medium text-muted-foreground">
                                            due {format(getNextDueDate(loan.start_date), 'dd MMM')}
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    className="w-full bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 dark:text-primary transition-colors"
                                    variant="outline"
                                    onClick={handleWhatsAppReminder}
                                >
                                    <Wallet className="h-4 w-4 mr-2" />
                                    Send Payment Reminder
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Loan Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Principal</span>
                                <span>{formatCurrency(loan.principal_amount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Interest Rate</span>
                                <span>{loan.interest_rate}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Paid</span>
                                <span className="text-green-600">- {formatCurrency(loan.total_amount_paid || 0)}</span>
                            </div>
                            <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                                <span>Balance Principal</span>
                                <span>{formatCurrency(Math.max(0, loan.principal_amount - (loan.total_amount_paid || 0)))}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 italic">
                                * Interest calculation pending
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>

            {/* Dialogs */}
            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                        <DialogDescription>
                            Add a payment towards Loan #{loan.loan_number}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Amount (₹)</Label>
                            <Input
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Payment Type</Label>
                            <Select value={paymentType} onValueChange={(v: any) => setPaymentType(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="interest">Interest Payment</SelectItem>
                                    <SelectItem value="principal">Principal Repayment</SelectItem>
                                    <SelectItem value="full_settlement">Full Settlement</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Payment Method</Label>
                            <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="upi">UPI</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Notes (Optional)</Label>
                            <Textarea
                                value={paymentNotes}
                                onChange={(e) => setPaymentNotes(e.target.value)}
                                placeholder="Transaction ID, remarks, etc."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddPayment} disabled={isSubmittingPayment}>
                            {isSubmittingPayment ? "Recording..." : "Record Payment"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Close Loan Dialog */}
            <Dialog open={isCloseLoanOpen} onOpenChange={setIsCloseLoanOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Close Loan #{loan.loan_number}</DialogTitle>
                        <DialogDescription>
                            Finalize and close this loan. This will mark all collateral as returned.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {/* Outstanding Balance Summary */}
                        <div className="rounded-lg border p-4 bg-muted/50">
                            <h4 className="font-semibold mb-2">Outstanding Balance</h4>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Principal:</span>
                                    <span>{formatCurrency(loan.principal_amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Paid:</span>
                                    <span className="text-green-600">- {formatCurrency(loan.total_amount_paid || 0)}</span>
                                </div>
                                <div className="flex justify-between font-bold border-t pt-1 mt-1">
                                    <span>Outstanding:</span>
                                    <span className={Math.max(0, loan.principal_amount - (loan.total_amount_paid || 0)) > 0 ? 'text-orange-600' : 'text-green-600'}>
                                        {formatCurrency(Math.max(0, loan.principal_amount - (loan.total_amount_paid || 0)))}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Settlement Amount */}
                        <div className="grid gap-2">
                            <Label>Settlement Amount (₹)</Label>
                            <Input
                                type="number"
                                value={settlementAmount}
                                onChange={(e) => setSettlementAmount(e.target.value)}
                                placeholder={`${loan.total_amount_paid || 0}`}
                            />
                            <p className="text-xs text-muted-foreground">
                                Final amount to mark as settled. Leave empty to use total paid amount.
                            </p>
                        </div>

                        {/* Settlement Notes */}
                        <div className="grid gap-2">
                            <Label>Settlement Notes (Optional)</Label>
                            <Textarea
                                value={settlementNotes}
                                onChange={(e) => setSettlementNotes(e.target.value)}
                                placeholder="Discount applied, early settlement, etc."
                                rows={3}
                            />
                        </div>

                        {/* Collateral Confirmation */}
                        <div className="flex items-start space-x-2 p-3 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                            <Checkbox
                                id="collateral-confirm"
                                checked={collateralConfirmed}
                                onCheckedChange={(checked) => setCollateralConfirmed(checked as boolean)}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <label
                                    htmlFor="collateral-confirm"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Confirm all collateral returned
                                </label>
                                <p className="text-xs text-muted-foreground">
                                    I confirm that all {collateral.length} collateral item(s) have been returned to the customer.
                                </p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCloseLoanOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleCloseLoan}
                            disabled={isSubmittingClose || !collateralConfirmed}
                            variant="default"
                        >
                            {isSubmittingClose ? "Closing..." : "Close Loan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
