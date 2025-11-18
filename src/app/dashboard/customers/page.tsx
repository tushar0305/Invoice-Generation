"use client";

import { useState, useMemo, useEffect } from 'react';
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

export default function CustomersPage() {
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
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
            <CardTitle className="text-lg sm:text-xl">All Customers</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              <span className="inline-flex items-center gap-1.5">
                <span className="font-semibold text-foreground">{Object.keys(customerData).length}</span>
                <span>total {Object.keys(customerData).length === 1 ? 'customer' : 'customers'}</span>
              </span>
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by customer name..."
                    className="pl-10 w-full sm:max-w-sm h-10 sm:h-11 text-sm sm:text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                </div>
            </div>
            <div className="overflow-x-auto -mx-6 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold min-w-[140px] pl-6 sm:pl-4">Customer</TableHead>
                            <TableHead className="font-semibold hidden sm:table-cell min-w-[80px]">Invoices</TableHead>
                            <TableHead className="font-semibold hidden md:table-cell min-w-[120px]">Last Purchase</TableHead>
                            <TableHead className="text-right font-semibold min-w-[100px] pr-6 sm:pr-4">Total Spent</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={`cust-skeleton-${i}`}>
                                    <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-8 w-16" /></TableCell>
                                    <TableCell className="hidden md:table-cell"><Skeleton className="h-8 w-24" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredCustomers.length > 0 ? (
                            filteredCustomers
                                .sort(([, a], [, b]) => b.totalPurchase - a.totalPurchase)
                                .map(([name, stats]) => (
                                <TableRow key={name} className="hover:bg-muted/30">
                                    <TableCell className="font-medium pl-6 sm:pl-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm sm:text-base">{name}</span>
                                            <span className="text-xs text-muted-foreground sm:hidden">
                                                {stats.invoiceCount} {stats.invoiceCount === 1 ? 'invoice' : 'invoices'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">{stats.invoiceCount}</TableCell>
                                    <TableCell className="text-muted-foreground text-xs sm:text-sm hidden md:table-cell">
                                        {new Date(stats.lastPurchase).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-sm sm:text-base pr-6 sm:pr-4">{formatCurrency(stats.totalPurchase)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
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
              </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
