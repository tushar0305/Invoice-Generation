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
import { format } from 'date-fns';
import { motion } from 'framer-motion';

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
                            <Button variant="outline" size="sm" className="hidden md:flex">
                                <Calendar className="h-4 w-4 mr-2" />
                                Filter Date
                            </Button>
                        </div>
                    </div>

                    <div className="p-0">
                        {/* Mobile View - Cards */}
                        <div className="grid grid-cols-1 md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredLoans.map((loan) => (
                                <div
                                    key={loan.id}
                                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                                    onClick={() => router.push(`/shop/${shopId}/loans/${loan.id}`)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                {loan.loan_customers?.name}
                                                <StatusBadge status={loan.status} />
                                            </div>
                                            <div className="text-sm text-muted-foreground">#{loan.loan_number} • {format(new Date(loan.created_at), "dd MMM yyyy")}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-[#b5952f] dark:text-[#D4AF37]">
                                                {formatCurrency(loan.principal_amount)}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Principal</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-3 text-sm">
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <Wallet className="h-3 w-3" />
                                            <span>Interest: {loan.interest_rate}%</span>
                                        </div>
                                        <Badge variant="outline" className="border-gray-200 dark:border-gray-700 font-normal">
                                            View Details <ArrowRight className="h-3 w-3 ml-1" />
                                        </Badge>
                                    </div>
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
