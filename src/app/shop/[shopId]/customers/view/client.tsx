'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/supabase/provider';
import { supabase } from '@/supabase/client';
import { MotionWrapper, FadeIn } from '@/components/ui/motion-wrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, CreditCard, FileText, Phone, MapPin, Mail } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import type { Invoice } from '@/lib/definitions';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { EnrollmentModal } from '@/components/schemes/enrollment-modal';

export function CustomerDetailsClient() {
    const searchParams = useSearchParams();
    const params = useParams();
    // Decode the customerId as it might contain spaces or special characters
    const customerName = decodeURIComponent((searchParams.get('name') || params.customerId || '') as string);
    const router = useRouter();
    const { user } = useUser();
    const [invoices, setInvoices] = useState<Invoice[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [customerData, setCustomerData] = useState<any>(null);
    const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);
    const [enrollments, setEnrollments] = useState<any[]>([]);

    useEffect(() => {
        const shopId = params.shopId as string;
        if (!shopId || !customerName) return;

        const load = async () => {
            setIsLoading(true);

            // Fetch real customer data for loyalty points
            const { data: custData } = await supabase
                .from('customers')
                .select('*')
                .eq('shop_id', shopId)
                .ilike('name', customerName)
                .maybeSingle();

            if (custData) {
                setCustomerData(custData);

                // Fetch active enrollments for this customer
                const { data: enrollData } = await supabase
                    .from('scheme_enrollments')
                    .select('*, scheme:schemes(name, type, rules)')
                    .eq('customer_id', custData.id)
                    .neq('status', 'CLOSED');

                if (enrollData) {
                    setEnrollments(enrollData);
                }
            }

            // Query invoices by shop_id and customer name (case-insensitive)
            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .eq('shop_id', shopId)
                .filter('customer_snapshot->>name', 'ilike', customerName)
                .is('deleted_at', null)
                .order('invoice_date', { ascending: false });

            if (error) {
                console.error('[Customer Invoices Error]', JSON.stringify(error, null, 2));
                setInvoices([]);
            } else {
                const mapped = (data ?? []).map((r: any) => ({
                    id: r.id,
                    shopId: r.shop_id,
                    invoiceNumber: r.invoice_number,
                    customerId: r.customer_id,
                    customerSnapshot: r.customer_snapshot,
                    invoiceDate: r.invoice_date,
                    status: r.status,
                    subtotal: Number(r.subtotal) || 0,
                    discount: Number(r.discount) || 0,
                    cgstAmount: Number(r.cgst_amount) || 0,
                    sgstAmount: Number(r.sgst_amount) || 0,
                    grandTotal: Number(r.grand_total) || 0,
                    notes: r.notes,
                    createdByName: r.created_by_name,
                    createdBy: r.created_by,
                    createdAt: r.created_at,
                    updatedAt: r.updated_at,
                } as Invoice));
                setInvoices(mapped);
            }
            setIsLoading(false);
        };
        load();
    }, [params.shopId, customerName]);

    const stats = useMemo(() => {
        if (!invoices) return { totalSpent: 0, invoiceCount: 0, lastPurchase: null };
        const totalSpent = invoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
        const invoiceCount = invoices.length;
        const lastPurchase = invoices.length > 0 ? invoices[0].invoiceDate : null;
        return { totalSpent, invoiceCount, lastPurchase };
    }, [invoices]);

    // Get customer details from the most recent invoice
    const customerDetails = useMemo(() => {
        if (!invoices || invoices.length === 0) return null;
        const latest = invoices[0];
        return {
            address: latest.customerSnapshot?.address,
            phone: latest.customerSnapshot?.phone,
            state: latest.customerSnapshot?.state,
            pincode: latest.customerSnapshot?.pincode,
        };
    }, [invoices]);

    return (
        <MotionWrapper className="space-y-6">
            {/* Breadcrumb Navigation */}
            <Breadcrumb className="hidden md:block">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink onClick={() => router.push('/dashboard')}>
                            Dashboard
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink onClick={() => router.push('/dashboard/customers')}>
                            Customers
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{customerName}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-heading font-bold text-primary">{customerName}</h1>
                        <p className="text-sm text-muted-foreground">Customer Profile</p>
                    </div>
                </div>
                {customerData && (
                    <Button onClick={() => setIsEnrollmentOpen(true)} className="gap-2">
                        <CreditCard className="h-4 w-4" /> Enroll in Scheme
                    </Button>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Stats Cards */}
                <Card className="glass-card md:col-span-3 lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg">Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <CreditCard className="h-4 w-4" />
                                <span>Total Spent</span>
                            </div>
                            <span className="font-bold text-lg text-amber-600 dark:text-gold-400">
                                {isLoading ? <Skeleton className="h-6 w-20" /> : formatCurrency(stats.totalSpent)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <FileText className="h-4 w-4" />
                                <span>Total Invoices</span>
                            </div>
                            <span className="font-bold text-lg">
                                {isLoading ? <Skeleton className="h-6 w-10" /> : stats.invoiceCount}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>Last Purchase</span>
                            </div>
                            <span className="font-medium">
                                {isLoading ? <Skeleton className="h-6 w-24" /> : stats.lastPurchase ? format(new Date(stats.lastPurchase), 'dd MMM, yyyy') : 'N/A'}
                            </span>
                        </div>
                        {customerData && (
                            <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <CreditCard className="h-4 w-4 text-purple-500" />
                                    <span>Loyalty Points</span>
                                </div>
                                <span className="font-bold text-lg text-purple-600">
                                    {customerData.loyalty_points || 0}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Contact Info */}
                <Card className="glass-card md:col-span-3 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        ) : customerDetails ? (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                        <Phone className="h-3 w-3" /> Phone
                                    </div>
                                    <p className="font-medium">{customerDetails.phone || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                        <MapPin className="h-3 w-3" /> Address
                                    </div>
                                    <p className="font-medium">{customerDetails.address || 'N/A'}</p>
                                    {(customerDetails.state || customerDetails.pincode) && (
                                        <p className="text-sm text-muted-foreground">
                                            {[customerDetails.state, customerDetails.pincode].filter(Boolean).join(', ')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No contact details available.</p>
                        )}
                    </CardContent>
                </Card>


            </div>

            {/* Invoice History */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Invoice History</CardTitle>
                    <CardDescription>Recent transactions with this customer.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-gray-200 dark:border-white/10 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow className="hover:bg-transparent border-b-gray-200 dark:border-b-white/10">
                                    <TableHead className="text-primary">Invoice #</TableHead>
                                    <TableHead className="text-primary">Date</TableHead>
                                    <TableHead className="text-primary">Status</TableHead>
                                    <TableHead className="text-right text-primary">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <TableRow key={i} className="border-b-gray-100 dark:border-b-white/5">
                                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : invoices && invoices.length > 0 ? (
                                    invoices.map((inv) => (
                                        <TableRow
                                            key={inv.id}
                                            className="hover:bg-gray-50 dark:hover:bg-white/5 border-b-gray-100 dark:border-b-white/5 cursor-pointer transition-colors"
                                            onClick={() => router.push(`/dashboard/invoices/view?id=${inv.id}`)}
                                        >
                                            <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                                            <TableCell>{format(new Date(inv.invoiceDate), 'dd MMM, yyyy')}</TableCell>
                                            <TableCell>
                                                <Badge variant={inv.status === 'paid' ? 'default' : 'secondary'} className={inv.status === 'paid' ? 'bg-green-600/80' : ''}>
                                                    {inv.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-amber-600 dark:text-gold-400">
                                                {formatCurrency(inv.grandTotal)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                            No invoices found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Active Schemes Table */}
            {enrollments.length > 0 && (
                <Card className="glass-card md:col-span-3">
                    <CardHeader>
                        <CardTitle>Active Gold Schemes</CardTitle>
                        <CardDescription>Currently enrolled saving plans and payment details</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border border-gray-200 dark:border-white/10 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow className="hover:bg-transparent border-b-gray-200 dark:border-b-white/10">
                                        <TableHead className="text-primary">Scheme Name</TableHead>
                                        <TableHead className="text-primary">Account #</TableHead>
                                        <TableHead className="text-primary hidden md:table-cell">Start Date</TableHead>
                                        <TableHead className="text-primary hidden md:table-cell">Maturity</TableHead>
                                        <TableHead className="text-primary text-right">Total Paid</TableHead>
                                        <TableHead className="text-primary text-right">Gold Acc.</TableHead>
                                        <TableHead className="text-primary text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {enrollments.map((enrollment) => (
                                        <TableRow
                                            key={enrollment.id}
                                            className="hover:bg-gray-50 dark:hover:bg-white/5 border-b-gray-100 dark:border-b-white/5 cursor-pointer transition-colors"
                                            onClick={() => router.push(`/shop/${params.shopId}/schemes/${enrollment.scheme_id}`)}
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span>{enrollment.scheme?.name}</span>
                                                    <span className="text-xs text-muted-foreground md:hidden">{format(new Date(enrollment.start_date), 'MMM yyyy')}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm text-muted-foreground">{enrollment.account_number}</TableCell>
                                            <TableCell className="hidden md:table-cell">{format(new Date(enrollment.start_date), 'dd MMM, yyyy')}</TableCell>
                                            <TableCell className="hidden md:table-cell">{enrollment.maturity_date ? format(new Date(enrollment.maturity_date), 'dd MMM, yyyy') : 'N/A'}</TableCell>
                                            <TableCell className="text-right font-bold text-green-600">
                                                {formatCurrency(enrollment.total_paid)}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-amber-600">
                                                {enrollment.total_gold_weight_accumulated > 0
                                                    ? `${enrollment.total_gold_weight_accumulated.toFixed(3)}g`
                                                    : '-'
                                                }
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={enrollment.status === 'ACTIVE' ? 'default' : 'secondary'} className={enrollment.status === 'ACTIVE' ? 'bg-green-600/80 hover:bg-green-600/70' : ''}>
                                                    {enrollment.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {customerData && (
                <EnrollmentModal
                    isOpen={isEnrollmentOpen}
                    onClose={() => setIsEnrollmentOpen(false)}
                    customerId={customerData.id}
                    customerName={customerName}
                    onSuccess={() => {
                        // Optional: refresh data or show success toast
                    }}
                />
            )}
        </MotionWrapper>
    );
}
