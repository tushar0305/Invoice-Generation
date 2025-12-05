import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Clock, XCircle, Info } from 'lucide-react';

export type StatusType =
    | 'active' | 'closed' | 'overdue' | 'rejected' // Loans
    | 'paid' | 'due' | 'partially_paid' // Invoices
    | 'success' | 'pending' | 'failed' // Transactions
    | 'receivable' | 'payable' | 'settled'; // Khata

interface StatusBadgeProps {
    status: string; // Taking string to be flexible, but mapped internally
    className?: string;
    showIcon?: boolean;
}

// Map statuses to visual variants
const statusConfig: Record<string, { colorClass: string; icon: React.ElementType }> = {
    // Green / Success
    active: { colorClass: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20', icon: Clock },
    paid: { colorClass: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
    success: { colorClass: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
    settled: { colorClass: 'bg-gray-500/15 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400 border-gray-500/20', icon: CheckCircle2 },

    // Red / Danger / Overdue
    overdue: { colorClass: 'bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-500/20', icon: AlertCircle },
    failed: { colorClass: 'bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-500/20', icon: XCircle },
    rejected: { colorClass: 'bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-500/20', icon: XCircle },
    payable: { colorClass: 'bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-500/20', icon: AlertCircle },

    // Yellow / Warning / Pending
    due: { colorClass: 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20', icon: Clock },
    pending: { colorClass: 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20', icon: Clock },
    partially_paid: { colorClass: 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20', icon: Clock },

    // Blue / Info
    closed: { colorClass: 'bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/20', icon: CheckCircle2 },
    receivable: { colorClass: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20', icon: TrendingUpIcon },

    // Default
    default: { colorClass: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200', icon: Info },
};

// StartIcon mock locally if needed or import. 
// Note: 'receivable' technically maps to Up/Income, usually green.
// Let's reuse CheckCircle or define local if needed. 
// Lucid-react exports are used above.

function TrendingUpIcon(props: any) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
}


export function StatusBadge({ status, className, showIcon = false }: StatusBadgeProps) {
    const normalizeStatus = (status || 'default').toLowerCase();
    const config = statusConfig[normalizeStatus] || statusConfig.default;
    const Icon = config.icon;

    return (
        <Badge
            variant="outline"
            className={cn(
                "capitalize border px-2 py-0.5 font-medium shadow-sm transition-colors",
                config.colorClass,
                className
            )}
        >
            {showIcon && <Icon className="w-3 h-3 mr-1.5" />}
            {status}
        </Badge>
    );
}
