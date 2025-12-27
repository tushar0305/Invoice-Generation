'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/supabase/provider';
import { supabase } from '@/supabase/client';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Calendar, CreditCard, FileText, Phone, Mail, Share2, Copy, Target, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { Invoice } from '@/lib/definitions';

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
                    .select('*, scheme:schemes(name, duration_months, scheme_amount, rules)')
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

        <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background relative pb-20">
            <MotionWrapper className="space-y-6 p-4 md:p-6 pb-24 md:pb-6 max-w-[1200px] mx-auto">
                {/* Header Card */}
                <div className="bg-card/80 backdrop-blur-md rounded-3xl border border-border/50 shadow-sm p-5 md:p-8 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0 h-10 w-10 rounded-xl bg-muted/50 hover:bg-muted"
                                onClick={() => router.back()}
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                    {customerName}
                                    {customerData?.loyalty_points > 0 && (
                                        <Badge variant="outline" className="ml-2 bg-primary/5 text-primary border-primary/20">
                                            {customerData.loyalty_points} Points
                                        </Badge>
                                    )}
                                </h1>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                                    <span>Customer Profile</span>
                                    {customerDetails?.phone && (
                                        <>
                                            <span className="hidden sm:inline">•</span>
                                            <span className="flex items-center gap-1">
                                                <Phone className="h-3 w-3" /> {customerDetails.phone}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {customerData && (
                            <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsShareModalOpen(true)}
                                    className="flex-1 md:flex-none border-primary/20 hover:bg-primary/5 hover:text-primary hover:border-primary/50"
                                >
                                    <Share2 className="mr-2 h-4 w-4" />
                                    Refer
                                </Button>
                                <Button
                                    onClick={() => setIsEnrollmentOpen(true)}
                                    className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 border-0"
                                >
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Enroll Scheme
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Tabs */}
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="bg-muted/50 p-1 rounded-xl w-full sm:w-auto grid grid-cols-3 sm:flex sm:justify-start mb-6">
                        <TabsTrigger
                            value="overview"
                            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-sm transition-all duration-200"
                        >
                            Overview
                        </TabsTrigger>
                        <TabsTrigger
                            value="schemes"
                            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-sm transition-all duration-200"
                        >
                            Schemes
                        </TabsTrigger>
                        <TabsTrigger
                            value="history"
                            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-sm transition-all duration-200"
                        >
                            History
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-3">
                            {/* Stats 1: Total Spent */}
                            <Card className="border border-border shadow-sm bg-card overflow-hidden h-full">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <CreditCard className="h-4 w-4 text-primary" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">
                                        {isLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(stats.totalSpent)}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Lifetime spending</p>
                                </CardContent>
                            </Card>

                            {/* Stats 2: Invoices */}
                            <Card className="border border-border shadow-sm bg-card overflow-hidden h-full">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <FileText className="h-4 w-4 text-primary" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">
                                        {isLoading ? <Skeleton className="h-8 w-12" /> : stats.invoiceCount}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 uppercase">Transactions</p>
                                </CardContent>
                            </Card>

                            {/* Stats 3: Last Visit */}
                            <Card className="border border-border shadow-sm bg-card overflow-hidden h-full">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Last Visit</CardTitle>
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Calendar className="h-4 w-4 text-primary" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">
                                        {isLoading ? <Skeleton className="h-8 w-24" /> : stats.lastPurchase ? format(new Date(stats.lastPurchase), 'dd MMM, yy') : 'N/A'}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Most recent activity</p>
                                </CardContent>
                            </Card>

                            {/* Contact Info */}
                            <Card className="border border-border/50 bg-card shadow-sm md:col-span-3">
                                <CardHeader className="pb-3 border-b border-border/50">
                                    <CardTitle className="text-lg">Contact Information</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 md:p-6 grid gap-6 sm:grid-cols-2">
                                    {isLoading ? (
                                        <div className="space-y-4">
                                            <Skeleton className="h-12 w-full rounded-xl" />
                                            <Skeleton className="h-12 w-3/4 rounded-xl" />
                                        </div>
                                    ) : customerDetails ? (
                                        <>
                                            <div className="space-y-1">
                                                <div className="text-xs font-medium text-muted-foreground uppercase">Phone</div>
                                                <div className="font-medium text-foreground">{customerDetails.phone || 'N/A'}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-xs font-medium text-muted-foreground uppercase">Address</div>
                                                <div className="font-medium text-foreground">{customerDetails.address || 'N/A'}</div>
                                                {(customerDetails.state || customerDetails.pincode) && (
                                                    <div className="text-sm text-muted-foreground">
                                                        {[customerDetails.state, customerDetails.pincode].filter(Boolean).join(', ')}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Referral Section */}
                                            {customerData && (
                                                <div className="sm:col-span-2 mt-2 pt-4 border-t border-border/50">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                                                        <div>
                                                            <div className="text-sm font-medium text-foreground">Referral Code</div>
                                                            <div className="text-xs text-muted-foreground">Share this code to earn points.</div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {customerData.referral_code ? (
                                                                <div className="flex items-center gap-2 bg-background p-1.5 pl-3 rounded-lg border border-border shadow-sm">
                                                                    <code className="text-sm font-bold text-primary font-mono select-all">
                                                                        {customerData.referral_code}
                                                                    </code>
                                                                    <div className="h-4 w-px bg-border mx-1" />
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 hover:text-primary"
                                                                        onClick={() => {
                                                                            navigator.clipboard.writeText(customerData.referral_code);
                                                                            toast({ title: "Copied!", description: "Referral code copied." });
                                                                        }}
                                                                    >
                                                                        <Copy className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <Button variant="outline" size="sm" onClick={generateReferral}>
                                                                    Generate Code
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="col-span-2 text-center py-4 text-muted-foreground">No contact details available.</div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="schemes">
                        <Card className="border border-border/50 bg-card shadow-sm">
                            <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Active Schemes</CardTitle>
                                    <CardDescription className="text-xs md:text-sm">Currently enrolled savings plans.</CardDescription>
                                </div>
                                <Badge variant="secondary" className="bg-muted text-muted-foreground">
                                    {enrollments.length} Active
                                </Badge>
                            </CardHeader>
                            <CardContent className="p-0">
                                {enrollments.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                                            <Target className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-base font-semibold text-foreground">No enrollments</h3>
                                        <p className="text-sm text-muted-foreground max-w-[250px] mt-1 mb-4">
                                            Start a savings plan for this customer.
                                        </p>
                                        <Button size="sm" onClick={() => setIsEnrollmentOpen(true)}>Enroll Now</Button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Mobile View - List */}
                                        <div className="md:hidden divide-y divide-border/50">
                                            {enrollments.map((enrollment) => {
                                                const progress = enrollment.target_amount > 0
                                                    ? Math.min(100, (enrollment.total_paid / enrollment.target_amount) * 100)
                                                    : enrollment.target_weight > 0
                                                        ? Math.min(100, (enrollment.total_gold_weight_accumulated / enrollment.target_weight) * 100)
                                                        : 0;
                                                return (
                                                    <div
                                                        key={enrollment.id}
                                                        className="p-4 space-y-3 active:bg-muted/50"
                                                        onClick={() => router.push(`/shop/${params.shopId}/schemes/${enrollment.scheme_id}`)}
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="font-semibold text-foreground">{enrollment.scheme?.name}</div>
                                                                <div className="text-xs text-muted-foreground">#{enrollment.account_number}</div>
                                                            </div>
                                                            <Badge variant={enrollment.status === 'ACTIVE' ? 'default' : 'secondary'} className={enrollment.status === 'ACTIVE' ? 'bg-green-600 hover:bg-green-700' : ''}>
                                                                {enrollment.status}
                                                            </Badge>
                                                        </div>

                                                        {/* Progress Bar */}
                                                        {(enrollment.target_amount > 0 || enrollment.target_weight > 0) && (
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between text-[10px] text-muted-foreground uppercase">
                                                                    <span>Progress</span>
                                                                    <span>{progress.toFixed(0)}%</span>
                                                                </div>
                                                                <Progress value={progress} className="h-1.5" />
                                                            </div>
                                                        )}

                                                        <div className="flex justify-between items-end pt-1">
                                                            <div>
                                                                <div className="text-[10px] uppercase text-muted-foreground">Paid</div>
                                                                <div className="font-medium text-foreground">{formatCurrency(enrollment.total_paid)}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-[10px] uppercase text-muted-foreground">Gold</div>
                                                                <div className="font-medium text-primary">
                                                                    {enrollment.total_gold_weight_accumulated > 0 ? `${enrollment.total_gold_weight_accumulated.toFixed(3)}g` : '-'}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {enrollment.status === 'ACTIVE' && (
                                                            <div className="grid grid-cols-2 gap-3 pt-2">
                                                                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedEnrollment(enrollment);
                                                                    setIsRequestPaymentOpen(true);
                                                                }}>Request</Button>
                                                                <Button size="sm" className="h-8 text-xs" onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedEnrollment(enrollment);
                                                                }}>Pay EMI</Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Desktop View - Table */}
                                        <div className="hidden md:block overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="hover:bg-muted/30 border-b border-border/50">
                                                        <TableHead>Scheme</TableHead>
                                                        <TableHead className="hidden lg:table-cell">Dates</TableHead>
                                                        <TableHead className="text-right">Total Paid</TableHead>
                                                        <TableHead className="text-right">Gold Acc.</TableHead>
                                                        <TableHead className="text-center">Status</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {enrollments.map((enrollment) => (
                                                        <TableRow
                                                            key={enrollment.id}
                                                            className="hover:bg-muted/30 border-b border-border/30 cursor-pointer"
                                                            onClick={() => router.push(`/shop/${params.shopId}/schemes/${enrollment.scheme_id}`)}
                                                        >
                                                            <TableCell>
                                                                <div className="font-medium">{enrollment.scheme?.name}</div>
                                                                <div className="text-xs text-muted-foreground">#{enrollment.account_number}</div>
                                                            </TableCell>
                                                            <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                                                                <div>Start: {format(new Date(enrollment.start_date), 'MMM d, yy')}</div>
                                                                {enrollment.maturity_date && <div>End: {format(new Date(enrollment.maturity_date), 'MMM d, yy')}</div>}
                                                            </TableCell>
                                                            <TableCell className="text-right font-medium">{formatCurrency(enrollment.total_paid)}</TableCell>
                                                            <TableCell className="text-right font-medium text-primary">
                                                                {enrollment.total_gold_weight_accumulated > 0 ? `${enrollment.total_gold_weight_accumulated.toFixed(3)}g` : '-'}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Badge variant={enrollment.status === 'ACTIVE' ? 'default' : 'secondary'} className={enrollment.status === 'ACTIVE' ? 'bg-green-600 hover:bg-green-700 shadow-sm' : ''}>
                                                                    {enrollment.status}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                {enrollment.status === 'ACTIVE' && (
                                                                    <div className="flex justify-end gap-2">
                                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedEnrollment(enrollment);
                                                                            setIsRequestPaymentOpen(true);
                                                                        }}><Mail className="h-4 w-4" /></Button>
                                                                        <Button size="sm" className="h-8" onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedEnrollment(enrollment);
                                                                        }}>Pay</Button>
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="history">
                        <Card className="border border-border/50 bg-card shadow-sm">
                            <CardHeader className="pb-3 border-b border-border/50">
                                <CardTitle className="text-lg">Invoice History</CardTitle>
                                <CardDescription className="text-xs md:text-sm">Recent transactions.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {/* Mobile View */}
                                <div className="md:hidden divide-y divide-border/50">
                                    {isLoading ? (
                                        <div className="p-4 text-center text-muted-foreground">Loading...</div>
                                    ) : invoices && invoices.length > 0 ? (
                                        invoices.map((inv) => (
                                            <div
                                                key={inv.id}
                                                className="p-4 space-y-2 active:bg-muted/50"
                                                onClick={() => router.push(`/dashboard/invoices/view?id=${inv.id}`)}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-medium text-foreground">{inv.invoiceNumber}</div>
                                                        <div className="text-xs text-muted-foreground">{format(new Date(inv.invoiceDate), 'MMM d, yyyy')}</div>
                                                    </div>
                                                    <Badge variant={inv.status === 'paid' ? 'default' : 'secondary'} className={inv.status === 'paid' ? 'bg-green-600' : ''}>
                                                        {inv.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between items-center pt-2">
                                                    <span className="text-xs text-muted-foreground">Total</span>
                                                    <span className="font-bold text-primary">{formatCurrency(inv.grandTotal)}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground px-4">No invoices found.</div>
                                    )}
                                </div>

                                {/* Desktop View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-muted/30 border-b border-border/50">
                                                <TableHead>Invoice #</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoading ? (
                                                <TableRow><TableCell colSpan={4} className="text-center py-4">Loading...</TableCell></TableRow>
                                            ) : invoices && invoices.length > 0 ? (
                                                invoices.map((inv) => (
                                                    <TableRow
                                                        key={inv.id}
                                                        className="hover:bg-muted/30 border-b border-border/30 cursor-pointer"
                                                        onClick={() => router.push(`/dashboard/invoices/view?id=${inv.id}`)}
                                                    >
                                                        <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                                                        <TableCell className="text-muted-foreground">{format(new Date(inv.invoiceDate), 'MMM d, yyyy')}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={inv.status === 'paid' ? 'default' : 'secondary'} className={inv.status === 'paid' ? 'bg-green-600 shadow-sm' : ''}>
                                                                {inv.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold text-primary">{formatCurrency(inv.grandTotal)}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No invoices found.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Modals */}
                {customerData && (
                    <>
                        <EnrollmentModal
                            isOpen={isEnrollmentOpen}
                            onClose={() => setIsEnrollmentOpen(false)}
                            customerId={customerData.id}
                            customerName={customerName}
                            customerPhone={customerData.phone}
                            onSuccess={() => {
                                window.location.reload();
                            }}
                        />
                        <ReferralShareModal
                            isOpen={isShareModalOpen}
                            onClose={() => setIsShareModalOpen(false)}
                            customerName={customerName}
                            customerPhone={customerData.phone}
                            referralCode={customerData.referral_code}
                            shopName="My Jewellery Shop"
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
        </div>
    );
}
