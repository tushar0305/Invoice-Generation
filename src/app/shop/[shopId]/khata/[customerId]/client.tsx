'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, TrendingUp, TrendingDown, Edit, Trash2, Phone, MessageCircle, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import type { CustomerBalance, LedgerTransaction } from '@/lib/ledger-types';
import { cn, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

type CustomerLedgerClientProps = {
    customer: CustomerBalance;
    transactions: LedgerTransaction[];
    shopId: string;
    userId: string;
};

export function CustomerLedgerClient({
    customer,
    transactions: initialTransactions,
    shopId,
    userId,
}: CustomerLedgerClientProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
    const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);

    const [newTransaction, setNewTransaction] = useState({
        type: 'received' as 'given' | 'received',
        amount: '',
        description: '',
        transaction_date: format(new Date(), 'yyyy-MM-dd'),
    });

    const [editCustomer, setEditCustomer] = useState({
        name: customer.name,
        phone: customer.phone || '',
        address: customer.address || '',
    });

    // Calculate running balance
    let runningBalance = 0;
    const transactionsWithBalance = initialTransactions.map(trans => {
        if (trans.entry_type === 'DEBIT') {
            runningBalance += trans.amount;
        } else {
            runningBalance -= trans.amount;
        }
        return { ...trans, balance_after: runningBalance };
    }).reverse();

    const handleAddTransaction = async () => {
        const amount = parseFloat(newTransaction.amount);
        if (!amount || amount <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid amount' });
            return;
        }

        startTransition(async () => {
            try {
                const { error } = await supabase.rpc('add_ledger_transaction', {
                    p_shop_id: shopId,
                    p_customer_id: customer.id,
                    p_amount: amount,
                    p_transaction_type: newTransaction.type === 'given' ? 'INVOICE' : 'PAYMENT',
                    p_entry_type: newTransaction.type === 'given' ? 'DEBIT' : 'CREDIT',
                    p_description: newTransaction.description.trim() || null,
                    p_date: newTransaction.transaction_date
                });

                if (error) throw error;

                toast({ title: 'Transaction Added', description: `₹${formatCurrency(amount)} ${newTransaction.type === 'given' ? 'given to' : 'received from'} ${customer.name}` });
                setIsAddTransactionOpen(false);
                setNewTransaction({ type: 'received', amount: '', description: '', transaction_date: format(new Date(), 'yyyy-MM-dd') });
                router.refresh();
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to add transaction' });
            }
        });
    };

    const handleUpdateCustomer = async () => {
        if (!editCustomer.name.trim()) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Customer name is required' });
            return;
        }

        startTransition(async () => {
            try {
                const { error } = await supabase.rpc('update_customer', {
                    p_customer_id: customer.id,
                    p_shop_id: shopId,
                    p_name: editCustomer.name.trim(),
                    p_phone: editCustomer.phone.trim() || null,
                    p_email: null,
                    p_address: editCustomer.address.trim() || null,
                    p_state: null,
                    p_pincode: null,
                    p_gst_number: null
                });

                if (error) throw error;

                toast({ title: 'Customer Updated', description: 'Details have been updated' });
                setIsEditCustomerOpen(false);
                router.refresh();
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update' });
            }
        });
    };

    const handleDeleteTransaction = async (transactionId: string, amount: number, type: string) => {
        if (!confirm(`Delete this ₹${formatCurrency(amount)} transaction?`)) return;

        startTransition(async () => {
            try {
                const { error } = await supabase.rpc('delete_ledger_transaction', {
                    p_transaction_id: transactionId,
                    p_shop_id: shopId
                });

                if (error) throw error;
                toast({ title: 'Transaction Deleted' });
                router.refresh();
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete' });
            }
        });
    };

    const sendWhatsApp = () => {
        const balance = Math.abs(customer.current_balance);
        const type = customer.current_balance > 0 ? 'receivable' : 'payable';
        const text = `Hello ${customer.name}, your current khata balance is ₹${balance} (${type}).`;
        const url = `https://wa.me/${customer.phone?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-24">
            {/* Mobile Header - Native Style */}
            <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/40">
                <div className="flex items-center gap-3 px-4 py-3">
                    <button
                        onClick={() => router.push(`/shop/${shopId}/khata`)}
                        className="p-2 -ml-2 rounded-full hover:bg-muted/50 active:scale-95 transition-transform"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-bold truncate">{customer.name}</h1>
                        {customer.phone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {customer.phone}
                            </p>
                        )}
                    </div>
                    <Dialog open={isEditCustomerOpen} onOpenChange={setIsEditCustomerOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                                <Edit className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Customer</DialogTitle>
                                <DialogDescription>Update customer details</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Name *</Label>
                                    <Input value={editCustomer.name} onChange={(e) => setEditCustomer({ ...editCustomer, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <Input value={editCustomer.phone} onChange={(e) => setEditCustomer({ ...editCustomer, phone: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Address</Label>
                                    <Input value={editCustomer.address} onChange={(e) => setEditCustomer({ ...editCustomer, address: e.target.value })} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsEditCustomerOpen(false)}>Cancel</Button>
                                <Button onClick={handleUpdateCustomer} disabled={isPending}>Save</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Balance Card - Hero Style */}
            <div className="px-4 pt-4">
                <Card className={cn(
                    "border-0 shadow-xl overflow-hidden",
                    customer.current_balance > 0
                        ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                        : customer.current_balance < 0
                            ? "bg-gradient-to-br from-red-500 to-red-600"
                            : "bg-gradient-to-br from-slate-500 to-slate-600"
                )}>
                    <CardContent className="p-5">
                        <div className="text-center text-white">
                            <p className="text-sm opacity-80 mb-1">Current Balance</p>
                            <h2 className="text-4xl font-bold mb-2">
                                {formatCurrency(Math.abs(customer.current_balance))}
                            </h2>
                            <Badge className={cn(
                                "text-xs font-medium",
                                customer.current_balance > 0
                                    ? "bg-white/20 text-white"
                                    : customer.current_balance < 0
                                        ? "bg-white/20 text-white"
                                        : "bg-white/20 text-white"
                            )}>
                                {customer.current_balance > 0 ? 'WILL PAY YOU' : customer.current_balance < 0 ? 'YOU WILL PAY' : 'SETTLED'}
                            </Badge>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-white/20">
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1 text-white/70 text-xs mb-1">
                                    <ArrowDownRight className="h-3 w-3" />
                                    Total Given
                                </div>
                                <p className="text-lg font-bold text-white">{formatCurrency(customer.total_spent)}</p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-1 text-white/70 text-xs mb-1">
                                    <ArrowUpRight className="h-3 w-3" />
                                    Total Received
                                </div>
                                <p className="text-lg font-bold text-white">{formatCurrency(customer.total_paid)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                    <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex-1 gap-2 h-11">
                                <Plus className="h-4 w-4" />
                                Add Entry
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Transaction</DialogTitle>
                                <DialogDescription>Record a transaction for {customer.name}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setNewTransaction({ ...newTransaction, type: 'given' })}
                                        className={cn(
                                            "p-4 rounded-xl border-2 text-center transition-all",
                                            newTransaction.type === 'given'
                                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                                                : "border-border"
                                        )}
                                    >
                                        <ArrowDownRight className={cn(
                                            "h-6 w-6 mx-auto mb-1",
                                            newTransaction.type === 'given' ? "text-emerald-600" : "text-muted-foreground"
                                        )} />
                                        <span className={cn(
                                            "text-sm font-medium",
                                            newTransaction.type === 'given' ? "text-emerald-600" : "text-muted-foreground"
                                        )}>Given</span>
                                    </button>
                                    <button
                                        onClick={() => setNewTransaction({ ...newTransaction, type: 'received' })}
                                        className={cn(
                                            "p-4 rounded-xl border-2 text-center transition-all",
                                            newTransaction.type === 'received'
                                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                                : "border-border"
                                        )}
                                    >
                                        <ArrowUpRight className={cn(
                                            "h-6 w-6 mx-auto mb-1",
                                            newTransaction.type === 'received' ? "text-blue-600" : "text-muted-foreground"
                                        )} />
                                        <span className={cn(
                                            "text-sm font-medium",
                                            newTransaction.type === 'received' ? "text-blue-600" : "text-muted-foreground"
                                        )}>Received</span>
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    <Label>Amount *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={newTransaction.amount}
                                        onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                                        placeholder="0.00"
                                        className="text-2xl h-14 text-center font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Date</Label>
                                    <Input
                                        type="date"
                                        value={newTransaction.transaction_date}
                                        onChange={(e) => setNewTransaction({ ...newTransaction, transaction_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Note (optional)</Label>
                                    <Textarea
                                        value={newTransaction.description}
                                        onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                                        placeholder="Add a note..."
                                        rows={2}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddTransactionOpen(false)}>Cancel</Button>
                                <Button onClick={handleAddTransaction} disabled={isPending}>
                                    {newTransaction.type === 'given' ? 'Record Given' : 'Record Received'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button variant="outline" className="h-11 gap-2" onClick={sendWhatsApp} disabled={!customer.phone}>
                        <MessageCircle className="h-4 w-4" />
                        Remind
                    </Button>
                </div>
            </div>

            {/* Transaction History */}
            <div className="px-4 mt-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Transaction History</h3>

                {transactionsWithBalance.length === 0 ? (
                    <Card className="border-border/50">
                        <CardContent className="py-12 text-center">
                            <p className="text-muted-foreground">No transactions yet</p>
                            <Button variant="outline" className="mt-4" onClick={() => setIsAddTransactionOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" /> Add First Entry
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {transactionsWithBalance.map((trans) => (
                            <Card key={trans.id} className="border-border/50 overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="flex items-center p-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                            trans.entry_type === 'DEBIT'
                                                ? "bg-emerald-100 dark:bg-emerald-900/30"
                                                : "bg-blue-100 dark:bg-blue-900/30"
                                        )}>
                                            {trans.entry_type === 'DEBIT'
                                                ? <ArrowDownRight className="h-5 w-5 text-emerald-600" />
                                                : <ArrowUpRight className="h-5 w-5 text-blue-600" />
                                            }
                                        </div>
                                        <div className="flex-1 ml-3 min-w-0">
                                            <div className="flex items-baseline justify-between">
                                                <span className={cn(
                                                    "text-base font-bold",
                                                    trans.entry_type === 'DEBIT' ? "text-emerald-600" : "text-blue-600"
                                                )}>
                                                    {trans.entry_type === 'DEBIT' ? '+' : '-'}{formatCurrency(trans.amount)}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {format(new Date(trans.transaction_date), 'dd MMM')}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between mt-0.5">
                                                <span className="text-xs text-muted-foreground truncate mr-2">
                                                    {trans.description || (trans.entry_type === 'DEBIT' ? 'Given' : 'Received')}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                                                    Bal: {formatCurrency(Math.abs(trans.balance_after))}
                                                    {trans.balance_after > 0 ? ' Dr' : trans.balance_after < 0 ? ' Cr' : ''}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteTransaction(trans.id, trans.amount, trans.entry_type)}
                                            className="ml-2 p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
