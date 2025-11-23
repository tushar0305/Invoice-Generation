"use client";

import { useState, useMemo, useEffect } from 'react';
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
import { Search, Trophy, Calendar } from 'lucide-react';
import type { Invoice } from '@/lib/definitions';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/supabase/provider';
import { supabase } from '@/supabase/client';
import { MotionWrapper, FadeIn } from '@/components/ui/motion-wrapper';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { haptics } from '@/lib/haptics';

type CustomerStats = {
    totalPurchase: number;
    invoiceCount: number;
    lastPurchase: string;
};

import { useActiveShop } from '@/hooks/use-active-shop';

export default function CustomersPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useUser();
    const { activeShop } = useActiveShop();
    const [invoices, setInvoices] = useState<Invoice[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        let active = true;
        const load = async () => {
            if (!activeShop?.id) { setInvoices([]); setIsLoading(false); return; }
            setIsLoading(true);
            const { data, error } = await supabase
                .from('invoices')
                .select('id, user_id, invoice_number, invoice_date, customer_name, grand_total, status')
                .eq('shop_id', activeShop.id);
            if (!active) return;
            if (error) {
                console.error(error);
                setInvoices([]);
            } else {
                const mapped = (data ?? []).map((r: any) => ({
                    id: r.id,
                    userId: r.user_id,
                    invoiceNumber: r.invoice_number,
                    customerName: r.customer_name,
                    customerAddress: '',
                    customerState: '',
                    customerPincode: '',
                    customerPhone: '',
                    invoiceDate: r.invoice_date,
                    discount: 0,
                    sgst: 0,
                    cgst: 0,
                    status: r.status,
                    grandTotal: Number(r.grand_total) || 0,
                } as Invoice));
                setInvoices(mapped);
            }
            setIsLoading(false);
        };
        load();
        return () => { active = false; };
    }, [activeShop?.id]);

    const customerData = useMemo(() => {
        if (!invoices) return {};

        const data: Record<string, CustomerStats> = {};
        for (const invoice of invoices) {
            if (!data[invoice.customerName]) {
                data[invoice.customerName] = { totalPurchase: 0, invoiceCount: 0, lastPurchase: invoice.invoiceDate };
            }
            data[invoice.customerName].totalPurchase += invoice.grandTotal;
            data[invoice.customerName].invoiceCount++;
            if (new Date(invoice.invoiceDate) > new Date(data[invoice.customerName].lastPurchase)) {
                data[invoice.customerName].lastPurchase = invoice.invoiceDate;
            }
        }
        return data;
    }, [invoices]);

    const filteredCustomers = useMemo(() => {
        return Object.entries(customerData).filter(([name]) =>
            name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [customerData, searchTerm]);

    const topCustomer = useMemo(() => {
        const customers = Object.entries(customerData);
        if (customers.length === 0) return null;
        return customers.reduce((prev, current) => (prev[1].totalPurchase > current[1].totalPurchase) ? prev : current);
    }, [customerData]);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
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
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search customers..."
                                className="pl-10 bg-background/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
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
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={`cust-skeleton-${i}`}>
                                            <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-4 w-32" /></div></TableCell>
                                            <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredCustomers.length > 0 ? (
                                    filteredCustomers
                                        .sort(([, a], [, b]) => b.totalPurchase - a.totalPurchase)
                                        .map(([name, stats]) => (
                                            <TableRow
                                                key={name}
                                                className="hover:bg-muted/50 cursor-pointer transition-colors"
                                                onClick={() => {
                                                    haptics.selection();
                                                    router.push(`/dashboard/customers/view?name=${encodeURIComponent(name)}`);
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
                                                    {new Date(stats.lastPurchase).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
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
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={`mobile-skel-${i}`} className="flex items-center gap-4 p-4 border rounded-lg">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                </div>
                            ))
                        ) : filteredCustomers.length > 0 ? (
                            filteredCustomers
                                .sort(([, a], [, b]) => b.totalPurchase - a.totalPurchase)
                                .map(([name, stats]) => (
                                    <div
                                        key={name}
                                        onClick={() => {
                                            haptics.selection();
                                            router.push(`/dashboard/customers/view?name=${encodeURIComponent(name)}`);
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
                                                <span>{new Date(stats.lastPurchase).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
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
