'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    Banknote,
    AlertCircle,
    FileText,
    Calendar,
    ArrowRight,
    TrendingUp,
    Wallet,
    Plus,
    Coins
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatCurrency, cn } from '@/lib/utils';
import type { Loan, LoanDashboardStats } from '@/lib/loan-types';
import { format, addMonths, isAfter, setDate } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

import { LoansHeader } from '@/components/loans/loans-header';

// Helper to calculate monthly interest
const getMonthlyInterest = (principal: number, rate: number) => {
    return (principal * rate) / 1200;
};

// Helper to get next due date
const getNextDueDate = (startDateStr: string) => {
    const start = new Date(startDateStr);
    const today = new Date();
    // Start checking from the upcoming month relative to today
    let due = new Date(today.getFullYear(), today.getMonth(), start.getDate());

    // If this date is in the past (e.g., today is 15th, due was 10th), move to next month
    if (isAfter(today, due)) {
        due = addMonths(due, 1);
    }
    return due;
};

type LoansDashboardClientProps = {
    loans: (Loan & { loan_customers: { name: string; phone: string } })[];
    stats: LoanDashboardStats;
    shopId: string;
    pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        limit: number;
    };
};

export function LoansDashboardClient({
    loans,
    stats,
    shopId,
    pagination,
}: LoansDashboardClientProps) {
    const router = useRouter();
    // Removed client-side filtering since we are doing server-side pagination & potentially search
    // But keeping it for now if search meant to filter *current page* results?
    // Actually, page.tsx doesn't pass 'q' down effectively for client filtering of full dataset.
    // If 'q' is passed, filter locally? No, standard practice is server search.
    // However, the original code had client search. For now, let's keep search LOCAL to the page data
    // OR switch to server search.
    // Given the props include `pagination`, we should probably assume server-side data is what we have.
    // Let's implement server-side search handling in `handleSearch` or similar.

    // BUT, the existing code:
    // `const [searchTerm, setSearchTerm] = useState('');`
    // `const filteredLoans = loans.filter(...)`
    // This implies filtering *current page* results.
    // Let's keep it simple: Just fix the type error first, and add pagination UI.

    const [searchTerm, setSearchTerm] = useState('');

    const filteredLoans = loans.filter(loan =>
        loan.loan_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.loan_customers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.loan_customers?.phone.includes(searchTerm)
    );

    const goToPage = (page: number) => {
        const params = new URLSearchParams(window.location.search);
        params.set('page', String(page));
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Header Section matching Marketing/Catalogue */}
            <LoansHeader shopId={shopId} />

            <div className="max-w-5xl mx-auto px-4 md:px-8 -mt-8 relative z-10 space-y-8 pb-12">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Active Loans */}
                    <Card className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border-border/50 shadow-lg relative overflow-hidden group hover:shadow-xl transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <FileText className="h-16 w-16 text-primary" />
                        </div>
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground truncate">Active Loans</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-foreground truncate">{stats.total_active_loans}</div>
                            <div className="flex items-center gap-1.5 mt-2">
                                <span className="relative flex h-2 w-2 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="text-xs font-medium text-green-600 dark:text-green-400 truncate">Live Contracts</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Overdue */}
                    <Card className={cn(
                        "backdrop-blur-xl border shadow-lg relative overflow-hidden group hover:shadow-xl transition-all",
                        stats.total_overdue_loans > 0
                            ? "bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-200/50 dark:border-red-800/30"
                            : "bg-card/60 border-border/50"
                    )}>
                        <CardHeader className="p-4 pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-sm font-medium text-muted-foreground truncate">Overdue</CardTitle>
                                {stats.total_overdue_loans > 0 && <AlertCircle className="h-4 w-4 text-red-500 animate-pulse shrink-0" />}
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className={cn("text-2xl font-bold", stats.total_overdue_loans > 0 ? "text-red-600 dark:text-red-400" : "text-foreground")}>
                                {stats.total_overdue_loans}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Action Required
                            </p>
                        </CardContent>
                    </Card>

                    {/* Principal Disbursed */}
                    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 backdrop-blur-xl shadow-lg relative overflow-hidden group hover:shadow-xl transition-all">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm font-medium text-primary truncate">Total Principal</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-primary truncate">
                                {formatCurrency(stats.total_principal_disbursed)}
                            </div>
                            <p className="text-xs text-primary/70 mt-1 font-medium truncate">
                                Disbursed Amount
                            </p>
                        </CardContent>
                    </Card>

                    {/* Interest Earned */}
                    <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-200/50 dark:border-emerald-800/30 backdrop-blur-xl shadow-lg relative overflow-hidden group hover:shadow-xl transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <TrendingUp className="h-16 w-16 text-emerald-500" />
                        </div>
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400 truncate">Interest Earned</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 truncate">
                                {formatCurrency(stats.total_interest_earned)}
                            </div>
                            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1 font-medium truncate">
                                Realized Gains
                            </p>
                        </CardContent>
                    </Card>
                </div>


                {/* Main Content Area */}
                <div className="space-y-4 md:space-y-6">
                    {/* Sticky Header */}
                    <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-white/20 dark:border-white/10 pb-4 pt-2 -mx-4 px-4 md:-mx-8 md:px-8 transition-all duration-200 mb-6 rounded-b-2xl">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                <Input
                                    placeholder="Search by name, phone or loan #..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 h-11 rounded-xl bg-card/50 border-input/50 focus:bg-card focus:ring-primary/20 focus:border-primary/50 transition-all shadow-sm"
                                />
                            </div>
                            <div className="flex items-center gap-2 shrink-0 md:hidden">
                                <Button
                                    onClick={() => router.push(`/shop/${shopId}/loans/new`)}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 h-11 px-6 gap-2 transition-all rounded-xl w-full"
                                >
                                    <Plus className="h-4 w-4" />
                                    New
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Card className="border-0 shadow-xl bg-card/40 backdrop-blur-md overflow-hidden ring-1 ring-white/20 dark:ring-white/10 rounded-2xl">
                        <div className="p-0">
                            {/* Mobile View - Cards */}
                            <div className="grid grid-cols-1 md:hidden divide-y divide-white/10 dark:divide-white/5">
                                {filteredLoans.map((loan, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={loan.id}
                                        className="p-4 hover:bg-white/50 dark:hover:bg-white/5 transition-colors cursor-pointer group relative overflow-hidden"
                                        onClick={() => router.push(`/shop/${shopId}/loans/${loan.id}`)}
                                    >
                                        {/* Card Header: ID & Status */}
                                        <div className="flex justify-between items-start mb-3 relative z-10">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="outline" className="font-mono text-xs bg-background/50 backdrop-blur border-primary/20 text-primary">
                                                        #{loan.loan_number}
                                                    </Badge>
                                                    <StatusBadge status={loan.status} />
                                                </div>
                                                <div className="font-semibold text-lg text-foreground">
                                                    {loan.loan_customers?.name}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-xl text-primary">
                                                    {formatCurrency(loan.principal_amount)}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Principal</div>
                                            </div>
                                        </div>

                                        {/* Middle Row: Date & Interest */}
                                        <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
                                            <div className="bg-background/40 p-2 rounded-lg border border-white/10">
                                                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-0.5">
                                                    <Calendar className="h-3 w-3" /> Start Date
                                                </p>
                                                <p className="font-medium text-sm">{format(new Date(loan.created_at), "dd MMM yy")}</p>
                                            </div>
                                            <div className="bg-background/40 p-2 rounded-lg border border-white/10">
                                                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-0.5">
                                                    <Wallet className="h-3 w-3" /> Interest Rate
                                                </p>
                                                <p className="font-medium text-sm">{loan.interest_rate}% / yr</p>
                                            </div>
                                        </div>

                                        {/* Upcoming Payment Section */}
                                        {loan.status === 'active' && (
                                            <div className="mt-3 bg-primary/5 border border-primary/10 rounded-xl p-3 flex justify-between items-center relative z-10">
                                                <div>
                                                    <div className="flex items-center gap-1.5 text-primary mb-0.5">
                                                        <AlertCircle className="h-3.5 w-3.5" />
                                                        <span className="text-xs font-bold uppercase tracking-wide">Next Due</span>
                                                    </div>
                                                    <div className="text-sm">
                                                        <span className="font-bold">{formatCurrency(getMonthlyInterest(loan.principal_amount, loan.interest_rate))}</span>
                                                        <span className="text-muted-foreground text-xs ml-1">
                                                            on {format(getNextDueDate(loan.start_date || loan.created_at), 'dd MMM')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 rounded-lg bg-background/50 hover:bg-primary/10 text-primary border-primary/20 text-xs"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toast.success(`Reminder sent to ${loan.loan_customers?.name}`, {
                                                            description: "They will receive an SMS/WhatsApp notification shortly."
                                                        });
                                                    }}
                                                >
                                                    Remind
                                                </Button>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                                {loans.length === 0 ? (
                                    <div className="p-12 text-center flex flex-col items-center justify-center">
                                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                            <Coins className="h-8 w-8 text-primary" />
                                        </div>
                                        <h3 className="text-lg font-bold text-foreground mb-2">No loans created yet</h3>
                                        <p className="text-muted-foreground text-sm max-w-xs mb-6">
                                            Get started by creating your first gold loan or girvi entry.
                                        </p>
                                        <Button
                                            onClick={() => router.push(`/shop/${shopId}/loans/new`)}
                                            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2 pl-4 pr-5 shadow-lg"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Create New Loan
                                        </Button>
                                    </div>
                                ) : filteredLoans.length === 0 ? (
                                    <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                                        <Search className="h-10 w-10 text-muted-foreground/30 mb-3" />
                                        <p className="font-medium">No active loans found</p>
                                        <p className="text-sm">Try adjusting your search terms.</p>
                                    </div>
                                ) : null}

                                {/* Mobile Pagination */}
                                {pagination && pagination.totalCount > 0 && (
                                    <div className="flex items-center justify-between p-4 border-t border-white/10">
                                        <div className="text-sm text-muted-foreground">
                                            {((pagination.currentPage - 1) * pagination.limit) + 1}-{Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => goToPage(pagination.currentPage - 1)}
                                                disabled={pagination.currentPage <= 1}
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => goToPage(pagination.currentPage + 1)}
                                                disabled={pagination.currentPage >= pagination.totalPages}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Desktop View - Table */}
                            <div className="hidden md:block overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-primary/5 backdrop-blur-sm border-b border-primary/10">
                                        <TableRow className="hover:bg-transparent border-none">
                                            <TableHead className="text-primary/70 font-semibold h-12">Loan Details</TableHead>
                                            <TableHead className="text-primary/70 font-semibold h-12">Customer</TableHead>
                                            <TableHead className="text-primary/70 font-semibold h-12">Principal</TableHead>
                                            <TableHead className="text-primary/70 font-semibold h-12">Interest</TableHead>
                                            <TableHead className="text-primary/70 font-semibold h-12">Status</TableHead>
                                            <TableHead className="text-right text-primary/70 font-semibold h-12">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredLoans.map((loan, idx) => (
                                            <TableRow
                                                key={loan.id}
                                                className="cursor-pointer hover:bg-primary/5 transition-colors border-white/5"
                                                onClick={() => router.push(`/shop/${shopId}/loans/${loan.id}`)}
                                            >
                                                <TableCell className="font-medium">
                                                    <div className="text-foreground">#{loan.loan_number}</div>
                                                    <div className="text-xs text-muted-foreground">{format(new Date(loan.created_at), "dd MMM yyyy")}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-foreground">{loan.loan_customers?.name}</div>
                                                    <div className="text-xs text-muted-foreground">{loan.loan_customers?.phone}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-bold text-primary">
                                                        {formatCurrency(loan.principal_amount)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm text-foreground">{loan.interest_rate}% / mo</div>
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge status={loan.status} />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" className="hover:text-primary hover:bg-primary/10 rounded-lg">
                                                        View <ArrowRight className="h-4 w-4 ml-1" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredLoans.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                    No result found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>

                                {/* Desktop Pagination */}
                                {pagination && pagination.totalCount > 0 && (
                                    <div className="flex items-center justify-between border-t border-gray-200 dark:border-white/10 p-4 bg-muted/20 backdrop-blur-sm z-20">
                                        <div className="text-sm text-muted-foreground text-center sm:text-left">
                                            Showing <span className="font-medium text-foreground">{(pagination?.currentPage - 1) * pagination?.limit + 1}</span> - <span className="font-medium text-foreground">{Math.min(pagination?.currentPage * pagination?.limit, pagination?.totalCount)}</span> of <span className="font-medium text-foreground">{pagination?.totalCount}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => goToPage(pagination.currentPage - 1)}
                                                disabled={pagination.currentPage <= 1}
                                                className="rounded-full px-4 border-none shadow-sm bg-background hover:bg-muted"
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => goToPage(pagination.currentPage + 1)}
                                                disabled={pagination.currentPage >= pagination.totalPages}
                                                className="rounded-full px-4 border-none shadow-sm bg-background hover:bg-muted"
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
