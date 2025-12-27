'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowRight, Loader2, Phone, MessageCircle } from 'lucide-react';
import { supabase } from '@/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
    DrawerFooter,
    DrawerClose
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // Keep Dialog for desktop if needed, or unify. Let's unify to Drawer for simpler mobile-first UX as requested "make it open as a bottom drawer... also for desktop and phone". Actually user said "make it open as a bottom drawer... also for desktop and phone... add pagination". So I will use Drawer for both or responsive. The user specifically asked for "bottom drawer". I'll stick to Drawer for mobile and Dialog for desktop if possible, but the prompt says "make it open as a bottom drawer, also for desktop and phone". Wait, "in mobile view all defaulters, make it open as a bottom drawer". The "also for desktop and phone bothe... add pagination" refers to the popup content. I will use a responsive dialog/drawer pattern.

interface DefaulterListProps {
    shopId: string;
}

interface Defaulter {
    enrollmentId: string;
    customerName: string;
    customerPhone: string;
    schemeName: string;
    lastPaidDate: string | null;
    monthlyAmount: number;
}

export function DefaulterList({ shopId }: DefaulterListProps) {
    const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const router = useRouter();

    const filteredDefaulters = defaulters.filter(d =>
        d.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.customerPhone.includes(searchQuery)
    );

    const totalPages = Math.ceil(filteredDefaulters.length / ITEMS_PER_PAGE);
    const paginatedDefaulters = filteredDefaulters.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    useEffect(() => {
        const fetchDefaulters = async () => {
            try {
                // 1. Get all active enrollments
                const { data: enrollments, error: enrollError } = await supabase
                    .from('scheme_enrollments')
                    .select(`
                        id,
                        customer:customers(name, phone),
                        scheme:schemes(id, name),
                        created_at
                    `)
                    .eq('shop_id', shopId)
                    .eq('status', 'ACTIVE');

                if (enrollError) throw enrollError;

                if (!enrollments || enrollments.length === 0) {
                    setDefaulters([]);
                    setIsLoading(false);
                    return;
                }

                // 2. Get all transactions for the current month
                const start = startOfMonth(new Date()).toISOString();
                const end = endOfMonth(new Date()).toISOString();

                const { data: transactions, error: transError } = await supabase
                    .from('scheme_transactions')
                    .select('enrollment_id')
                    .eq('shop_id', shopId)
                    .gte('created_at', start)
                    .lte('created_at', end);

                if (transError) throw transError;

                // 3. Find who hasn't paid
                const paidEnrollmentIds = new Set(transactions?.map(t => t.enrollment_id));

                const unpaid = enrollments
                    .filter(e => !paidEnrollmentIds.has(e.id))
                    .map((e: any) => ({
                        enrollmentId: e.id,
                        customerName: Array.isArray(e.customer) ? e.customer[0]?.name : e.customer?.name || 'Unknown',
                        customerPhone: Array.isArray(e.customer) ? e.customer[0]?.phone : e.customer?.phone || '',
                        schemeName: Array.isArray(e.scheme) ? e.scheme[0]?.name : e.scheme?.name || 'Scheme',
                        lastPaidDate: null, // We could fetch this, but keeping it simple for now
                        monthlyAmount: 0 // Placeholder
                    }))
                    .slice(0, 5); // Top 5

                setDefaulters(unpaid);

            } catch (err) {
                console.error('Error fetching defaulters:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDefaulters();
    }, [shopId]);

    if (isLoading) {
        return (
            <Card className="h-full border-none shadow-sm bg-card/50">
                <CardContent className="flex items-center justify-center h-48">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full border-none shadow-md bg-gradient-to-br from-white to-rose-50 dark:from-slate-900 dark:to-rose-950/20 overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-rose-600 dark:text-rose-400">
                            <AlertTriangle className="w-5 h-5" />
                            Pending Payments
                        </CardTitle>
                        <CardDescription>Customers yet to pay this month</CardDescription>
                    </div>
                    <Badge variant="outline" className="border-rose-200 text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400">
                        {defaulters.length} Pending
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                {defaulters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
                            <span className="text-xl">🎉</span>
                        </div>
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">All Clear!</p>
                        <p className="text-xs opacity-70">Everyone has paid for this month.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {defaulters.map((item) => (
                            <div
                                key={item.enrollmentId}
                                className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/30 shadow-sm hover:shadow-md transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 font-bold text-xs">
                                        {item.customerName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{item.customerName}</p>
                                        <p className="text-xs text-muted-foreground">{item.schemeName}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                        onClick={() => window.open(`https://wa.me/${item.customerPhone}?text=Hello ${item.customerName}, a gentle reminder for your scheme payment.`, '_blank')}
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                        onClick={() => window.location.href = `tel:${item.customerPhone}`}
                                    >
                                        <Phone className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {isDesktop ? (
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" className="w-full text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 h-8">
                                        View All Defaulters <ArrowRight className="w-3 h-3 ml-1" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                                    <DialogHeader>
                                        <DialogTitle>Defaulters List ({defaulters.length})</DialogTitle>
                                    </DialogHeader>
                                    <DefaulterListContent
                                        searchQuery={searchQuery}
                                        setSearchQuery={setSearchQuery}
                                        paginatedDefaulters={paginatedDefaulters}
                                        filteredDefaulters={filteredDefaulters}
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        setCurrentPage={setCurrentPage}
                                        defaultersCount={defaulters.length}
                                    />
                                </DialogContent>
                            </Dialog>
                        ) : (
                            <Drawer open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DrawerTrigger asChild>
                                    <Button variant="ghost" className="w-full text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 h-8">
                                        View All Defaulters <ArrowRight className="w-3 h-3 ml-1" />
                                    </Button>
                                </DrawerTrigger>
                                <DrawerContent className="h-[85vh] flex flex-col">
                                    <DrawerHeader>
                                        <DrawerTitle>Defaulters List ({defaulters.length})</DrawerTitle>
                                    </DrawerHeader>
                                    <div className="px-4 flex-1 overflow-hidden flex flex-col">
                                        <DefaulterListContent
                                            searchQuery={searchQuery}
                                            setSearchQuery={setSearchQuery}
                                            paginatedDefaulters={paginatedDefaulters}
                                            filteredDefaulters={filteredDefaulters}
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            setCurrentPage={setCurrentPage}
                                            defaultersCount={defaulters.length}
                                        />
                                    </div>
                                    <DrawerFooter className="pt-2">
                                        <DrawerClose asChild>
                                            <Button variant="outline">Close</Button>
                                        </DrawerClose>
                                    </DrawerFooter>
                                </DrawerContent>
                            </Drawer>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function DefaulterListContent({
    searchQuery, setSearchQuery, paginatedDefaulters, filteredDefaulters,
    currentPage, totalPages, setCurrentPage, defaultersCount
}: any) {
    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="relative mb-4 shrink-0">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name or phone..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1); // Reset to first page on search
                    }}
                    className="pl-8"
                />
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-2 min-h-0">
                {paginatedDefaulters.map((item: any) => (
                    <div key={item.enrollmentId} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 font-medium text-xs">
                                {item.customerName.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-medium leading-none">{item.customerName}</p>
                                <p className="text-xs text-muted-foreground mt-1">{item.schemeName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => window.open(`https://wa.me/${item.customerPhone}?text=Hello ${item.customerName}, a gentle reminder for your scheme payment.`, '_blank')}
                            >
                                <MessageCircle className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => window.location.href = `tel:${item.customerPhone}`}
                            >
                                <Phone className="w-4 h-4 text-blue-600" />
                            </Button>
                        </div>
                    </div>
                ))}

                {filteredDefaulters.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        No defaulters found matching your search.
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-2 border-t shrink-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-8 px-2"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    <span className="text-xs text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8 px-2"
                    >
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            )}
        </div>
    );
}
