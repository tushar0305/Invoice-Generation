'use client';

import { EmptyState } from '@/components/ui/empty-state';
import { FileText, Eye } from 'lucide-react';

export function RecentInvoicesEmptyState() {
    return (
        <EmptyState
            icon={FileText}
            title=""
            description="No invoices generated yet."
            className="py-2"
        />
    );
}

export function PendingActionsEmptyState() {
    return (
        <EmptyState
            icon={Eye}
            title=""
            description="No pending actions required."
            className="py-2"
        />
    );
}
