/**
 * Customers Client Component
 * Handles all interactive UI for the customers page
 */

'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Trophy, Calendar, Download, Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { MotionWrapper, FadeIn } from '@/components/ui/motion-wrapper';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
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
import { ExportDialog } from '@/components/shared/export-dialog';
import { DateRange } from 'react-day-picker';
import { startOfDay, endOfDay } from 'date-fns';

export type CustomerDef = {
    id: string;
    name: string;
    phone: string;
    email: string;
    totalPurchase: number;
    invoiceCount: number;
    lastPurchase: string;
    city?: string;
    state?: string;
};

type CustomersClientProps = {
    initialCustomers: CustomerDef[];
    shopId: string;
    topCustomer: { name: string; totalPurchase: number; invoiceCount: number } | null;
    pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        limit: number;
    };
    searchParams?: { q?: string };
};

export function CustomersClient({ initialCustomers, shopId, topCustomer, pagination, searchParams }: CustomersClientProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState(searchParams?.q || '');
    const [isPending, startTransition] = useTransition();
    const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        gstNumber: '',
        referralCode: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(window.location.search);
        if (searchTerm) {
            params.set('q', searchTerm);
            params.set('page', '1');
        } else {
            params.delete('q');
            params.set('page', '1');
        }
        router.push(`?${params.toString()}`);
    };

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
                const response = await fetch('/api/v1/customers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        shopId,
                        ...newCustomer,
                    }),
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Failed to create customer');
                }

                toast({
                    title: 'Success',
                    description: 'Customer created successfully',
                });

                setIsAddCustomerOpen(false);
                setNewCustomer({ name: '', phone: '', email: '', address: '', gstNumber: '', referralCode: '' });
                router.refresh();
            } catch (error: any) {
                console.error('Create customer error:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: error.message || 'Failed to create customer',
                });
            }
        });
    };

    const getInitials = (name: string) => {
        return (name || 'Unknown')
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handleExport = async ({ dateRange }: { dateRange?: DateRange }) => {
        // Implement export logic if needed, likely requires fetching all data from server
        // specific to export, similar to invoices.
        // For now, alerting user or implementing a basic fetch.
        // Since we don't have all data client side, we should ideally call an API or server action.
        // Placeholder:
        toast({ title: 'Export', description: 'Exporting current view...' });
        return initialCustomers.map(c => ({
            'Name': c.name,
            'Phone': c.phone,
            'Email': c.email,
            'Total Invoices': c.invoiceCount,
            'Total Spent': c.totalPurchase,
            'Last Purchase': c.lastPurchase ? new Date(c.lastPurchase).toLocaleDateString() : '-',
        }));
    };

    return (
        <MotionWrapper className="pb-24 md:pb-6 max-w-[1800px] mx-auto pt-2 px-4 md:px-0">
            {/* Top Customer Card - Above sticky header */}
            {topCustomer && (
                <FadeIn>
                    <Card className="border-none shadow-xl shadow-primary/5 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-900/50 rounded-3xl mb-6 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                        <CardContent className="p-6 md:p-8 flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4 md:gap-6">
                                <div className="p-3 md:p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl shadow-inner">
                                    <Trophy className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">Top Customer</p>
                                    <h3 className="text-xl md:text-3xl font-bold text-foreground truncate max-w-[200px] md:max-w-[400px]">{topCustomer.name}</h3>
                                    <p className="text-sm md:text-base text-primary font-semibold mt-1">
                                        {formatCurrency(topCustomer.totalPurchase)} <span className="text-muted-foreground font-normal">Lifetime Spend</span>
                                    </p>
                                </div>
                            </div>
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-medium text-muted-foreground">Total Invoices</p>
                                <p className="text-3xl font-bold text-foreground">{topCustomer.invoiceCount}</p>
                            </div>
                        </CardContent>
                    </Card>
                </FadeIn>
            )}

            {/* Sticky Header Section */}
            <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl pb-4 pt-2 space-y-4 -mx-4 px-4 md:mx-0 md:px-0 transition-all duration-200">
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="flex items-center gap-3">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10 pointer-events-none" />
                        <Input
                            placeholder="Search customers by name..."
                            className="pl-11 h-12 bg-card border-none shadow-lg shadow-gray-200/50 dark:shadow-black/20 focus:ring-2 focus:ring-primary/20 rounded-full transition-all w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <ExportDialog
                        onExport={handleExport}
                        filename={`customers-${new Date().toISOString().split('T')[0]}`}
                        trigger={
                            <Button type="button" variant="outline" className="h-12 px-6 gap-2 bg-card border-none shadow-lg shadow-gray-200/50 dark:shadow-black/20 hover:bg-primary hover:text-primary-foreground rounded-full transition-all">
                                <Download className="h-4 w-4" />
                                <span className="hidden sm:inline">Export</span>
                            </Button>
                        }
                    />

                    <Button
                        type="button"
                        onClick={() => setIsAddCustomerOpen(true)}
                        className="h-12 px-6 gap-2 rounded-full shadow-lg shadow-primary/20 transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Add Customer</span>
                    </Button>
                </form>
            </div>

            {/* Customers Table/List - Scrollable Container */}
            <div className="space-y-4">
                {/* Desktop Table View - Fixed Layout */}
                <div className="hidden md:flex flex-col max-h-[calc(100dvh-180px)] rounded-2xl border-2 border-gray-300 dark:border-white/20 overflow-hidden bg-card shadow-lg relative">
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                        <Table className="table-modern min-w-[1000px] relative">
                            <TableHeader className="bg-muted/50 border-b-2 border-gray-300 dark:border-white/20 sticky top-0 z-20 shadow-sm backdrop-blur-sm">
                                <TableRow className="hover:bg-transparent border-b border-border/50">
                                    <TableHead className="text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider h-10 pl-6">Customer</TableHead>
                                    <TableHead className="w-[200px] text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider h-10">Contact Info</TableHead>
                                    <TableHead className="w-[150px] text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider h-10">City/State</TableHead>
                                    <TableHead className="w-[100px] text-center text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider h-10">Invoices</TableHead>
                                    <TableHead className="w-[150px] text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider h-10">Last Purchase</TableHead>
                                    <TableHead className="w-[100px] text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider h-10">Status</TableHead>
                                    <TableHead className="text-right text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider h-10 pr-6">Total Spent</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {initialCustomers.length > 0 ? (
                                    initialCustomers.map((customer) => (
                                        <TableRow
                                            key={customer.id}
                                            className="hover:bg-primary/5 cursor-pointer transition-colors border-b border-border/50 last:border-0 group"
                                            onClick={() => {
                                                router.push(`/shop/${shopId}/customers/view?name=${encodeURIComponent(customer.name)}`);
                                            }}
                                        >
                                            <TableCell className="pl-6 py-2">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="h-8 w-8 border-2 border-background shadow-sm ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                                                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-xs">
                                                            {getInitials(customer.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col max-w-[180px]">
                                                        <span className="font-semibold text-foreground truncate text-sm">{customer.name}</span>
                                                        <span className="text-[10px] text-muted-foreground truncate">{customer.email || '-'}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2">
                                                <div className="flex flex-col text-xs">
                                                    <span className="flex items-center gap-1.5 text-foreground font-medium">
                                                        {customer.phone || '-'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2">
                                                <span className="text-xs text-muted-foreground">
                                                    {customer.city || customer.state || '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center py-2">
                                                <Badge variant="secondary" className="font-medium bg-secondary/50 hover:bg-secondary/70 transition-colors px-2 py-0.5 rounded-md h-5 text-[10px]">
                                                    {customer.invoiceCount}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground font-medium py-2 text-xs">
                                                {new Date(customer.lastPurchase).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </TableCell>
                                            <TableCell className="py-2">
                                                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 h-5 text-[10px] px-2">
                                                    Active
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-foreground pr-6 py-4">
                                                {formatCurrency(customer.totalPurchase)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-96 text-center">
                                            <EmptyState
                                                icon={Users}
                                                title="No customers found"
                                                description={searchTerm ? "Try adjusting your search terms." : "Your customer list is empty."}
                                                action={searchTerm ? { label: 'Clear search', onClick: () => { setSearchTerm(''); const p = new URLSearchParams(window.location.search); p.delete('q'); router.push(`?${p.toString()}`); } } : undefined}
                                            />
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    {/* Fixed Pagination Footer */}
                    {pagination && pagination.totalCount > 0 && (
                        <div className="flex items-center justify-between border-t border-gray-200 dark:border-white/10 p-4 bg-muted/20 backdrop-blur-sm z-20">
                            <div className="text-sm text-muted-foreground text-center sm:text-left">
                                Showing <span className="font-medium text-foreground">{(pagination?.currentPage - 1) * pagination?.limit + 1}</span> - <span className="font-medium text-foreground">{Math.min(pagination?.currentPage * pagination?.limit, pagination?.totalCount)}</span> of <span className="font-medium text-foreground">{pagination?.totalCount}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const p = new URLSearchParams(window.location.search);
                                        p.set('page', String(Math.max(1, pagination.currentPage - 1)));
                                        router.push(`?${p.toString()}`);
                                    }}
                                    disabled={pagination.currentPage <= 1}
                                    className="rounded-full px-4 border-none shadow-sm bg-background hover:bg-muted"
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const p = new URLSearchParams(window.location.search);
                                        p.set('page', String(Math.min(pagination.totalPages, pagination.currentPage + 1)));
                                        router.push(`?${p.toString()}`);
                                    }}
                                    disabled={pagination.currentPage >= pagination.totalPages}
                                    className="rounded-full px-4 border-none shadow-sm bg-background hover:bg-muted"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile View - Separate scrollable cards */}
                <div className="md:hidden space-y-3">
                    {
                        initialCustomers.length > 0 ? (
                            initialCustomers
                                .map((customer) => (
                                    <div
                                        key={customer.id}
                                        onClick={() => {
                                            router.push(`/shop/${shopId}/customers/view?name=${encodeURIComponent(customer.name)}`);
                                        }}
                                        className="flex flex-col gap-3 p-5 border-none shadow-lg shadow-gray-200/50 dark:shadow-black/20 rounded-2xl bg-card active:scale-[0.98] transition-all touch-manipulation"
                                        style={{ WebkitTapHighlightColor: 'transparent' }}
                                    >
                                        <div className="flex justify-between items-start w-full">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <h3 className="font-bold text-lg text-foreground truncate leading-tight">{customer.name}</h3>
                                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mt-2">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    <span>
                                                        {new Date(customer.lastPurchase).toLocaleDateString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="font-bold text-lg text-primary tracking-tight">{formatCurrency(customer.totalPurchase)}</p>
                                                <div className="flex justify-end mt-2">
                                                    <Badge variant="secondary" className="text-[10px] h-6 px-2.5 font-semibold bg-secondary/50 text-secondary-foreground rounded-full">
                                                        {customer.invoiceCount} Orders
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                        ) : (
                            <div className="py-12">
                                <EmptyState
                                    icon={Users}
                                    title="No customers found"
                                    description={
                                        searchTerm
                                            ? "Try adjusting your search terms."
                                            : "Your customer list is empty."
                                    }
                                    action={
                                        searchTerm
                                            ? { label: 'Clear search', onClick: () => { setSearchTerm(''); const p = new URLSearchParams(window.location.search); p.delete('q'); router.push(`?${p.toString()}`); } }
                                            : undefined
                                    }
                                />
                            </div>
                        )
                    }
                </div>

                {/* Pagination Controls for Mobile */}
                {
                    pagination && pagination.totalCount > 0 && (
                        <div className="flex items-center justify-between pt-4 md:hidden">
                            <div className="text-sm text-muted-foreground">
                                {((pagination.currentPage - 1) * pagination.limit) + 1}-{Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const p = new URLSearchParams(window.location.search);
                                        p.set('page', String(Math.max(1, pagination.currentPage - 1)));
                                        router.push(`?${p.toString()}`);
                                    }}
                                    disabled={pagination.currentPage <= 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const p = new URLSearchParams(window.location.search);
                                        p.set('page', String(Math.min(pagination.totalPages, pagination.currentPage + 1)));
                                        router.push(`?${p.toString()}`);
                                    }}
                                    disabled={pagination.currentPage >= pagination.totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )
                }
            </div>

            <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add New Customer</DialogTitle>
                        <DialogDescription>
                            Create a new customer profile. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={newCustomer.name}
                                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={newCustomer.phone}
                                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                placeholder="+91 98765 43210"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email (Optional)</Label>
                            <Input
                                id="email"
                                value={newCustomer.email}
                                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                placeholder="john@example.com"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="referral">Referral Code (Optional)</Label>
                            <Input
                                id="referral"
                                value={newCustomer.referralCode}
                                onChange={(e) => setNewCustomer({ ...newCustomer, referralCode: e.target.value })}
                                placeholder="Enter referral code"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddCustomerOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddCustomer} disabled={isPending}>
                            {isPending ? 'Creating...' : 'Create Customer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MotionWrapper >
    );
}
