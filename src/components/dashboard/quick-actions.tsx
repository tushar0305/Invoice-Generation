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
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
            {actions.map((action) => (
                <Link key={action.href} href={action.href} className="w-full sm:w-auto">
                    <Button
                        className={cn(
                            "w-full h-9 sm:h-10 gap-1.5 sm:gap-2 rounded-lg font-medium transition-all px-2 sm:px-4 text-xs sm:text-sm",
                            action.primary ? "shadow-md" : "",
                            action.color
                        )}
                        variant={action.primary ? "default" : "ghost"}
                    >
                        <action.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                        <span className="whitespace-nowrap truncate">{action.label}</span>
                    </Button>
                </Link>
            ))}
        </div>
    );
}
