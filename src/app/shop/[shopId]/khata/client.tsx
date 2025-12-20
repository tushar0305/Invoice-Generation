'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Plus, Search, TrendingUp, TrendingDown, Users, Wallet, Eye, Trash2, ChevronLeft, ChevronRight, X, Phone, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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

    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    // URL sync for search
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        const currentSearch = params.get('search') || '';
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

    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        const urlSearch = params.get('search') || '';
        if (urlSearch !== searchTerm && urlSearch !== debouncedSearch) {
            setSearchTerm(urlSearch);
        }
    }, [searchParams]);

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

    const handlePageChange = (newPage: number) => {
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
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Customer name is required' });
            return;
        }

        startTransition(async () => {
            try {
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
                    if (error.code === 'P0001' || error.message?.includes('already exists') || error.code === '23505') {
                        toast({ variant: 'destructive', title: 'Customer Exists', description: 'A customer with this phone number already exists.' });
                        return;
                    }
                    throw error;
                }

                toast({ title: 'Customer Added', description: `${newCustomer.name} has been added to your khata book` });
                setIsAddDialogOpen(false);
                setNewCustomer({ name: '', phone: '', address: '', opening_balance: 0 });
                router.refresh();
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to add customer' });
            }
        });
    };

    const handleDeleteCustomer = async () => {
        if (!customerToDelete) return;
        const { id: customerId, name: customerName } = customerToDelete;

        startTransition(async () => {
            try {
                const { error } = await supabase
                    .from('customers')
                    .update({ deleted_at: new Date().toISOString() })
                    .eq('id', customerId);

                if (error) throw error;
                toast({ title: 'Customer Deleted', description: `${customerName} has been removed` });
                setCustomerToDelete(null);
                router.refresh();
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete' });
            }
        });
    };

    const filters = [
        { id: 'all', label: 'All' },
        { id: 'receivable', label: 'To Collect', color: 'emerald' },
        { id: 'payable', label: 'To Pay', color: 'red' },
        { id: 'settled', label: 'Settled', color: 'gray' }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            {/* Mobile Header - Native App Style */}
            <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/40 md:hidden">
                <div className="px-4 py-3">
                    <h1 className="text-xl font-bold">Khata Book</h1>
                    <p className="text-xs text-muted-foreground">Track credits & payments</p>
                </div>
            </div>

            {/* Stats Summary - Horizontal Scroll on Mobile */}
            <div className="px-4 pt-4 md:pt-6">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {/* Net Balance - Featured */}
                    <Card className={cn(
                        "col-span-2 md:col-span-1 border-0 shadow-lg",
                        stats.net_balance >= 0
                            ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                            : "bg-gradient-to-br from-red-500 to-red-600"
                    )}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-white/80">Net Balance</span>
                                <Wallet className="h-4 w-4 text-white/80" />
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {formatCurrency(Math.abs(stats.net_balance))}
                            </div>
                            <p className="text-xs text-white/70 mt-0.5">
                                {stats.net_balance >= 0 ? 'To collect' : 'To pay'}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Total Receivable */}
                    <Card className="bg-card border-border/50">
                        <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-medium text-muted-foreground">Receivable</span>
                                <ArrowDownRight className="h-3.5 w-3.5 text-emerald-500" />
                            </div>
                            <div className="text-base font-bold text-emerald-600">{formatCurrency(stats.total_receivable)}</div>
                            <p className="text-[9px] text-muted-foreground">To collect</p>
                        </CardContent>
                    </Card>

                    {/* Total Payable */}
                    <Card className="bg-card border-border/50">
                        <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-medium text-muted-foreground">Payable</span>
                                <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />
                            </div>
                            <div className="text-base font-bold text-red-600">{formatCurrency(stats.total_payable)}</div>
                            <p className="text-[9px] text-muted-foreground">To pay</p>
                        </CardContent>
                    </Card>

                    {/* Total Customers - Hidden on mobile, shown on desktop */}
                    <Card className="hidden md:block bg-card border-border/50">
                        <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-medium text-muted-foreground">Customers</span>
                                <Users className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <div className="text-base font-bold">{stats.total_customers}</div>
                            <p className="text-[9px] text-muted-foreground">Active accounts</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Search & Filters - Sticky on Mobile */}
            <div className="sticky top-[68px] md:top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border/40 px-4 py-3">
                <div className="flex items-center gap-2 mb-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search customers..."
                            className="pl-9 h-10 bg-muted/50 border-0 rounded-xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="icon" className="h-10 w-10 rounded-xl shrink-0">
                                <Plus className="h-5 w-5" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Add Customer</DialogTitle>
                                <DialogDescription>Add a new customer to your khata book</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={newCustomer.name}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                        placeholder="Customer name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        value={newCustomer.phone}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                        placeholder="Phone number"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Input
                                        id="address"
                                        value={newCustomer.address}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                                        placeholder="Address"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="opening_balance">Opening Balance</Label>
                                    <Input
                                        id="opening_balance"
                                        type="number"
                                        step="0.01"
                                        value={newCustomer.opening_balance}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, opening_balance: parseFloat(e.target.value) || 0 })}
                                        placeholder="0.00"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Positive = They owe you, Negative = You owe them
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleAddCustomer} disabled={isPending}>Add Customer</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filter Pills */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                    {filters.map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => handleFilterChange(filter.id)}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                                currentFilter === filter.id
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Customer List */}
            <div className="px-4 pb-24 md:pb-8">
                {/* Mobile View - Native Card Style */}
                <div className="md:hidden space-y-2 pt-4">
                    {customers.length === 0 ? (
                        <div className="text-center py-16">
                            <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                            <p className="text-muted-foreground">
                                {searchTerm || currentFilter !== 'all' ? 'No customers found' : 'No customers yet'}
                            </p>
                            <Button variant="outline" className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" /> Add Customer
                            </Button>
                        </div>
                    ) : (
                        customers.map((customer) => (
                            <button
                                key={customer.id}
                                onClick={() => router.push(`/shop/${shopId}/khata/${customer.id}`)}
                                className="w-full text-left bg-card hover:bg-muted/50 active:scale-[0.99] transition-all rounded-xl p-4 border border-border/50"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {/* Avatar */}
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                                            customer.current_balance > 0
                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                : customer.current_balance < 0
                                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                    : "bg-muted text-muted-foreground"
                                        )}>
                                            {customer.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-medium truncate">{customer.name}</h3>
                                            {customer.phone && (
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {customer.phone}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 pl-3">
                                        <div className={cn(
                                            "text-base font-bold",
                                            customer.current_balance > 0 ? "text-emerald-600" :
                                                customer.current_balance < 0 ? "text-red-600" : "text-muted-foreground"
                                        )}>
                                            {formatCurrency(Math.abs(customer.current_balance))}
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className={cn(
                                                "text-[9px] px-1.5 h-4 font-medium",
                                                customer.current_balance > 0
                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                    : customer.current_balance < 0
                                                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                        : "bg-muted text-muted-foreground"
                                            )}
                                        >
                                            {customer.current_balance > 0 ? 'WILL PAY' : customer.current_balance < 0 ? 'TO PAY' : 'SETTLED'}
                                        </Badge>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {/* Desktop View - Clean Table */}
                <div className="hidden md:block pt-4">
                    <Card className="border-border/50">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead className="text-right">Given</TableHead>
                                    <TableHead className="text-right">Received</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                    <TableHead className="text-center w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                            {searchTerm || currentFilter !== 'all' ? 'No customers found' : 'No customers yet. Add your first customer!'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    customers.map((customer) => (
                                        <TableRow key={customer.id} className="hover:bg-muted/50">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                                                        customer.current_balance > 0
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : customer.current_balance < 0
                                                                ? "bg-red-100 text-red-700"
                                                                : "bg-muted text-muted-foreground"
                                                    )}>
                                                        {customer.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium">{customer.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{customer.phone || '-'}</TableCell>
                                            <TableCell className="text-right text-emerald-600 font-medium">
                                                {formatCurrency(customer.total_spent)}
                                            </TableCell>
                                            <TableCell className="text-right text-blue-600 font-medium">
                                                {formatCurrency(customer.total_paid)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className={cn(
                                                    "font-bold",
                                                    customer.current_balance > 0 ? "text-emerald-600" :
                                                        customer.current_balance < 0 ? "text-red-600" : "text-muted-foreground"
                                                )}>
                                                    {formatCurrency(Math.abs(customer.current_balance))}
                                                </span>
                                                <span className="text-xs text-muted-foreground ml-1">
                                                    {customer.current_balance > 0 ? 'Dr' : customer.current_balance < 0 ? 'Cr' : ''}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => router.push(`/shop/${shopId}/khata/${customer.id}`)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
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

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="p-4 border-t border-border/50 flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                    Page {pagination.currentPage} of {pagination.totalPages}
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                                        disabled={pagination.currentPage <= 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                                        disabled={pagination.currentPage >= pagination.totalPages}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Mobile Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="md:hidden flex items-center justify-center gap-4 pt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage <= 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            {pagination.currentPage} / {pagination.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage >= pagination.totalPages}
                        >
                            Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
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
        </div>
    );
}
