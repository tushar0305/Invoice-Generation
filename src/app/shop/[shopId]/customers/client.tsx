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

    const filteredCustomers = useMemo(() => {
        return Object.entries(customerData).filter(([name]) =>
            name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [customerData, searchTerm]);

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

    const handleExport = () => {
        import('@/lib/export-excel').then(({ exportCustomersToExcel }) => {
            const exportData = Object.entries(customerData).map(([name, stats]) => ({
                name,
                phone: '-',
                email: '-',
                invoiceCount: stats.invoiceCount,
                totalSpent: stats.totalPurchase,
                lastPurchase: stats.lastPurchase,
            }));
            exportCustomersToExcel(exportData, 'customers');
        });
    };

    return (
        <MotionWrapper className="space-y-4 px-4 md:px-6 pb-24 md:pb-6 max-w-[1800px] mx-auto pt-6">
            {/* Top Customer Card */}
            {topCustomer && (
                <FadeIn>
                    <Card className="border border-border shadow-sm mt-4 md:mt-0">
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

            <Card className="border border-border shadow-sm">
                {/* Search Header - Sticky on mobile for checks */}
                <CardHeader className="pb-3 border-b sticky top-0 z-30 bg-background pt-4 md:pt-6">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="md:block hidden">
                                <CardTitle className="text-xl sm:text-2xl font-heading text-primary">Customers</CardTitle>
                                <CardDescription className="text-xs sm:text-sm mt-1">
                                    Manage and view your customer base
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <div className="relative flex-1 md:w-64 md:flex-none">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search customers..."
                                        className="pl-10 bg-background/50"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="gap-2 shadow-lg shadow-primary/25 shrink-0">
                                            <Plus className="h-4 w-4" />
                                            <span className="hidden sm:inline">New Customer</span>
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
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 gap-2 shrink-0 hidden sm:flex"
                                    onClick={handleExport}
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Export</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="hidden md:block rounded-xl border border-border overflow-hidden">
                        <Table className="table-modern">
                            <TableHeader className="bg-muted/50">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[300px]">Customer</TableHead>
                                    <TableHead className="text-center">Invoices</TableHead>
                                    <TableHead>Last Purchase</TableHead>
                                    <TableHead className="text-right">Total Spent</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCustomers.length > 0 ? (
                                    filteredCustomers
                                        .sort(([, a], [, b]) => b.totalPurchase - a.totalPurchase)
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

                    {/* Mobile View */}
                    <div className="md:hidden space-y-4">
                        {filteredCustomers.length > 0 ? (
                            filteredCustomers
                                .sort(([, a], [, b]) => b.totalPurchase - a.totalPurchase)
                                .map(([name, stats]) => (
                                    <div
                                        key={name}
                                        onClick={() => {
                                            haptics.selection();
                                            router.push(`/shop/${shopId}/customers/view?name=${encodeURIComponent(name)}`);
                                        }}
                                        className="flex items-center gap-4 p-4 border border-border rounded-xl bg-card hover:bg-accent/50 transition-colors active:scale-[0.98]"
                                    >
                                        <Avatar className="h-12 w-12 border border-border">
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                {getInitials(name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold truncate">{name}</h3>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>
                                                    {new Date(stats.lastPurchase).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short'
                                                    })}
                                                </span>
                                                <span>•</span>
                                                <span>{stats.invoiceCount} inv</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-primary">{formatCurrency(stats.totalPurchase)}</p>
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
                </CardContent>
            </Card>
        </MotionWrapper>
    );
}
