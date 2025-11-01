'use client';

import { useState, useMemo } from 'react';
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
import { useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where, getFirestore } from 'firebase/firestore';


type CustomerStats = {
    totalPurchase: number;
    invoiceCount: number;
    lastPurchase: string;
};

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useUser();
  const firestore = getFirestore();

  const invoicesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'invoices'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const { data: invoices, isLoading: loading } = useCollection<Invoice>(invoicesQuery);


  const customerData = useMemo(() => {
    if (loading || !invoices) return {};
    const data: Record<string, CustomerStats> = {};
    invoices.forEach(invoice => {
        if (!data[invoice.customerName]) {
            data[invoice.customerName] = { totalPurchase: 0, invoiceCount: 0, lastPurchase: invoice.invoiceDate };
        }
        if(invoice.status === 'paid') {
            const subtotal = invoice.items.reduce((acc, item) => acc + (item.weight * item.rate) + item.makingCharges, 0);
            const subtotalAfterDiscount = subtotal - invoice.discount;
            const taxAmount = subtotalAfterDiscount * (invoice.tax / 100);
            const grandTotal = subtotalAfterDiscount + taxAmount;
            data[invoice.customerName].totalPurchase += grandTotal;
        }
        data[invoice.customerName].invoiceCount++;
        if (new Date(invoice.invoiceDate) > new Date(data[invoice.customerName].lastPurchase)) {
            data[invoice.customerName].lastPurchase = invoice.invoiceDate;
        }
    });
    return data;
  }, [invoices, loading]);

  const filteredCustomers = useMemo(() => {
    return Object.entries(customerData).filter(([name]) =>
      name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customerData, searchTerm]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
            <CardTitle>All Customers</CardTitle>
            <CardDescription>A list of all your customers and their purchase history.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by customer name..."
                    className="pl-10 w-full sm:max-w-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                </div>
            </div>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Total Invoices</TableHead>
                            <TableHead>Last Purchase</TableHead>
                            <TableHead className="text-right">Total Spent</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={`cust-skeleton-${i}`}>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-5 w-36 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredCustomers.length > 0 ? (
                            filteredCustomers
                                .sort(([, a], [, b]) => b.totalPurchase - a.totalPurchase)
                                .map(([name, stats]) => (
                                <TableRow key={name}>
                                    <TableCell className="font-medium">{name}</TableCell>
                                    <TableCell>{stats.invoiceCount}</TableCell>
                                    <TableCell>{new Date(stats.lastPurchase).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(stats.totalPurchase)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                    No customers found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
