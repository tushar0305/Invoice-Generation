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
        <div className="min-h-screen bg-muted/10 pb-20">
            {/* Gold Header Gradient */}
            <div className="bg-gradient-to-b from-amber-50 to-background dark:from-background dark:to-background border-b border-border pt-8 pb-12 px-4 md:px-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-[#D4AF37] font-semibold text-sm mb-1">
                                <Coins className="h-4 w-4" />
                                <span>Gold Loan Management</span>
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Loans & Mortgages</h1>
                            <p className="text-muted-foreground dark:text-gray-400 mt-1 max-w-xl">
                                Track active gold loans, manage interest collections, and monitor overdue accounts.
                            </p>
                        </div>
                        <Button
                            onClick={() => router.push(`/shop/${shopId}/loans/new`)}
                            className="bg-[#D4AF37] hover:bg-[#b5952f] text-white shadow-lg shadow-amber-500/20 h-11 px-6 gap-2 transition-all hover:scale-105"
                        >
                            <Plus className="h-4 w-4" />
                            New Loan / Girvi
                        </Button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                        {/* Active Loans */}
                        <Card className="border border-border shadow-sm bg-card relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <FileText className="h-16 w-16 text-[#D4AF37]" />
                            </div>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Active Loans</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_active_loans}</div>
                                <div className="flex items-center gap-1 mt-1 text-xs text-green-600 dark:text-green-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span>Currently running properties</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Principal Disbursed */}
                        <Card className="border border-border shadow-sm bg-card relative overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-[#b5952f] dark:text-[#D4AF37]">Active Principal</CardTitle>
                                <Banknote className="h-4 w-4 text-[#D4AF37]" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-[#b5952f] dark:text-[#D4AF37]">
                                    {formatCurrency(stats.total_principal_disbursed)}
                                </div>
                                <p className="text-xs text-[#b5952f]/70 dark:text-[#D4AF37]/70 mt-1">
                                    Total amount in market
                                </p>
                            </CardContent>
                        </Card>

                        {/* Interest Earned */}
                        <Card className="border border-border shadow-sm bg-card relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <TrendingUp className="h-16 w-16 text-emerald-500" />
                            </div>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Interest Earned</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(stats.total_interest_earned)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Total interest resolved
                                </p>
                            </CardContent>
                        </Card>

                        {/* Overdue */}
                        <Card className={cn(
                            "border-none shadow-xl shadow-red-900/5 relative overflow-hidden group transition-all",
                            stats.total_overdue_loans > 0 ? "bg-red-50 dark:bg-red-900/20" : "bg-white dark:bg-gray-900"
                        )}>
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <AlertCircle className="h-16 w-16 text-red-500" />
                            </div>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Accounts</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className={cn("text-2xl font-bold", stats.total_overdue_loans > 0 ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white")}>
                                    {stats.total_overdue_loans}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Loans passed due date
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8">
                <Card className="border border-border shadow-sm bg-card">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, phone or loan #"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 border-gray-200 dark:border-gray-700 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                            />
                        </div>
                        <div className="flex gap-2">
                            {/* Future: Add Date Range Filter */}
                        </div>
                    </div>

                    <div className="p-0">
                        {/* Mobile View - Cards */}
                        <div className="grid grid-cols-1 md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredLoans.map((loan) => (
                                <div
                                    key={loan.id}
                                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
                                    onClick={() => router.push(`/shop/${shopId}/loans/${loan.id}`)}
                                >
                                    {/* Card Header: ID & Status */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
                                                    #{loan.loan_number}
                                                </Badge>
                                                <StatusBadge status={loan.status} />
                                            </div>
                                            <div className="font-semibold text-gray-900 dark:text-white text-lg">
                                                {loan.loan_customers?.name}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-xl text-[#b5952f] dark:text-[#D4AF37]">
                                                {formatCurrency(loan.principal_amount)}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Principal</div>
                                        </div>
                                    </div>

                                    {/* Middle Row: Date & Interest */}
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-md">
                                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-0.5">
                                                <Calendar className="h-3 w-3" /> Start Date
                                            </p>
                                            <p className="font-medium text-sm">{format(new Date(loan.created_at), "dd MMM yy")}</p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-md">
                                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-0.5">
                                                <Wallet className="h-3 w-3" /> Interest Rate
                                            </p>
                                            <p className="font-medium text-sm">{loan.interest_rate}% / yr</p>
                                        </div>
                                    </div>

                                    {/* Upcoming Payment Section */}
                                    {loan.status === 'active' && (
                                        <div className="mt-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-lg p-3 flex justify-between items-center group-hover:border-amber-200 transition-colors">
                                            <div>
                                                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 mb-0.5">
                                                    <AlertCircle className="h-3.5 w-3.5" />
                                                    <span className="text-xs font-bold uppercase tracking-wide">Next Payment Due</span>
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
                                                className="h-8 bg-white hover:bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-300 text-xs"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toast.success(`Reminder sent to ${loan.loan_customers?.name}`, {
                                                        description: "They will receive an SMS/WhatsApp notification shortly."
                                                    });
                                                }}
                                            >
                                                Send Reminder
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {filteredLoans.length === 0 && (
                                <div className="p-8 text-center text-muted-foreground">
                                    No loans found matching your search.
                                </div>
                            )}
                        </div>

                        {/* Desktop View - Table */}
                        <div className="hidden md:block overflow-hidden rounded-b-xl">
                            <Table>
                                <TableHeader className="bg-gray-50/50 dark:bg-gray-900/50">
                                    <TableRow>
                                        <TableHead>Loan Details</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Principal</TableHead>
                                        <TableHead>Interest</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLoans.map((loan) => (
                                        <TableRow
                                            key={loan.id}
                                            className="cursor-pointer hover:bg-amber-50/30 dark:hover:bg-amber-900/10"
                                            onClick={() => router.push(`/shop/${shopId}/loans/${loan.id}`)}
                                        >
                                            <TableCell>
                                                <div className="font-medium text-gray-900 dark:text-white">#{loan.loan_number}</div>
                                                <div className="text-xs text-muted-foreground">{format(new Date(loan.created_at), "dd MMM yyyy")}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{loan.loan_customers?.name}</div>
                                                <div className="text-xs text-muted-foreground">{loan.loan_customers?.phone}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-bold text-[#b5952f] dark:text-[#D4AF37]">
                                                    {formatCurrency(loan.principal_amount)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">{loan.interest_rate}% / mo</div>
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={loan.status} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="hover:text-[#D4AF37]">
                                                    View <ArrowRight className="h-4 w-4 ml-1" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredLoans.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                No loans found.
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
    );
}
