'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, User, Printer, Plus, MoreVertical, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LoanDetailsHeaderProps {
    shopId: string;
    loan: any; // Replace with proper type if available
    onPrint: () => void;
    onAddPayment: () => void;
    onCloseLoan: () => void;
}

export const LoanDetailsHeader = ({ shopId, loan, onPrint, onAddPayment, onCloseLoan }: LoanDetailsHeaderProps) => {
    const router = useRouter();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'default';
            case 'closed': return 'secondary';
            case 'overdue': return 'destructive';
            case 'rejected': return 'outline';
            default: return 'default';
        }
    };

    return (
        <div className="relative overflow-hidden pb-12">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />

            {/* Floating Orbs */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-primary/15 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />

            {/* Glass Container */}
            <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
                <div className="backdrop-blur-xl bg-white/60 dark:bg-gray-900/60 rounded-3xl border border-white/40 dark:border-white/10 shadow-2xl shadow-primary/10 p-6 md:p-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-3 w-full md:w-auto">
                            <div className="flex items-center gap-3 flex-wrap">
                                <Button variant="ghost" size="icon" onClick={() => router.push(`/shop/${shopId}/loans`)} className="rounded-full hover:bg-primary/10 -ml-2">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/10 backdrop-blur-md text-xs font-medium text-primary">
                                    <FileText className="h-3 w-3" />
                                    <span>Loan Details</span>
                                </div>
                                <Badge variant={getStatusColor(loan.status) as any} className="capitalize shadow-sm">
                                    {loan.status}
                                </Badge>
                            </div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent break-words line-clamp-2">
                                Loan #{loan.loan_number}
                            </h1>
                            <div className="flex items-center gap-2 text-muted-foreground text-base md:text-lg">
                                <User className="h-4 w-4" />
                                <span className="font-medium text-foreground">{loan.customer.name}</span>
                                <span>•</span>
                                <span>{loan.customer.phone}</span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3 w-full md:w-auto">
                            <Button variant="outline" onClick={onPrint} className="rounded-full border-primary/20 hover:bg-primary/5 hover:text-primary flex-1 md:flex-none">
                                <Printer className="h-4 w-4 mr-2" /> Print
                            </Button>
                            {loan.status === 'active' && (
                                <>
                                    <Button onClick={onAddPayment} className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 flex-1 md:flex-none">
                                        <Plus className="h-4 w-4 mr-2" /> Add Payment
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="icon" className="rounded-full">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={onCloseLoan}>
                                                <Lock className="h-4 w-4 mr-2" /> Close Loan
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
