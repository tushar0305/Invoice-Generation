'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { m, LazyMotion, domAnimation, AnimatePresence } from 'framer-motion';
import {
    Plus,
    FileText,
    UserPlus,
    Package,
    CreditCard,
    ChevronDown,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DesktopQuickActionsProps {
    shopId: string;
    className?: string;
}

export function DesktopQuickActions({ shopId, className }: DesktopQuickActionsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const actions = [
        {
            id: 'invoice',
            label: 'New Invoice',
            icon: FileText,
            href: `/shop/${shopId}/invoices/new`,
            color: 'bg-[hsl(var(--primary))]', // Theme primary
            description: 'Create a new invoice'
        },
        {
            id: 'customer',
            label: 'Add Customer',
            icon: UserPlus,
            href: `/shop/${shopId}/customers?action=add`,
            color: 'bg-[hsl(var(--primary))]', // Theme primary
            description: 'Register new client'
        },
        {
            id: 'stock',
            label: 'Add Stock',
            icon: Package,
            href: `/shop/${shopId}/stock?action=add`,
            color: 'bg-[hsl(var(--primary))]', // Theme primary
            description: 'Update inventory'
        },
        {
            id: 'payment',
            label: 'Record Payment',
            icon: CreditCard,
            href: `/shop/${shopId}/invoices?action=payment`,
            color: 'bg-[hsl(var(--primary))]', // Theme primary
            description: 'Log a payment'
        },
    ];

    const handleAction = (href: string) => {
        setIsOpen(false);
        router.push(href);
    };

    return (
        <LazyMotion features={domAnimation}>
            {/* Desktop Quick Actions - Hidden on mobile */}
            <div className={cn("hidden lg:block relative", className)}>
                {/* Trigger Button */}
                <m.button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2.5",
                        "bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))]",
                        "hover:from-[hsl(var(--primary))]/90 hover:to-[hsl(var(--primary))]",
                        "text-[hsl(var(--primary-foreground))] font-semibold text-sm",
                        "rounded-[14px] shadow-md",
                        "transition-all duration-200",
                        "border border-[hsl(var(--primary))]/30"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Zap className="h-4 w-4" />
                    <span>Quick Actions</span>
                    <m.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown className="h-4 w-4" />
                    </m.div>
                </m.button>

                {/* Dropdown Menu - wrapped in Portal-like behavior with max z-index */}
                <AnimatePresence>
                    {isOpen && (
                        <div className="fixed inset-0 z-[99997]" style={{ isolation: 'isolate' }}>
                            {/* Backdrop - transparent overlay to close menu */}
                            <m.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-[99998] bg-black/10 dark:bg-black/30"
                                onClick={() => setIsOpen(false)}
                            />

                            {/* Menu - Quick Actions Dropdown */}
                            <m.div
                                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className={cn(
                                    "absolute z-[99999]",
                                    "min-w-[280px] max-w-[320px] p-2",
                                    "bg-white dark:bg-gray-900",
                                    "backdrop-blur-xl",
                                    "border-2 border-gray-200 dark:border-gray-700",
                                    "rounded-[16px]",
                                    "shadow-2xl"
                                )}
                                style={{
                                    top: 'calc(100vh - 85vh)',
                                    right: '1rem'
                                }}
                            >
                                {actions.map((action, index) => (
                                    <m.button
                                        key={action.id}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{
                                            opacity: 1,
                                            x: 0,
                                            transition: { delay: index * 0.03 }
                                        }}
                                        onClick={() => handleAction(action.href)}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-3",
                                            "rounded-xl",
                                            "hover:bg-stone-50/80 dark:hover:bg-stone-800/30",
                                            "transition-colors duration-150",
                                            "group"
                                        )}
                                    >
                                        <div className={cn(
                                            "flex items-center justify-center",
                                            "w-10 h-10 rounded-xl",
                                            action.color,
                                            "text-white shadow-sm",
                                            "group-hover:scale-105 transition-transform"
                                        )}>
                                            <action.icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="font-semibold text-sm text-[#1D1F23] dark:text-white group-hover:text-[hsl(var(--primary))] transition-colors">
                                                {action.label}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {action.description}
                                            </p>
                                        </div>
                                    </m.button>
                                ))}
                            </m.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </LazyMotion>
    );
}

export default DesktopQuickActions;
