'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Calendar, TrendingUp, TrendingDown, Edit, Trash2, IndianRupee } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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

    // Add transaction form state
    const [newTransaction, setNewTransaction] = useState({
        type: 'received' as 'given' | 'received',
        amount: '',
        description: '',
        transaction_date: format(new Date(), 'yyyy-MM-dd'),
    });

    // Edit customer form state
    const [editCustomer, setEditCustomer] = useState({
        name: customer.name,
        phone: customer.phone || '',
        address: customer.address || '',
    });

    // Calculate running balance for each transaction
    let runningBalance = 0; // Assuming 0 opening balance for now
    const transactionsWithBalance = initialTransactions.map(trans => {
        if (trans.entry_type === 'DEBIT') {
            runningBalance += trans.amount;
        } else {
            runningBalance -= trans.amount;
        }
        return {
            ...trans,
            balance_after: runningBalance,
        };
    }).reverse(); // Reverse to show oldest first with running balance

    const handleAddTransaction = async () => {
        const amount = parseFloat(newTransaction.amount);

        if (!amount || amount <= 0) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Please enter a valid amount',
            });
            return;
        }

        startTransition(async () => {
            try {
                // Use RPC
                const { error } = await supabase.rpc('add_ledger_transaction', {
                    p_shop_id: shopId,
                    p_customer_id: customer.id,
                    p_amount: amount,
                    p_transaction_type: newTransaction.type === 'given' ? 'INVOICE' : 'PAYMENT', // Simplified mapping
                    p_entry_type: newTransaction.type === 'given' ? 'DEBIT' : 'CREDIT',
                    p_description: newTransaction.description.trim() || null,
                    p_date: newTransaction.transaction_date
                });

                if (error) throw error;



                toast({
                    title: 'Transaction Added',
                    description: `₹${formatCurrency(amount)} ${newTransaction.type === 'given' ? 'given to' : 'received from'} ${customer.name}`,
                });

                setIsAddTransactionOpen(false);
                setNewTransaction({
                    type: 'received',
                    amount: '',
                    description: '',
                    transaction_date: format(new Date(), 'yyyy-MM-dd'),
                });
                router.refresh();
            } catch (error: any) {
                console.error('Add transaction error:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: error.message || 'Failed to add transaction',
                });
            }
        });
    };

    const handleUpdateCustomer = async () => {
        if (!editCustomer.name.trim()) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Customer name is required',
            });
            return;
        }

        startTransition(async () => {
            try {
                // Use RPC
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



                toast({
                    title: 'Customer Updated',
                    description: 'Customer details have been updated',
                });

                setIsEditCustomerOpen(false);
                router.refresh();
            } catch (error: any) {
                console.error('Update customer error:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: error.message || 'Failed to update customer',
                });
            }
        });
    };

    const handleDeleteTransaction = async (transactionId: string, amount: number, type: string) => {
        if (!confirm(`Are you sure you want to delete this ₹${formatCurrency(amount)} ${type} transaction?`)) {
            return;
        }

        startTransition(async () => {
            try {
                // Use RPC
                const { error } = await supabase.rpc('delete_ledger_transaction', {
                    p_transaction_id: transactionId,
                    p_shop_id: shopId
                });

                if (error) throw error;



                toast({
                    title: 'Transaction Deleted',
                    description: 'Transaction has been removed',
                });

                router.refresh();
            } catch (error: any) {
                console.error('Delete transaction error:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: error.message || 'Failed to delete transaction',
                });
            }
        });
    };


    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Button
                variant="ghost"
                className="gap-2"
                onClick={() => router.push(`/shop/${shopId}/khata`)}
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Khata Book
            </Button>

            {/* Customer Details Card */}
            <Card className="border-border bg-white dark:bg-slate-900 shadow-sm">
                <CardHeader className="border-b border-border">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle className="text-2xl font-heading">{customer.name}</CardTitle>
                            <div className="flex flex-col gap-1 mt-2 text-sm text-muted-foreground">
                                {customer.phone && (
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">Phone:</span>
                                        <span>{customer.phone}</span>
                                    </div>
                                )}
                                {customer.address && (
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">Address:</span>
                                        <span>{customer.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Dialog open={isEditCustomerOpen} onOpenChange={setIsEditCustomerOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="gap-2">
                                        <Edit className="h-4 w-4" />
                                        Edit
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Edit Customer</DialogTitle>
                                        <DialogDescription>
                                            Update customer details
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-name">Name *</Label>
                                            <Input
                                                id="edit-name"
                                                value={editCustomer.name}
                                                onChange={(e) => setEditCustomer({ ...editCustomer, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-phone">Phone</Label>
                                            <Input
                                                id="edit-phone"
                                                value={editCustomer.phone}
                                                onChange={(e) => setEditCustomer({ ...editCustomer, phone: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-address">Address</Label>
                                            <Input
                                                id="edit-address"
                                                value={editCustomer.address}
                                                onChange={(e) => setEditCustomer({ ...editCustomer, address: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsEditCustomerOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleUpdateCustomer} disabled={isPending}>
                                            Save Changes
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
                                <DialogTrigger asChild>
                                    <Button className="gap-2 shadow-lg shadow-primary/25">
                                        <Plus className="h-4 w-4" />
                                        Add Transaction
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Transaction</DialogTitle>
                                        <DialogDescription>
                                            Record a transaction for {customer.name}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="type">Transaction Type *</Label>
                                            <Select
                                                value={newTransaction.type}
                                                onValueChange={(value: 'given' | 'received') =>
                                                    setNewTransaction({ ...newTransaction, type: value })
                                                }
                                            >
                                                <SelectTrigger id="type">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="given">Given (You gave goods/money)</SelectItem>
                                                    <SelectItem value="received">Received (You got payment)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="amount">Amount *</Label>
                                            <Input
                                                id="amount"
                                                type="number"
                                                step="0.01"
                                                value={newTransaction.amount}
                                                onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="date">Date *</Label>
                                            <Input
                                                id="date"
                                                type="date"
                                                value={newTransaction.transaction_date}
                                                onChange={(e) => setNewTransaction({ ...newTransaction, transaction_date: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="description">Description</Label>
                                            <Textarea
                                                id="description"
                                                value={newTransaction.description}
                                                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                                                placeholder="Optional notes..."
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsAddTransactionOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleAddTransaction} disabled={isPending}>
                                            Add Transaction
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="p-4 rounded-lg bg-secondary/20 border border-border">
                            <div className="text-sm font-medium text-muted-foreground mb-1">Opening Balance</div>
                            <div className="text-2xl font-bold">₹0.00</div>
                        </div>
                        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                            <div className="text-sm font-medium text-muted-foreground mb-1">Total Given</div>
                            <div className="text-2xl font-bold text-green-600">₹{formatCurrency(customer.total_spent)}</div>
                        </div>
                        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <div className="text-sm font-medium text-muted-foreground mb-1">Total Received</div>
                            <div className="text-2xl font-bold text-blue-600">₹{formatCurrency(customer.total_paid)}</div>
                        </div>
                        <div className={cn(
                            "p-4 rounded-lg border",
                            customer.current_balance > 0 && "bg-green-500/10 border-green-500/20",
                            customer.current_balance < 0 && "bg-red-500/10 border-red-500/20",
                            customer.current_balance === 0 && "bg-secondary/20 border-border"
                        )}>
                            <div className="text-sm font-medium text-muted-foreground mb-1">Current Balance</div>
                            <div className={cn(
                                "text-2xl font-bold",
                                customer.current_balance > 0 && "text-green-600",
                                customer.current_balance < 0 && "text-red-600",
                                customer.current_balance === 0 && "text-foreground"
                            )}>
                                ₹{formatCurrency(Math.abs(customer.current_balance))}
                                {customer.current_balance > 0 && ' Dr'}
                                {customer.current_balance < 0 && ' Cr'}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card className="border-border bg-white dark:bg-slate-900 shadow-sm">
                <CardHeader className="border-b border-border">
                    <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px]">Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Given</TableHead>
                                <TableHead className="text-right">Received</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                                <TableHead className="text-center w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Opening Balance Row */}


                            {transactionsWithBalance.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                        No transactions yet. Add your first transaction above!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactionsWithBalance.map((trans) => (
                                    <TableRow key={trans.id}>
                                        <TableCell className="font-medium">
                                            {format(new Date(trans.transaction_date), 'dd MMM yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {trans.entry_type === 'DEBIT' ? (
                                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                                ) : (
                                                    <TrendingDown className="h-4 w-4 text-blue-600" />
                                                )}
                                                <span>{trans.description || '-'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right text-green-600 font-medium">
                                            {trans.entry_type === 'DEBIT' ? `₹${formatCurrency(trans.amount)}` : '-'}
                                        </TableCell>
                                        <TableCell className="text-right text-blue-600 font-medium">
                                            {trans.entry_type === 'CREDIT' ? `₹${formatCurrency(trans.amount)}` : '-'}
                                        </TableCell>
                                        <TableCell className="text-right font-bold">
                                            ₹{formatCurrency(Math.abs(trans.balance_after))}
                                            {trans.balance_after > 0 && ' Dr'}
                                            {trans.balance_after < 0 && ' Cr'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                    onClick={() => handleDeleteTransaction(trans.id, trans.amount, trans.entry_type)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}
