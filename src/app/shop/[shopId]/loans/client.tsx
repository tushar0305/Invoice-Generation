'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus,
    Search,
    Coins,
    Banknote,
    AlertCircle,
    FileText,
    Calendar,
    ArrowRight,
    TrendingUp,
    Wallet
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
};

export function LoansDashboardClient({
    loans,
    stats,
    shopId,
}: LoansDashboardClientProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredLoans = loans.filter(loan =>
        loan.loan_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.loan_customers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.loan_customers?.phone.includes(searchTerm)
    );

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Liquid Gradient Background */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-yellow-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
                <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-amber-300/5 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
            </div>

            <div className="relative p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto">
                {/* Glassy Modern Header */}
                <div className="backdrop-blur-xl bg-card/70 dark:bg-card/50 rounded-3xl border border-border/50 shadow-xl p-5 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                    <Coins className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                <span className="text-xs font-bold tracking-wider text-amber-600 dark:text-amber-400 uppercase">
                                    Gold Loan Management
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                                Loans & Mortgages
                            </h1>
                            <p className="text-muted-foreground text-sm md:text-lg max-w-xl">
                                Track active gold loans, manage interest collections, and monitor overdue accounts with ease.
                            </p>
                        </div>
                        <div className="hidden md:block">
                            <Button
                                onClick={() => router.push(`/shop/${shopId}/loans/new`)}
                                className="h-12 px-6 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white shadow-lg shadow-amber-500/25 border-0"
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                New Loan / Girvi
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Active Loans */}
                    <Card className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border-border/50 shadow-lg relative overflow-hidden group hover:shadow-xl transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <FileText className="h-20 w-20 text-amber-500" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Active Loans</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-foreground">{stats.total_active_loans}</div>
                            <div className="flex items-center gap-1.5 mt-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="text-xs font-medium text-green-600 dark:text-green-400">Live Contracts</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Principal Disbursed */}
                    <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-200/50 dark:border-amber-800/30 backdrop-blur-xl shadow-lg relative overflow-hidden group hover:shadow-xl transition-all">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">Total Principal</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-amber-700 dark:text-amber-400">
                                {formatCurrency(stats.total_principal_disbursed)}
                            </div>
                            <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1 font-medium">
                                Disbursed Amount
                            </p>
                        </CardContent>
                    </Card>

                    {/* Interest Earned */}
                    <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-200/50 dark:border-emerald-800/30 backdrop-blur-xl shadow-lg relative overflow-hidden group hover:shadow-xl transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <TrendingUp className="h-20 w-20 text-emerald-500" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Interest Earned</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                                {formatCurrency(stats.total_interest_earned)}
                            </div>
                            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1 font-medium">
                                Realized Gains
                            </p>
                        </CardContent>
                    </Card>

                    {/* Overdue */}
                    <Card className={cn(
                        "backdrop-blur-xl border shadow-lg relative overflow-hidden group hover:shadow-xl transition-all",
                        stats.total_overdue_loans > 0
                            ? "bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-200/50 dark:border-red-800/30"
                            : "bg-card/60 border-border/50"
                    )}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
                                {stats.total_overdue_loans > 0 && <AlertCircle className="h-4 w-4 text-red-500 animate-pulse" />}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className={cn("text-3xl font-bold", stats.total_overdue_loans > 0 ? "text-red-600 dark:text-red-400" : "text-foreground")}>
                                {stats.total_overdue_loans}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Action Required
                            </p>
                        </CardContent>
                    </Card>
                </div>


                {/* Main Content Area */}
                <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 space-y-4 md:space-y-6">
                    {/* Sticky Header */}
                    <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-white/20 dark:border-white/10 pb-4 pt-2 -mx-4 px-4 md:-mx-8 md:px-8 transition-all duration-200 mb-6 rounded-b-2xl">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                                <Input
                                    placeholder="Search by name, phone or loan #..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 h-11 rounded-xl bg-card/50 border-input/50 focus:bg-card focus:ring-amber-500/20 focus:border-amber-500/50 transition-all shadow-sm"
                                />
                            </div>
                            <div className="flex items-center gap-2 shrink-0 md:hidden">
                                <Button
                                    onClick={() => router.push(`/shop/${shopId}/loans/new`)}
                                    className="bg-[#D4AF37] hover:bg-[#b5952f] text-white shadow-lg shadow-amber-500/20 h-11 px-6 gap-2 transition-all rounded-xl w-full"
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
                                                    <Badge variant="outline" className="font-mono text-xs bg-background/50 backdrop-blur border-amber-200/50 text-amber-900 dark:text-amber-100">
                                                        #{loan.loan_number}
                                                    </Badge>
                                                    <StatusBadge status={loan.status} />
                                                </div>
                                                <div className="font-semibold text-lg text-foreground">
                                                    {loan.loan_customers?.name}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-xl text-amber-600 dark:text-amber-400">
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
                                            <div className="mt-3 bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 flex justify-between items-center relative z-10">
                                                <div>
                                                    <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 mb-0.5">
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
                                                    className="h-8 rounded-lg bg-background/50 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-xs"
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
                                        <div className="h-16 w-16 rounded-full bg-amber-100/50 dark:bg-amber-900/20 flex items-center justify-center mb-4">
                                            <Coins className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <h3 className="text-lg font-bold text-foreground mb-2">No loans created yet</h3>
                                        <p className="text-muted-foreground text-sm max-w-xs mb-6">
                                            Get started by creating your first gold loan or girvi entry.
                                        </p>
                                        <Button
                                            onClick={() => router.push(`/shop/${shopId}/loans/new`)}
                                            className="bg-[#D4AF37] hover:bg-[#b5952f] text-white rounded-xl gap-2 pl-4 pr-5 shadow-lg"
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
                            </div>

                            {/* Desktop View - Table */}
                            <div className="hidden md:block overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-amber-500/5 backdrop-blur-sm border-b border-amber-500/10">
                                        <TableRow className="hover:bg-transparent border-none">
                                            <TableHead className="text-amber-900/70 dark:text-amber-100/70 font-semibold h-12">Loan Details</TableHead>
                                            <TableHead className="text-amber-900/70 dark:text-amber-100/70 font-semibold h-12">Customer</TableHead>
                                            <TableHead className="text-amber-900/70 dark:text-amber-100/70 font-semibold h-12">Principal</TableHead>
                                            <TableHead className="text-amber-900/70 dark:text-amber-100/70 font-semibold h-12">Interest</TableHead>
                                            <TableHead className="text-amber-900/70 dark:text-amber-100/70 font-semibold h-12">Status</TableHead>
                                            <TableHead className="text-right text-amber-900/70 dark:text-amber-100/70 font-semibold h-12">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredLoans.map((loan, idx) => (
                                            <TableRow
                                                key={loan.id}
                                                className="cursor-pointer hover:bg-amber-500/5 transition-colors border-white/5"
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
                                                    <div className="font-bold text-amber-600 dark:text-amber-400">
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
                                                    <Button variant="ghost" size="sm" className="hover:text-amber-600 hover:bg-amber-500/10 rounded-lg">
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
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
