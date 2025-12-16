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
import { haptics } from '@/lib/haptics';
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

type CustomerStats = {
    totalPurchase: number;
    invoiceCount: number;
    lastPurchase: string;
};

type CustomersClientProps = {
    customerData: Record<string, CustomerStats>;
    shopId: string;
};

export function CustomersClient({ customerData, shopId }: CustomersClientProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [isPending, startTransition] = useTransition();
    const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        gstNumber: '',
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
                setNewCustomer({ name: '', phone: '', email: '', address: '', gstNumber: '' });
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

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredCustomers = useMemo(() => {
        return Object.entries(customerData).filter(([name]) =>
            name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [customerData, searchTerm]);

    const paginatedCustomers = useMemo(() => {
        const sorted = filteredCustomers.sort(([, a], [, b]) => b.totalPurchase - a.totalPurchase);
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sorted.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredCustomers, currentPage]);

    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

    const topCustomer = useMemo(() => {
        const customers = Object.entries(customerData);
        if (customers.length === 0) return null;
        return customers.reduce((prev, current) =>
            (prev[1].totalPurchase > current[1].totalPurchase) ? prev : current
        );
    }, [customerData]);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };


    const handleExport = async ({ dateRange }: { dateRange?: DateRange }) => {
        const filteredData = Object.entries(customerData).filter(([_, stats]) => {
            if (!dateRange?.from) return true;

            const lastPurchaseDate = new Date(stats.lastPurchase);
            if (dateRange.from) {
                const start = startOfDay(dateRange.from);
                if (lastPurchaseDate < start) return false;
            }
            if (dateRange.to) {
                const end = endOfDay(dateRange.to);
                if (lastPurchaseDate > end) return false;
            } else if (dateRange.from) {
                // If only from is set, treat as single day? Or start -> infinity? 
                // Usually range picker sets both or just from. 
                // Let's assume if only from is set, we check >= from.
                // Wait, logic above handles >= start. 
                // If to is undefined, we usually don't limit end, or limit to end of 'from' day?
                // Standard behavior: if only 'from' selected, it might just be 'after X'.
                // But date-fns/react-day-picker usually allows selecting a range.
                // Let's stick to: if 'to' is present, check <= to.
            }
            return true;
        });

        const exportData = filteredData.map(([name, stats]) => ({
            'Name': name,
            'Phone': '-', // Phone not in stats currently?
            'Email': '-',
            'Total Invoices': stats.invoiceCount,
            'Total Spent': stats.totalPurchase,
            'Last Purchase': stats.lastPurchase ? new Date(stats.lastPurchase).toLocaleDateString() : '-',
        }));

        return exportData;
    };

    return (
        <MotionWrapper className="pb-24 md:pb-6 max-w-[1800px] mx-auto pt-2 px-4 md:px-0">
            {/* Top Customer Card - Above sticky header */}
            {topCustomer && (
                <FadeIn>
                    <Card className="border-2 border-gray-300 dark:border-white/20 shadow-lg rounded-2xl mb-3">
                        <CardContent className="p-4 md:p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="p-2 md:p-3 bg-primary/10 rounded-full">
                                    <Trophy className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm font-medium text-muted-foreground">Top Customer</p>
                                    <h3 className="text-lg md:text-2xl font-bold text-foreground truncate max-w-[200px] md:max-w-[300px]">{topCustomer[0]}</h3>
                                    <p className="text-xs md:text-sm text-primary font-medium">
                                        {formatCurrency(topCustomer[1].totalPurchase)} Lifetime Spend
                                    </p>
                                </div>
                            </div>
                            <div className="hidden sm:block text-right">
                                <p className="text-sm text-muted-foreground">Total Invoices</p>
                                <p className="text-xl font-bold">{topCustomer[1].invoiceCount}</p>
                            </div>
                        </CardContent>
                    </Card>
                </FadeIn>
            )}

            {/* Sticky Header Section */}
            <div className="sticky top-0 z-20 bg-background pb-3 space-y-3 -mx-4 px-4 md:mx-0 md:px-0">
                {/* Search Bar */}
                <div className="flex items-center gap-2 pt-0">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                        <Input
                            placeholder="Search customers by name..."
                            className="pl-9 h-11 bg-white dark:bg-white/5 border-2 border-gray-300 dark:border-white/20 focus:border-primary rounded-xl backdrop-blur-sm transition-all shadow-sm w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex-1 sm:flex-initial h-11 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 rounded-xl font-medium">
                                <Plus className="h-4 w-4" />
                                <span>New Customer</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Customer</DialogTitle>
                                <DialogDescription>
                                    Create a new customer profile.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={newCustomer.name}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                        placeholder="Customer Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        value={newCustomer.phone}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                        placeholder="Phone Number"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={newCustomer.email}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                        placeholder="Email Address"
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
                                    <Label htmlFor="gst">GST Number</Label>
                                    <Input
                                        id="gst"
                                        value={newCustomer.gstNumber}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, gstNumber: e.target.value })}
                                        placeholder="GSTIN"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddCustomerOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleAddCustomer} disabled={isPending}>
                                    {isPending ? 'Creating...' : 'Create Customer'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <ExportDialog
                        onExport={handleExport}
                        filename={`customers-${new Date().toISOString().split('T')[0]}`}
                        trigger={
                            <Button variant="outline" className="flex-1 sm:flex-initial h-11 gap-2 bg-white dark:bg-white/5 border-2 border-gray-300 dark:border-white/20 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-primary rounded-xl">
                                <Download className="h-4 w-4" />
                                <span>Export</span>
                            </Button>
                        }
                    />
                </div>
            </div>

            {/* Customers Table/List - Scrollable Container */}
            <div className="space-y-3">
                {/* Desktop Table View */}
                <div className="hidden md:block">
                    <Card className="border-2 border-gray-300 dark:border-white/20 shadow-lg rounded-2xl overflow-hidden">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table className="table-modern">
                                    <TableHeader className="bg-muted/50 border-b-2 border-gray-300 dark:border-white/20 sticky top-0 z-10">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="w-[300px] text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider h-12">Customer</TableHead>
                                            <TableHead className="text-center text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider h-12">Invoices</TableHead>
                                            <TableHead className="text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider h-12">Last Purchase</TableHead>
                                            <TableHead className="text-right text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider h-12">Total Spent</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                {paginatedCustomers.length > 0 ? (
                                    paginatedCustomers
                                        .map(([name, stats]) => (
                                            <TableRow
                                                key={name}
                                                className="hover:bg-muted/50 cursor-pointer transition-colors"
                                                onClick={() => {
                                                    haptics.selection();
                                                    router.push(`/shop/${shopId}/customers/view?name=${encodeURIComponent(name)}`);
                                                }}
                                            >
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10 border border-border">
                                                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                                                {getInitials(name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium truncate max-w-[180px] md:max-w-[250px]">{name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="secondary" className="font-normal">
                                                        {stats.invoiceCount}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {new Date(stats.lastPurchase).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-primary">
                                                    {formatCurrency(stats.totalPurchase)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-96 text-center">
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
                                                        ? { label: 'Clear search', onClick: () => setSearchTerm('') }
                                                        : undefined
                                                }
                                            />
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Controls for Desktop */}
                    {filteredCustomers.length > itemsPerPage && (
                        <div className="flex items-center justify-between border-t-2 border-gray-300 dark:border-white/20 pt-4 px-4 pb-4">
                            <div className="text-sm text-muted-foreground">
                                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length} customers
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* Mobile View - Separate scrollable cards */}
        <div className="md:hidden space-y-3">
                        {paginatedCustomers.length > 0 ? (
                            paginatedCustomers
                                .map(([name, stats]) => (
                                    <div
                                        key={name}
                                        onClick={() => {
                                            haptics.selection();
                                            router.push(`/shop/${shopId}/customers/view?name=${encodeURIComponent(name)}`);
                                        }}
                                        className="flex flex-col gap-3 p-5 border-2 border-gray-300 dark:border-white/20 rounded-2xl bg-card shadow-lg active:shadow-xl active:scale-[0.98] transition-all touch-manipulation"
                                        style={{ WebkitTapHighlightColor: 'transparent' }}
                                    >
                                        <div className="flex justify-between items-start w-full">
                                            <div className="flex-1 min-w-0 pr-4">
                                                <h3 className="font-bold text-lg text-foreground truncate leading-tight">{name}</h3>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    <span>
                                                        {new Date(stats.lastPurchase).toLocaleDateString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="font-bold text-lg text-primary tracking-tight">{formatCurrency(stats.totalPurchase)}</p>
                                                <div className="flex justify-end mt-1">
                                                    <Badge variant="secondary" className="text-[10px] h-5 px-2 font-medium bg-secondary/50 text-secondary-foreground">
                                                        {stats.invoiceCount} Orders
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
                                            ? { label: 'Clear search', onClick: () => setSearchTerm('') }
                                            : undefined
                                    }
                                />
                            </div>
                        )}
                </div>

                {/* Pagination Controls for Mobile */}
                {filteredCustomers.length > itemsPerPage && (
                    <div className="flex items-center justify-between pt-4">
                        <div className="text-sm text-muted-foreground">
                            {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </MotionWrapper>
    );
}
