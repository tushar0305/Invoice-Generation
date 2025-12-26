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
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Calendar, CreditCard, FileText, Phone, MapPin, Mail, Share2, Copy, Target } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { Invoice } from '@/lib/definitions';
import {
    // Breadcrumb imports removed
} from '@/components/ui/breadcrumb';
import { EnrollmentModal } from '@/components/schemes/enrollment-modal';
import { PaymentEntryModal } from '@/components/schemes/payment-entry-modal';
import { ReferralShareModal } from '@/components/schemes/referral-share-modal';
import { RequestPaymentModal } from '@/components/schemes/request-payment-modal';

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
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isRequestPaymentOpen, setIsRequestPaymentOpen] = useState(false);
    const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const { toast } = useToast();

    const generateReferral = async () => {
        if (!customerData?.id) return;
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { error } = await supabase
            .from('customers')
            .update({ referral_code: code })
            .eq('id', customerData.id);
        
        if (!error) {
            setCustomerData({ ...customerData, referral_code: code });
            toast({ title: "Success", description: "Referral code generated" });
        } else {
            toast({ title: "Error", description: "Failed to generate code", variant: "destructive" });
        }
    };

    useEffect(() => {
        const shopId = params.shopId as string;
        const customerIdParam = searchParams.get('id');
        
        if (!shopId || (!customerName && !customerIdParam)) return;

        const load = async () => {
            setIsLoading(true);

            let query = supabase
                .from('customers')
                .select('*')
                .eq('shop_id', shopId);

            if (customerIdParam) {
                query = query.eq('id', customerIdParam);
            } else {
                query = query.ilike('name', customerName);
            }

            const { data: custData } = await query.maybeSingle();

            if (custData) {
                setCustomerData(custData);

                // Fetch active enrollments for this customer
                const { data: enrollData } = await supabase
                    .from('scheme_enrollments')
                    .select('*, scheme:schemes(name, scheme_type, duration_months, interest_rate, bonus_months, scheme_amount)')
                    .eq('customer_id', custData.id)
                    .neq('status', 'CLOSED');

                if (enrollData) {
                    setEnrollments(enrollData);
                }
            }

            // Query invoices by shop_id and customer name (case-insensitive)
            // Note: Invoices store snapshot, so we still search by name for now
            // Ideally invoices should link to customer_id
            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .eq('shop_id', shopId)
                .filter('customer_snapshot->>name', 'ilike', custData?.name || customerName)
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
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsShareModalOpen(true)} className="gap-2">
                            <Share2 className="h-4 w-4" /> Refer
                        </Button>
                        <Button onClick={() => setIsEnrollmentOpen(true)} className="gap-2">
                            <CreditCard className="h-4 w-4" /> Enroll in Scheme
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Stats Cards */}
                <Card className="glass-card md:col-span-3 lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg">Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <CreditCard className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Spent</p>
                                    <div className="font-bold text-xl text-primary">
                                        {isLoading ? <Skeleton className="h-6 w-24" /> : formatCurrency(stats.totalSpent)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                                <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                                    <FileText className="h-4 w-4" />
                                    <span className="text-xs font-medium uppercase">Invoices</span>
                                </div>
                                <div className="font-bold text-2xl">
                                    {isLoading ? <Skeleton className="h-8 w-12" /> : stats.invoiceCount}
                                </div>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                                <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span className="text-xs font-medium uppercase">Last Visit</span>
                                </div>
                                <div className="font-medium text-sm">
                                    {isLoading ? <Skeleton className="h-6 w-20" /> : stats.lastPurchase ? format(new Date(stats.lastPurchase), 'dd MMM, yy') : 'N/A'}
                                </div>
                            </div>
                        </div>

                        {customerData && (
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/20 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                                        <CreditCard className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-purple-600/80 dark:text-purple-400/80 font-medium uppercase tracking-wider">Loyalty Points</p>
                                        <div className="font-bold text-xl text-purple-700 dark:text-purple-300">
                                            {customerData.loyalty_points || 0}
                                        </div>
                                    </div>
                                </div>
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
                                {customerData && (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                            <Share2 className="h-3 w-3" /> Referral Code
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {customerData.referral_code ? (
                                                <>
                                                    <p className="font-medium font-mono bg-muted px-2 py-0.5 rounded text-sm">
                                                        {customerData.referral_code}
                                                    </p>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-6 w-6" 
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(customerData.referral_code);
                                                        }}
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50" 
                                                        onClick={() => setIsShareModalOpen(true)}
                                                    >
                                                        <Share2 className="h-3 w-3" />
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button variant="outline" size="sm" onClick={generateReferral} className="h-7 text-xs">
                                                    Generate Code
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No contact details available.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Active Schemes Section */}
            <Card className="glass-card md:col-span-3">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        Active Schemes
                    </CardTitle>
                    <CardDescription>Currently enrolled savings plans.</CardDescription>
                </CardHeader>
                <CardContent>
                    {enrollments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                            <p>No active scheme enrollments.</p>
                            <Button variant="link" onClick={() => setIsEnrollmentOpen(true)} className="mt-2">
                                Enroll Now
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-md border border-gray-200 dark:border-white/10 overflow-hidden">
                            <div className="relative">
                                {/* Mobile View - Cards */}
                                <div className="md:hidden space-y-3 p-4">
                                    {enrollments.map((enrollment) => {
                                        const progress = enrollment.target_amount > 0 
                                            ? Math.min(100, (enrollment.total_paid / enrollment.target_amount) * 100)
                                            : enrollment.target_weight > 0
                                                ? Math.min(100, (enrollment.total_gold_weight_accumulated / enrollment.target_weight) * 100)
                                                : 0;
                                        
                                        return (
                                        <div
                                            key={enrollment.id}
                                            className="bg-card border border-border rounded-xl p-4 shadow-sm active:scale-[0.99] transition-transform"
                                            onClick={() => router.push(`/shop/${params.shopId}/schemes/${enrollment.scheme_id}`)}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    {enrollment.goal_name && (
                                                        <div className="flex items-center gap-1 mb-1 text-primary font-medium text-xs">
                                                            <Target className="h-3 w-3" />
                                                            {enrollment.goal_name}
                                                        </div>
                                                    )}
                                                    <div className="font-bold text-foreground">{enrollment.scheme?.name}</div>
                                                    <div className="text-xs text-muted-foreground font-mono">
                                                        #{enrollment.account_number}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <Badge variant={enrollment.status === 'ACTIVE' ? 'default' : 'secondary'} className={enrollment.status === 'ACTIVE' ? 'bg-green-600/80' : ''}>
                                                        {enrollment.status}
                                                    </Badge>
                                                    {enrollment.status === 'ACTIVE' && (
                                                        <div className="flex gap-1">
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline" 
                                                                className="h-7 text-xs"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedEnrollment(enrollment);
                                                                    setIsRequestPaymentOpen(true);
                                                                }}
                                                            >
                                                                Request
                                                            </Button>
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline" 
                                                                className="h-7 text-xs"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedEnrollment(enrollment);
                                                                }}
                                                            >
                                                                Pay
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {(enrollment.target_amount > 0 || enrollment.target_weight > 0) && (
                                                <div className="space-y-1 py-2">
                                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                                        <span>Progress</span>
                                                        <span>{progress.toFixed(0)}%</span>
                                                    </div>
                                                    <Progress value={progress} className="h-1.5" />
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-3 pt-2 mt-2 border-t border-border">
                                                <div>
                                                    <div className="text-xs text-muted-foreground mb-0.5">Total Paid</div>
                                                    <div className="font-bold text-green-600">{formatCurrency(enrollment.total_paid)}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-muted-foreground mb-0.5">Gold Accumulated</div>
                                                    <div className="font-bold text-amber-600">
                                                        {enrollment.total_gold_weight_accumulated > 0
                                                            ? `${enrollment.total_gold_weight_accumulated.toFixed(3)}g`
                                                            : '-'
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
                                                <span>Started: {format(new Date(enrollment.start_date), 'dd MMM, yyyy')}</span>
                                                <span>Maturity: {enrollment.maturity_date ? format(new Date(enrollment.maturity_date), 'dd MMM, yyyy') : 'N/A'}</span>
                                            </div>
                                        </div>
                                    )})}
                                </div>

                                {/* Desktop View - Table */}
                                <div className="hidden md:block overflow-x-auto">
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
                                                <TableHead className="text-primary text-right">Actions</TableHead>
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
                                                    <TableCell className="text-right">
                                                        {enrollment.status === 'ACTIVE' && (
                                                            <div className="flex justify-end gap-2">
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="outline"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedEnrollment(enrollment);
                                                                        setIsRequestPaymentOpen(true);
                                                                    }}
                                                                >
                                                                    Request
                                                                </Button>
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="outline"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedEnrollment(enrollment);
                                                                    }}
                                                                >
                                                                    Pay
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Invoice History */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Invoice History</CardTitle>
                    <CardDescription>Recent transactions with this customer.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-gray-200 dark:border-white/10 overflow-hidden">
                        <div className="relative">
                            {/* Mobile View - Cards */}
                            <div className="md:hidden space-y-3 p-4">
                                {isLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-3">
                                            <div className="flex justify-between">
                                                <Skeleton className="h-5 w-20" />
                                                <Skeleton className="h-5 w-16" />
                                            </div>
                                            <div className="flex justify-between">
                                                <Skeleton className="h-4 w-24" />
                                                <Skeleton className="h-5 w-20" />
                                            </div>
                                        </div>
                                    ))
                                ) : invoices && invoices.length > 0 ? (
                                    invoices.map((inv) => (
                                        <div
                                            key={inv.id}
                                            className="bg-card border border-border rounded-xl p-4 shadow-sm active:scale-[0.99] transition-transform"
                                            onClick={() => router.push(`/dashboard/invoices/view?id=${inv.id}`)}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="font-bold text-foreground">{inv.invoiceNumber}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {format(new Date(inv.invoiceDate), 'dd MMM, yyyy')}
                                                    </div>
                                                </div>
                                                <Badge variant={inv.status === 'paid' ? 'default' : 'secondary'} className={inv.status === 'paid' ? 'bg-green-600/80' : ''}>
                                                    {inv.status}
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between items-end border-t border-border pt-2 mt-2">
                                                <div className="text-xs text-muted-foreground">Total Amount</div>
                                                <div className="font-bold text-lg text-amber-600 dark:text-gold-400">
                                                    {formatCurrency(inv.grandTotal)}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                                        No invoices found.
                                    </div>
                                )}
                            </div>

                            {/* Desktop View - Table */}
                            <div className="hidden md:block overflow-x-auto">
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
                        </div>
                    </div>
                </CardContent>
            </Card>



            {customerData && (
                <>
                    <EnrollmentModal
                        isOpen={isEnrollmentOpen}
                        onClose={() => setIsEnrollmentOpen(false)}
                        customerId={customerData.id}
                        customerName={customerName}
                        customerPhone={customerData.phone}
                        onSuccess={() => {
                            // Optional: refresh data or show success toast
                            window.location.reload();
                        }}
                    />
                    <ReferralShareModal
                        isOpen={isShareModalOpen}
                        onClose={() => setIsShareModalOpen(false)}
                        customerName={customerName}
                        customerPhone={customerData.phone}
                        referralCode={customerData.referral_code}
                        shopName="My Jewellery Shop" // Ideally fetch this from shop context
                    />
                </>
            )}

            {selectedEnrollment && !isRequestPaymentOpen && (
                <PaymentEntryModal
                    isOpen={!!selectedEnrollment}
                    onClose={() => setSelectedEnrollment(null)}
                    enrollment={selectedEnrollment}
                    customerName={customerName}
                    customerPhone={customerData?.phone}
                    onSuccess={() => {
                        // Refresh to show updated totals
                        window.location.reload();
                    }}
                />
            )}

            {selectedEnrollment && isRequestPaymentOpen && (
                <RequestPaymentModal
                    isOpen={isRequestPaymentOpen}
                    onClose={() => {
                        setIsRequestPaymentOpen(false);
                        setSelectedEnrollment(null);
                    }}
                    shopId={params.shopId as string}
                    shopName="My Jewellery Shop"
                    customerName={customerName}
                    customerPhone={customerData?.phone}
                    amount={selectedEnrollment.scheme?.scheme_amount || 0}
                    note={`Payment for ${selectedEnrollment.scheme?.name}`}
                />
            )}
        </MotionWrapper>
    );
}
