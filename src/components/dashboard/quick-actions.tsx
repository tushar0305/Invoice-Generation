'use client';

import Link from 'next/link';
import { Plus, Users, FileText, QrCode, Banknote, PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickActionsProps {
    shopId: string;
}

export function QuickActions({ shopId }: QuickActionsProps) {
    const actions = [
        {
            href: `/shop/${shopId}/invoices/new`,
            label: 'New Invoice',
            icon: FileText,
            color: 'bg-primary hover:bg-primary/90 text-primary-foreground',
            primary: true,
        },
        {
            href: `/shop/${shopId}/customers?action=add`,
            label: 'Add Customer',
            icon: Users,
            color: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20',
        },
        {
            href: `/shop/${shopId}/inventory/new`,
            label: 'Add Item',
            icon: QrCode,
            color: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20',
        },
        {
            href: `/shop/${shopId}/loans/new`,
            label: 'New Loan',
            icon: Banknote,
            color: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
        },
    ];

    return (
        <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:flex-wrap gap-2 scrollbar-hide snap-x">
            {actions.map((action) => (
                <Link key={action.href} href={action.href} className="snap-start shrink-0">
                    <Button
                        className={cn(
                            "h-10 sm:h-9 gap-2 rounded-full sm:rounded-lg font-medium transition-all px-4 sm:px-3",
                            action.primary ? "shadow-md" : "",
                            action.color
                        )}
                        variant={action.primary ? "default" : "ghost"}
                    >
                        <action.icon className="h-4 w-4" />
                        <span className="whitespace-nowrap">{action.label}</span>
                    </Button>
                </Link>
            ))}
        </div>
    );
}
