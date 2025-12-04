'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, TrendingUp, TrendingDown, Users, Wallet, Eye, Trash2, Edit, IndianRupee } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import type { KhataCustomerBalance, KhataStats, KhataTransaction } from '@/lib/khata-types';
import { cn, formatCurrency } from '@/lib/utils';

type KhataClientProps = {
    customers: KhataCustomerBalance[];
    stats: KhataStats;
    recentTransactions: any[];
    shopId: string;
    userId: string;
    initialSearch?: string;
    initialBalanceType?: 'positive' | 'negative' | 'zero';
};

export function KhataClient({
    customers: initialCustomers,
    stats,
    recentTransactions,
    shopId,
    userId,
    initialSearch = '',
    initialBalanceType,
}: KhataClientProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [balanceFilter, setBalanceFilter] = useState<'all' | 'positive' | 'negative' | 'zero'>(initialBalanceType || 'all');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    // Add customer form state
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone: '',
        address: '',
        opening_balance: 0,
    });

    // Filter customers
    const filteredCustomers = initialCustomers.filter(customer => {
        const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (customer.phone && customer.phone.includes(searchTerm));

        const matchesBalance = balanceFilter === 'all' ||
            (balanceFilter === 'positive' && customer.current_balance > 0) ||
            (balanceFilter === 'negative' && customer.current_balance < 0) ||
            (balanceFilter === 'zero' && customer.current_balance === 0);

        return matchesSearch && matchesBalance;
    });

    const handleAddCustomer = async () => {
        if (!newCustomer.name.trim()) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Customer name is required',
            });
            return;
        }

        startTransition(async () => {
            try {
                const { error } = await supabase
                    .from('khata_customers')
                    .insert({
                        shop_id: shopId,
                        user_id: userId,
                        name: newCustomer.name.trim(),
                        phone: newCustomer.phone.trim() || null,
                        address: newCustomer.address.trim() || null,
                        opening_balance: newCustomer.opening_balance || 0,
                    });

                if (error) throw error;

                toast({
                    title: 'Customer Added',
                    description: `${newCustomer.name} has been added to your khata book`,
                });

                setIsAddDialogOpen(false);
                setNewCustomer({ name: '', phone: '', address: '', opening_balance: 0 });
                router.refresh();
            } catch (error: any) {
                console.error('Add customer error:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: error.message || 'Failed to add customer',
                });
            }
        });
    };

    const handleDeleteCustomer = async (customerId: string, customerName: string) => {
        if (!confirm(`Are you sure you want to delete ${customerName}? This will also delete all their transactions.`)) {
            return;
        }

        startTransition(async () => {
            try {
                const { error } = await supabase
                    .from('khata_customers')
                    .delete()
                    .eq('id', customerId);

                if (error) throw error;

                toast({
                    title: 'Customer Deleted',
                    description: `${customerName} has been removed from your khata book`,
                });

                router.refresh();
            } catch (error: any) {
                console.error('Delete customer error:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: error.message || 'Failed to delete customer',
                });
            }
        });
    };

    return (
        <div className="space-y-6 pb-24">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-gray-200 dark:border-white/10 bg-white/50 dark:bg-card/30 backdrop-blur-md shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-300">Total Customers</CardTitle>
                        <Users className="h-4 w-4 text-primary glow-text-sm" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground dark:text-white">{stats.total_customers}</div>
                        <p className="text-xs text-muted-foreground dark:text-gray-500 mt-1">
                            Active accounts
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-emerald-500/20 bg-emerald-500/5 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Receivable</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500 glow-text-sm">₹{formatCurrency(stats.total_receivable)}</div>
                        <p className="text-xs text-emerald-600/60 dark:text-emerald-500/60 mt-1">
                            To be collected
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-red-500/20 bg-red-500/5 backdrop-blur-md shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">Payable</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-500 glow-text-sm">₹{formatCurrency(stats.total_payable)}</div>
                        <p className="text-xs text-red-600/60 dark:text-red-500/60 mt-1">
                            To be paid
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-primary/20 bg-primary/5 backdrop-blur-md shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-primary">Net Balance</CardTitle>
                        <Wallet className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold glow-text-sm", stats.net_balance >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500')}>
                            ₹{formatCurrency(Math.abs(stats.net_balance))}
                        </div>
                        <p className="text-xs text-muted-foreground dark:text-gray-500 mt-1">
                            {stats.net_balance >= 0 ? 'Net receivable' : 'Net payable'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Card */}
            <Card className="border-gray-200 dark:border-white/10 bg-white/50 dark:bg-card/30 backdrop-blur-md shadow-lg overflow-hidden">
                {/* Header */}
                <CardHeader className="border-b border-gray-200 dark:border-white/10">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle className="text-2xl font-heading text-foreground dark:text-white glow-text-sm">Customer Ledger</CardTitle>
                            <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">Manage customer credit and debit accounts</p>
                        </div>
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)] transition-all duration-300 bg-primary text-primary-foreground border-none">
                                    <Plus className="h-4 w-4" />
                                    Add Customer
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-white/10 text-foreground dark:text-white">
                                <DialogHeader>
                                    <DialogTitle className="text-foreground dark:text-white">Add New Customer</DialogTitle>
                                    <DialogDescription className="text-muted-foreground dark:text-gray-400">
                                        Add a new customer to your khata book
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-foreground dark:text-gray-300">Name *</Label>
                                        <Input
                                            id="name"
                                            value={newCustomer.name}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                            placeholder="Customer name"
                                            className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-gray-500 focus:border-primary/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-foreground dark:text-gray-300">Phone</Label>
                                        <Input
                                            id="phone"
                                            value={newCustomer.phone}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                            placeholder="Phone number"
                                            className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-gray-500 focus:border-primary/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address" className="text-foreground dark:text-gray-300">Address</Label>
                                        <Input
                                            id="address"
                                            value={newCustomer.address}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                                            placeholder="Address"
                                            className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-gray-500 focus:border-primary/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="opening_balance" className="text-foreground dark:text-gray-300">Opening Balance</Label>
                                        <Input
                                            id="opening_balance"
                                            type="number"
                                            step="0.01"
                                            value={newCustomer.opening_balance}
                                            onChange={(e) => setNewCustomer({ ...newCustomer, opening_balance: parseFloat(e.target.value) || 0 })}
                                            placeholder="0.00"
                                            className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-gray-500 focus:border-primary/50"
                                        />
                                        <p className="text-xs text-muted-foreground dark:text-gray-500">
                                            Positive = They owe you, Negative = You owe them
                                        </p>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-foreground dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-foreground dark:hover:text-white">
                                        Cancel
                                    </Button>
                                    <Button onClick={handleAddCustomer} disabled={isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
                                        Add Customer
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>

                {/* Filters */}
                <div className="p-6 space-y-4 border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                        <button
                            onClick={() => setBalanceFilter('all')}
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                                balanceFilter === 'all'
                                    ? 'bg-primary/20 text-primary border border-primary/50 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]'
                                    : 'bg-white dark:bg-white/5 text-muted-foreground dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-primary/50'
                            )}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setBalanceFilter('positive')}
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                                balanceFilter === 'positive'
                                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                    : 'bg-white dark:bg-white/5 text-muted-foreground dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-primary/50'
                            )}
                        >
                            Receivable
                        </button>
                        <button
                            onClick={() => setBalanceFilter('negative')}
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                                balanceFilter === 'negative'
                                    ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                                    : 'bg-white dark:bg-white/5 text-muted-foreground dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-primary/50'
                            )}
                        >
                            Payable
                        </button>
                        <button
                            onClick={() => setBalanceFilter('zero')}
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                                balanceFilter === 'zero'
                                    ? 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-500/50 shadow-[0_0_15px_rgba(107,114,128,0.3)]'
                                    : 'bg-white dark:bg-white/5 text-muted-foreground dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-primary/50'
                            )}
                        >
                            Settled
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search customers..."
                            className="pl-9 h-11 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-gray-500 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all duration-300"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Customer Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                            <TableRow className="hover:bg-transparent border-gray-200 dark:border-white/10">
                                <TableHead className="text-primary glow-text-sm">Customer</TableHead>
                                <TableHead className="text-primary glow-text-sm">Contact</TableHead>
                                <TableHead className="text-right text-primary glow-text-sm">Given</TableHead>
                                <TableHead className="text-right text-primary glow-text-sm">Received</TableHead>
                                <TableHead className="text-right text-primary glow-text-sm">Balance</TableHead>
                                <TableHead className="text-center text-primary glow-text-sm">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCustomers.length === 0 ? (
                                <TableRow className="border-gray-100 dark:border-white/5 hover:bg-transparent">
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground dark:text-gray-500">
                                        {searchTerm || balanceFilter !== 'all'
                                            ? 'No customers found matching your filters'
                                            : 'No customers yet. Add your first customer to get started!'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <TableRow key={customer.id} className="hover:bg-gray-50 dark:hover:bg-white/5 border-b border-gray-100 dark:border-white/5 transition-colors">
                                        <TableCell className="font-medium text-foreground dark:text-white">{customer.name}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground dark:text-gray-400">
                                            {customer.phone || '-'}
                                        </TableCell>
                                        <TableCell className="text-right text-emerald-600 dark:text-emerald-400 font-medium">
                                            ₹{formatCurrency(customer.total_given)}
                                        </TableCell>
                                        <TableCell className="text-right text-blue-600 dark:text-blue-400 font-medium">
                                            ₹{formatCurrency(customer.total_received)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge
                                                variant={customer.current_balance >= 0 ? 'default' : 'destructive'}
                                                className={cn(
                                                    "font-mono",
                                                    customer.current_balance > 0 && 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                                                    customer.current_balance < 0 && 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/20',
                                                    customer.current_balance === 0 && 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/20'
                                                )}
                                            >
                                                ₹{formatCurrency(Math.abs(customer.current_balance))}
                                                {customer.current_balance > 0 ? ' Dr' : customer.current_balance < 0 ? ' Cr' : ''}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                                                    onClick={() => router.push(`/shop/${shopId}/khata/${customer.id}`)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-500/10"
                                                    onClick={() => handleDeleteCustomer(customer.id, customer.name)}
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
