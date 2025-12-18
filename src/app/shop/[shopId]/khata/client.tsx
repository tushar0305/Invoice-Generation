'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Plus, Search, TrendingUp, TrendingDown, Users, Wallet, Eye, Trash2, Edit, IndianRupee, ChevronLeft, ChevronRight, RefreshCw, X } from 'lucide-react';
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import type { CustomerBalance, LedgerStats, LedgerTransaction } from '@/lib/ledger-types';
import { cn, formatCurrency } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { StatusBadge } from '@/components/ui/status-badge';

type KhataClientProps = {
    customers: CustomerBalance[];
    stats: LedgerStats;
    recentTransactions: LedgerTransaction[];
    shopId: string;
    userId: string;
    initialSearch?: string;
    initialBalanceType?: 'positive' | 'negative' | 'zero';
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
    }
};

export function KhataClient({
    customers,
    stats,
    recentTransactions,
    shopId,
    userId,
    initialSearch = '',
    initialBalanceType,
    pagination
}: KhataClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    // URL State Sync
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const debouncedSearch = useDebounce(searchTerm, 500);

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    // Sync Search with URL (Debounce Push)
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        const currentSearch = params.get('search') || '';

        // Only push if debounced value is different from URL and we have a value (or cleared it)
        // AND if local search term matches debounced (user stopped typing)
        if (debouncedSearch !== currentSearch) {
            if (debouncedSearch) {
                params.set('search', debouncedSearch);
            } else {
                params.delete('search');
            }
            params.set('page', '1');
            router.push(`${pathname}?${params.toString()}`);
        }
    }, [debouncedSearch, pathname, router, searchParams]);

    // Sync Input with URL (Popstate/Navigation)
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        const urlSearch = params.get('search') || '';
        if (urlSearch !== searchTerm && urlSearch !== debouncedSearch) {
            setSearchTerm(urlSearch);
        }
    }, [searchParams]); // updates when URL changes externally

    // Handle Filter Change
    const handleFilterChange = (filter: string) => {
        const params = new URLSearchParams(searchParams);
        if (filter !== 'all') {
            params.set('balance_type', filter);
        } else {
            params.delete('balance_type');
        }
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
    };

    const currentFilter = searchParams.get('balance_type') || 'all';

    // Handle Pagination
    const handlePageChange = (newPage: number) => {
        // Ensure newPage is a string because URLSearchParams expects strings
        const params = new URLSearchParams(searchParams);
        params.set('page', newPage.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone: '',
        address: '',
        opening_balance: 0,
    });
    const [customerToDelete, setCustomerToDelete] = useState<{ id: string, name: string } | null>(null);

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
                // Use the create_customer function or insert directly
                const { error } = await supabase.rpc('create_customer', {
                    p_shop_id: shopId,
                    p_name: newCustomer.name.trim(),
                    p_phone: newCustomer.phone.trim() || null,
                    p_email: null,
                    p_address: newCustomer.address.trim() || null,
                    p_state: null,
                    p_pincode: null,
                    p_gst_number: null,
                    p_opening_balance: newCustomer.opening_balance
                });

                if (error) {
                    // Check for custom conflict error or postgres unique violation
                    if (error.code === 'P0001' || error.message?.includes('already exists') || error.code === '23505') {
                        toast({
                            variant: 'destructive',
                            title: 'Customer Exists',
                            description: 'A customer with this phone number already exists in your records.',
                        });
                        return;
                    }
                    throw error;
                }

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
                    description: error.message || 'Failed to add customer. Please try again.',
                });
            }
        });
    };

    const handleDeleteCustomer = async () => {
        if (!customerToDelete) return;

        const { id: customerId, name: customerName } = customerToDelete;

        startTransition(async () => {
            try {
                // Soft delete customer
                const { error } = await supabase
                    .from('customers')
                    .update({ deleted_at: new Date().toISOString() })
                    .eq('id', customerId);

                if (error) throw error;

                toast({
                    title: 'Customer Deleted',
                    description: `${customerName} has been removed from your khata book`,
                });

                setCustomerToDelete(null);
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
        <div className="space-y-4 pb-24 px-4 md:px-0 pt-6">
            <div className="grid gap-3 md:gap-4 md:grid-cols-4">
                <Card className="rounded-2xl shadow-md hover:shadow-lg transition-all border border-white/40 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_customers}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Active accounts
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-md hover:shadow-lg transition-all border border-white/40 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-600">Receivable</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.total_receivable)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            To be collected
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-md hover:shadow-lg transition-all border border-white/40 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-600">Payable</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.total_payable)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            To be paid
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-md hover:shadow-lg transition-all border border-white/40 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-primary">Net Balance</CardTitle>
                        <Wallet className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", stats.net_balance >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                            {formatCurrency(Math.abs(stats.net_balance))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.net_balance >= 0 ? 'Net receivable' : 'Net payable'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Card */}
            <Card className="rounded-2xl shadow-lg border border-white/40 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl">
                {/* Header */}
                <CardHeader className="border-b border-white/40 dark:border-white/10">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle className="text-2xl font-bold text-foreground">Customer Ledger</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">Manage customer credit and debit accounts</p>
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

                {/* Sticky Header Section */}
                <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md pb-2 -mx-4 px-4 md:mx-0 md:px-0 border-b border-border/40 transition-all duration-300">
                    <div className="flex flex-col gap-3 pt-2 pb-2">
                        {/* Search and Main Actions */}
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                                <Input
                                    placeholder="Search by name or phone..."
                                    className="pl-9 h-11 bg-white dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 focus:border-primary rounded-xl transition-all shadow-sm w-full"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 z-10 hover:bg-transparent text-muted-foreground hover:text-foreground"
                                        onClick={() => setSearchTerm('')}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            {/* Refresh Button */}
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                    startTransition(() => {
                                        router.refresh();
                                    });
                                }}
                                className="shrink-0 h-11 w-11 rounded-xl bg-white dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 hover:border-primary hover:bg-gray-50 dark:hover:bg-white/10"
                            >
                                <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
                            </Button>

                            {/* Add Button (Mobile Only shortcut?) - kept in main card header usually, but good here too */}
                        </div>

                        {/* Scrollable Filter Pills */}
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                            {[
                                { id: 'all', label: 'All Customers' },
                                { id: 'receivable', label: 'Receivable', color: 'emerald' },
                                { id: 'payable', label: 'Payable', color: 'red' },
                                { id: 'settled', label: 'Settled', color: 'gray' }
                            ].map((filter) => (
                                <button
                                    key={filter.id}
                                    onClick={() => handleFilterChange(filter.id)}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap border h-9 flex items-center shadow-sm",
                                        currentFilter === filter.id
                                            ? `bg-${filter.color || 'primary'}-50 dark:bg-${filter.color || 'primary'}-900/20 border-${filter.color || 'primary'}-200 dark:border-${filter.color || 'primary'}-800 text-${filter.color || 'primary'}-700 dark:text-${filter.color || 'primary'}-300 ring-2 ring-${filter.color || 'primary'}-500/20`
                                            : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-muted-foreground hover:bg-gray-50 dark:hover:bg-white/10"
                                    )}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Customer List - Responsive View */}
                <div className="relative">
                    {/* Mobile View - Cards */}
                    <div className="md:hidden space-y-3 p-4">
                        {customers.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground dark:text-gray-500 bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-dashed border-white/30 dark:border-white/10">
                                {searchTerm || currentFilter !== 'all'
                                    ? 'No customers found matching your filters'
                                    : 'No customers yet. Add your first customer to get started!'}
                            </div>
                        ) : (
                            customers.map((customer) => (
                                <div
                                    key={customer.id}
                                    onClick={() => router.push(`/shop/${shopId}/khata/${customer.id}`)}
                                    className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-4 shadow-md active:scale-[0.99] transition-transform"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-semibold text-base text-foreground">{customer.name}</h3>
                                            <div className="text-xs text-muted-foreground">{customer.phone || 'No phone'}</div>
                                        </div>
                                        <div className="text-right min-w-[96px]">
                                            <div className={cn(
                                                "font-bold text-base",
                                                customer.current_balance > 0 ? "text-emerald-600" :
                                                    customer.current_balance < 0 ? "text-red-600" : "text-muted-foreground"
                                            )}>
                                                {formatCurrency(Math.abs(customer.current_balance))}
                                            </div>
                                            <div className="flex items-center justify-end gap-1 mt-1">
                                                <Badge variant="outline" className={cn(
                                                    "text-[10px] h-5 px-1.5 font-mono rounded-full",
                                                    customer.current_balance > 0 ? "text-emerald-700 border-emerald-300/60 bg-emerald-100/50" :
                                                        customer.current_balance < 0 ? "text-red-700 border-red-300/60 bg-red-100/50" : "text-gray-600 border-gray-300/60 bg-gray-100/50"
                                                )}>
                                                    {customer.current_balance > 0 ? 'RECEIVABLE' :
                                                        customer.current_balance < 0 ? 'PAYABLE' : 'SETTLED'}
                                                </Badge>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/40 dark:border-white/10">
                                        <div>
                                            <div className="text-[11px] text-muted-foreground mb-0.5">Total Given</div>
                                            <div className="font-medium text-emerald-600">{formatCurrency(customer.total_spent)}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[11px] text-muted-foreground mb-0.5">Total Received</div>
                                            <div className="font-medium text-blue-600">{formatCurrency(customer.total_paid)}</div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Desktop View - Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50 border-b border-border">
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
                                {customers.length === 0 ? (
                                    <TableRow className="border-gray-100 dark:border-white/5 hover:bg-transparent">
                                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground dark:text-gray-500">
                                            {searchTerm || currentFilter !== 'all'
                                                ? 'No customers found matching your filters'
                                                : 'No customers yet. Add your first customer to get started!'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    customers.map((customer) => (
                                        <TableRow key={customer.id} className="hover:bg-muted/50 border-b border-border transition-colors">
                                            <TableCell className="font-medium text-foreground dark:text-white">{customer.name}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground dark:text-gray-400">
                                                {customer.phone || '-'}
                                            </TableCell>
                                            <TableCell className="text-right text-emerald-600 dark:text-emerald-400 font-medium">
                                                {formatCurrency(customer.total_spent)}
                                            </TableCell>
                                            <TableCell className="text-right text-blue-600 dark:text-blue-400 font-medium">
                                                {formatCurrency(customer.total_paid)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <StatusBadge
                                                    status={customer.current_balance > 0 ? 'receivable' : customer.current_balance < 0 ? 'payable' : 'settled'}
                                                    className="font-mono"
                                                />
                                                <span className="ml-2 text-xs text-muted-foreground font-mono">
                                                    {formatCurrency(Math.abs(customer.current_balance))}
                                                    {customer.current_balance > 0 ? ' Dr' : customer.current_balance < 0 ? ' Cr' : ''}
                                                </span>
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
                                                        onClick={() => setCustomerToDelete({ id: customer.id, name: customer.name })}
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
                </div>

                {/* Pagination Controls */}
                {
                    pagination && pagination.totalPages > 1 && (
                        <div className="p-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage <= 1}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    disabled={pagination.currentPage >= pagination.totalPages}
                                >
                                    Next <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )
                }
            </Card >

            <AlertDialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove {customerToDelete?.name} from your Khata Book. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteCustomer}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
}
