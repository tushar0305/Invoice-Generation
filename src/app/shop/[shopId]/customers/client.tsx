/**
 * Customers Client Component
 * Handles all interactive UI for the customers page
 */

'use client';

import { useState, useMemo } from 'react';
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
import { Search, Trophy, Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { MotionWrapper, FadeIn } from '@/components/ui/motion-wrapper';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { haptics } from '@/lib/haptics';

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
    const [searchTerm, setSearchTerm] = useState('');

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
        <MotionWrapper className="space-y-6">
            {/* Top Customer Card */}
            {topCustomer && (
                <FadeIn>
                    <Card className="bg-gradient-to-br from-gold-500/10 to-primary/5 border-gold-500/20">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gold-500/20 rounded-full">
                                    <Trophy className="h-8 w-8 text-gold-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Top Customer</p>
                                    <h3 className="text-2xl font-bold text-foreground">{topCustomer[0]}</h3>
                                    <p className="text-sm text-gold-600 font-medium">
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

            <Card className="glass-card border-t-4 border-t-primary">
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="hidden md:block">
                            <CardTitle className="text-xl sm:text-2xl font-heading text-primary">All Customers</CardTitle>
                            <CardDescription className="text-xs sm:text-sm mt-1">
                                Manage and view your customer base
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search customers..."
                                    className="pl-10 bg-background/50"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-9 gap-2 shrink-0"
                                onClick={handleExport}
                            >
                                <Download className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Export</span>
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="hidden md:block rounded-md border border-border overflow-hidden">
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
                                                        <span className="font-medium">{name}</span>
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
                                        <TableCell colSpan={4} className="text-center h-32 text-muted-foreground">
                                            No customers found.
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
                                        className="flex items-center gap-4 p-4 border rounded-xl bg-card hover:bg-accent/50 transition-colors active:scale-[0.98]"
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
                            <div className="text-center py-8 text-muted-foreground">
                                No customers found.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </MotionWrapper>
    );
}
