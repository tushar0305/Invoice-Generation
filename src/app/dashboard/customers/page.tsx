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
import { Search } from 'lucide-react';
import type { Invoice } from '@/lib/definitions';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/supabase/provider';
import { supabase } from '@/supabase/client';


type CustomerStats = {
    totalPurchase: number;
    invoiceCount: number;
    lastPurchase: string;
};

import { MotionWrapper, FadeIn } from '@/components/ui/motion-wrapper';

export default function CustomersPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useUser();
    const [invoices, setInvoices] = useState<Invoice[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        let active = true;
        const load = async () => {
            if (!user) { setInvoices([]); setIsLoading(false); return; }
            setIsLoading(true);
            const { data, error } = await supabase
                .from('invoices')
                .select('id, user_id, invoice_number, invoice_date, customer_name, grand_total, status')
                .eq('user_id', user.uid);
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
    }, [user?.uid]);

    const customerData = useMemo(() => {
        if (!invoices) return {};

        const data: Record<string, CustomerStats> = {};
        for (const invoice of invoices) {
            if (!data[invoice.customerName]) {
                data[invoice.customerName] = { totalPurchase: 0, invoiceCount: 0, lastPurchase: invoice.invoiceDate };
            }

            // Sum across all invoices (paid + due) to reflect complete spend
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

    return (
        <MotionWrapper className="space-y-6">
            <Card className="glass-card border-t-4 border-t-primary">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl sm:text-2xl font-heading text-primary">All Customers</CardTitle>
                            <CardDescription className="text-xs sm:text-sm mt-1">
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="font-semibold text-foreground">{Object.keys(customerData).length}</span>
                                    <span>total {Object.keys(customerData).length === 1 ? 'customer' : 'customers'}</span>
                                </span>
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by customer name..."
                                className="pl-10 h-11 bg-background/50 backdrop-blur-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="hidden md:block rounded-md border border-white/10 overflow-hidden">
                        <Table className="table-modern">
                            <TableHeader className="bg-muted/50">
                                <TableRow className="hover:bg-transparent border-b-white/10">
                                    <TableHead className="font-semibold min-w-[120px] pl-4 text-primary">Customer</TableHead>
                                    <TableHead className="font-semibold min-w-[60px] text-center text-primary">Inv.</TableHead>
                                    <TableHead className="font-semibold min-w-[100px] text-primary">Last Purchase</TableHead>
                                    <TableHead className="text-right font-semibold min-w-[100px] pr-4 text-primary">Spent</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={`cust-skeleton-${i}`} className="border-b-white/5">
                                            <TableCell><Skeleton className="h-8 w-32 bg-white/10" /></TableCell>
                                            <TableCell className="hidden sm:table-cell"><Skeleton className="h-8 w-16 bg-white/10" /></TableCell>
                                            <TableCell className="hidden md:table-cell"><Skeleton className="h-8 w-24 bg-white/10" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto bg-white/10" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredCustomers.length > 0 ? (
                                    filteredCustomers
                                        .sort(([, a], [, b]) => b.totalPurchase - a.totalPurchase)
                                        .map(([name, stats], index) => (
                                            <TableRow
                                                key={name}
                                                className="hover:bg-white/5 border-b-white/5 transition-colors cursor-pointer"
                                                onClick={() => router.push(`/dashboard/customers/${encodeURIComponent(name)}`)}
                                            >
                                                <TableCell className="font-medium pl-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium truncate max-w-[120px] sm:max-w-none">{name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center text-sm">{stats.invoiceCount}</TableCell>
                                                <TableCell className="text-muted-foreground text-xs sm:text-sm">
                                                    {new Date(stats.lastPurchase).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-sm pr-4 text-gold-400">{formatCurrency(stats.totalPurchase)}</TableCell>
                                            </TableRow>
                                        ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-32">
                                            <div className="flex flex-col items-center gap-3 py-4">
                                                <Search className="h-8 w-8 text-muted-foreground opacity-50" />
                                                <p className="text-sm text-muted-foreground">
                                                    {searchTerm ? 'No customers found matching your search.' : 'No customers yet.'}
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-white/10">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={`mobile-cust-skeleton-${i}`} className="p-4 space-y-3">
                                    <Skeleton className="h-5 w-32 bg-white/10" />
                                    <div className="flex justify-between"><Skeleton className="h-4 w-20 bg-white/10" /><Skeleton className="h-4 w-16 bg-white/10" /></div>
                                </div>
                            ))
                        ) : filteredCustomers.length > 0 ? (
                            filteredCustomers
                                .sort(([, a], [, b]) => b.totalPurchase - a.totalPurchase)
                                .map(([name, stats]) => (
                                    <div
                                        key={name}
                                        onClick={() => router.push(`/dashboard/customers/${encodeURIComponent(name)}`)}
                                        className="p-4 hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-semibold text-lg">{name}</h3>
                                            <span className="text-gold-400 font-bold">{formatCurrency(stats.totalPurchase)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-muted-foreground">
                                            <span>{stats.invoiceCount} {stats.invoiceCount === 1 ? 'Invoice' : 'Invoices'}</span>
                                            <span>Last: {new Date(stats.lastPurchase).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
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
