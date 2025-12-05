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
    ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { formatCurrency } from '@/lib/utils';
import type { Loan, LoanDashboardStats } from '@/lib/loan-types';
import { format } from 'date-fns';

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
        <div className="space-y-4 pb-24 px-4 md:px-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-white glow-text-sm">Jewellery Loans</h1>
                    <p className="text-muted-foreground dark:text-gray-400 mt-1">
                        Manage gold loans, collateral, and repayments
                    </p>
                </div>
                <Button
                    onClick={() => router.push(`/shop/${shopId}/loans/new`)}
                    className="gap-2 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)] transition-all duration-300 bg-primary text-primary-foreground border-none"
                >
                    <Plus className="h-4 w-4" />
                    New Loan
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-gray-200 dark:border-white/10 bg-white/50 dark:bg-card/30 backdrop-blur-md shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-300">Active Loans</CardTitle>
                        <FileText className="h-4 w-4 text-primary glow-text-sm" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground dark:text-white">{stats.total_active_loans}</div>
                        <p className="text-xs text-muted-foreground dark:text-gray-500 mt-1">
                            Currently running
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-amber-500/20 bg-amber-500/5 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400">Principal Disbursed</CardTitle>
                        <Banknote className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-500 glow-text-sm">
                            ₹{formatCurrency(stats.total_principal_disbursed)}
                        </div>
                        <p className="text-xs text-amber-600/60 dark:text-amber-500/60 mt-1">
                            Total active principal
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-emerald-500/20 bg-emerald-500/5 backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Interest Earned</CardTitle>
                        <Coins className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500 glow-text-sm">
                            ₹{formatCurrency(stats.total_interest_earned)}
                        </div>
                        <p className="text-xs text-emerald-600/60 dark:text-emerald-500/60 mt-1">
                            Total revenue
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-red-500/20 bg-red-500/5 backdrop-blur-md shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">Overdue Loans</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-500 glow-text-sm">{stats.total_overdue_loans}</div>
                        <p className="text-xs text-red-600/60 dark:text-red-500/60 mt-1">
                            Need attention
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Active Loans Table */}
            <Card className="border-gray-200 dark:border-white/10 bg-white/50 dark:bg-card/30 backdrop-blur-md shadow-lg overflow-hidden">
                <CardHeader className="border-b border-gray-200 dark:border-white/10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle className="text-foreground dark:text-white">Active Loans</CardTitle>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search loans..."
                                className="pl-9 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-foreground dark:text-white placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all duration-300"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                            <TableRow className="hover:bg-transparent border-gray-200 dark:border-white/10">
                                <TableHead className="text-primary glow-text-sm">Loan #</TableHead>
                                <TableHead className="text-primary glow-text-sm">Customer</TableHead>
                                <TableHead className="text-primary glow-text-sm">Start Date</TableHead>
                                <TableHead className="text-right text-primary glow-text-sm">Principal</TableHead>
                                <TableHead className="text-right text-primary glow-text-sm">Interest Rate</TableHead>
                                <TableHead className="text-primary glow-text-sm">Status</TableHead>
                                <TableHead className="text-center text-primary glow-text-sm">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLoans.length === 0 ? (
                                <TableRow className="border-gray-100 dark:border-white/5 hover:bg-transparent">
                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground dark:text-gray-500">
                                        {searchTerm ? 'No loans found matching your search' : 'No active loans. Create a new loan to get started.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLoans.map((loan) => (
                                    <TableRow key={loan.id} className="group cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 border-b border-gray-100 dark:border-white/5 transition-colors" onClick={() => router.push(`/shop/${shopId}/loans/${loan.id}`)}>
                                        <TableCell className="font-medium font-mono text-gray-900 dark:text-gray-300">{loan.loan_number}</TableCell>
                                        <TableCell>
                                            <div className="font-medium text-foreground dark:text-white">{loan.loan_customers?.name}</div>
                                            <div className="text-xs text-muted-foreground dark:text-gray-500">{loan.loan_customers?.phone}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-gray-400">
                                                <Calendar className="h-3 w-3 text-muted-foreground dark:text-gray-500" />
                                                {format(new Date(loan.start_date), 'dd MMM yyyy')}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-gray-900 dark:text-gray-300">
                                            ₹{formatCurrency(loan.principal_amount)}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground dark:text-gray-400">
                                            {loan.interest_rate}%
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={loan.status} />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-center">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary hover:bg-primary/10">
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}
