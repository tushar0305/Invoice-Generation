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
        referralCode: '',
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
                    <Card className="border-none shadow-xl shadow-primary/5 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-900/50 rounded-3xl mb-6 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                        <CardContent className="p-6 md:p-8 flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4 md:gap-6">
                                <div className="p-3 md:p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl shadow-inner">
                                    <Trophy className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">Top Customer</p>
                                    <h3 className="text-xl md:text-3xl font-bold text-foreground truncate max-w-[200px] md:max-w-[400px]">{topCustomer[0]}</h3>
                                    <p className="text-sm md:text-base text-primary font-semibold mt-1">
                                        {formatCurrency(topCustomer[1].totalPurchase)} <span className="text-muted-foreground font-normal">Lifetime Spend</span>
                                    </p>
                                </div>
                            </div>
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-medium text-muted-foreground">Total Invoices</p>
                                <p className="text-3xl font-bold text-foreground">{topCustomer[1].invoiceCount}</p>
                            </div>
                        </CardContent>
                    </Card>
                </FadeIn>
            )}

            {/* Sticky Header Section */}
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl pb-4 pt-2 space-y-4 -mx-4 px-4 md:mx-0 md:px-0 transition-all duration-200">
                {/* Search Bar */}
                <div className="flex items-center gap-3">
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
                            <Button variant="outline" className="h-12 px-6 gap-2 bg-card border-none shadow-lg shadow-gray-200/50 dark:shadow-black/20 hover:bg-primary hover:text-primary-foreground rounded-full transition-all">
                                <Download className="h-4 w-4" />
                                <span className="hidden sm:inline">Export</span>
                            </Button>
                        }
                    />
                    
                    <Button 
                        onClick={() => setIsAddCustomerOpen(true)}
                        className="h-12 px-6 gap-2 rounded-full shadow-lg shadow-primary/20 transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Add Customer</span>
                    </Button>
                </div>
            </div>

            {/* Customers Table/List - Scrollable Container */}
            <div className="space-y-4">
                {/* Desktop Table View */}
                <div className="hidden md:block">
                    <Card className="border-none shadow-xl shadow-gray-200/50 dark:shadow-black/20 rounded-3xl overflow-hidden bg-card">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow className="hover:bg-transparent border-b border-border/50">
                                            <TableHead className="w-[300px] text-muted-foreground font-bold text-xs uppercase tracking-wider h-14 pl-6">Customer</TableHead>
                                            <TableHead className="text-center text-muted-foreground font-bold text-xs uppercase tracking-wider h-14">Invoices</TableHead>
                                            <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider h-14">Last Purchase</TableHead>
                                            <TableHead className="text-right text-muted-foreground font-bold text-xs uppercase tracking-wider h-14 pr-6">Total Spent</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedCustomers.length > 0 ? (
                                            paginatedCustomers
                                                .map(([name, stats]) => (
                                                    <TableRow
                                                        key={name}
                                                        className="hover:bg-muted/30 cursor-pointer transition-colors border-b border-border/50 last:border-0"
                                                        onClick={() => {
                                                            router.push(`/shop/${shopId}/customers/view?name=${encodeURIComponent(name)}`);
                                                        }}
                                                    >
                                                        <TableCell className="pl-6 py-4">
                                                            <div className="flex items-center gap-4">
                                                                <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                                                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-sm">
                                                                        {getInitials(name)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="font-semibold text-foreground truncate max-w-[180px] md:max-w-[250px]">{name}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center py-4">
                                                            <Badge variant="secondary" className="font-medium bg-secondary/50 hover:bg-secondary/70 transition-colors px-3 py-1 rounded-full">
                                                                {stats.invoiceCount}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground font-medium py-4">
                                                            {new Date(stats.lastPurchase).toLocaleDateString('en-IN', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold text-foreground pr-6 py-4">
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
                                <div className="flex items-center justify-between border-t border-border/50 p-4 bg-muted/10">
                                    <div className="text-sm text-muted-foreground font-medium">
                                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length} customers
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="rounded-full px-4 border-none shadow-sm bg-background hover:bg-muted"
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="rounded-full px-4 border-none shadow-sm bg-background hover:bg-muted"
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
                                        router.push(`/shop/${shopId}/customers/view?name=${encodeURIComponent(name)}`);
                                    }}
                                    className="flex flex-col gap-3 p-5 border-none shadow-lg shadow-gray-200/50 dark:shadow-black/20 rounded-2xl bg-card active:scale-[0.98] transition-all touch-manipulation"
                                    style={{ WebkitTapHighlightColor: 'transparent' }}
                                >
                                    <div className="flex justify-between items-start w-full">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <h3 className="font-bold text-lg text-foreground truncate leading-tight">{name}</h3>
                                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mt-2">
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
                                            <div className="flex justify-end mt-2">
                                                <Badge variant="secondary" className="text-[10px] h-6 px-2.5 font-semibold bg-secondary/50 text-secondary-foreground rounded-full">
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
        </MotionWrapper>
    );
}
