'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import { format } from 'date-fns';
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
    Lock
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

type LoanDetailsClientProps = {
    shopId: string;
    loan: Loan & {
        customer: LoanCustomer;
        collateral: LoanCollateral[];
        payments: LoanPayment[];
    };
    currentUser: any;
};

export function LoanDetailsClient({ shopId, loan, currentUser }: LoanDetailsClientProps) {
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

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/shop/${shopId}/loans`)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">Loan #{loan.loan_number}</h1>
                            <Badge variant={getStatusColor(loan.status) as any} className="capitalize">
                                {loan.status}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground flex items-center gap-2">
                            <User className="h-4 w-4" /> {loan.customer.name} • {loan.customer.phone}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                        <DialogTrigger asChild>
                            <Button disabled={loan.status === 'closed'}>
                                <Plus className="h-4 w-4 mr-2" /> Add Payment
                            </Button>
                        </DialogTrigger>
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

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => window.print()}>
                                <Printer className="h-4 w-4 mr-2" /> Print Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={() => setIsCloseLoanOpen(true)}
                                disabled={loan.status === 'closed'}
                            >
                                <Lock className="h-4 w-4 mr-2" /> Close Loan
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

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
                                            <span>₹{formatCurrency(loan.principal_amount)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Total Paid:</span>
                                            <span className="text-green-600">- ₹{formatCurrency(loan.total_amount_paid || 0)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold border-t pt-1 mt-1">
                                            <span>Outstanding:</span>
                                            <span className={Math.max(0, loan.principal_amount - (loan.total_amount_paid || 0)) > 0 ? 'text-orange-600' : 'text-green-600'}>
                                                ₹{formatCurrency(Math.max(0, loan.principal_amount - (loan.total_amount_paid || 0)))}
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
            </div>

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
                                <div className="text-2xl font-bold">₹{formatCurrency(loan.principal_amount)}</div>
                                <p className="text-xs text-muted-foreground">
                                    {loan.interest_rate}% Interest p.a.
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₹{formatCurrency(loan.total_amount_paid || 0)}</div>
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
                            <TabsTrigger value="documents">Documents</TabsTrigger>
                        </TabsList>

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
                                                    <div className="font-bold">₹{formatCurrency(item.estimated_value || 0)}</div>
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
                                    <CardTitle>Payment History</CardTitle>
                                    <CardDescription>All payments made for this loan</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {payments.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">No payments recorded yet.</div>
                                    ) : (
                                        <div className="space-y-4">
                                            {payments.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()).map((payment) => (
                                                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                    <div>
                                                        <div className="font-semibold">₹{formatCurrency(payment.amount)}</div>
                                                        <p className="text-xs text-muted-foreground capitalize">
                                                            {payment.payment_type.replace('_', ' ')} • {payment.payment_method}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-medium">{format(new Date(payment.payment_date), 'MMM d, yyyy')}</div>
                                                        {payment.notes && <p className="text-xs text-muted-foreground max-w-[200px] truncate">{payment.notes}</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
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

                    <Card>
                        <CardHeader>
                            <CardTitle>Loan Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Principal</span>
                                <span>₹{formatCurrency(loan.principal_amount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Interest Rate</span>
                                <span>{loan.interest_rate}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Paid</span>
                                <span className="text-green-600">- ₹{formatCurrency(loan.total_amount_paid || 0)}</span>
                            </div>
                            <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                                <span>Balance Principal</span>
                                <span>₹{formatCurrency(Math.max(0, loan.principal_amount - (loan.total_amount_paid || 0)))}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 italic">
                                * Interest calculation pending
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
