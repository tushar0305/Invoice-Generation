'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { m, LazyMotion, domAnimation, AnimatePresence } from 'framer-motion';
import {
    Plus,
    X,
    FileText,
    UserPlus,
    Package,
    CreditCard,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FABAction {
    id: string;
    label: string;
    icon: React.ElementType;
    href?: string;
    onClick?: () => void;
    color: string;
}

interface GlobalFABProps {
    shopId: string;
    className?: string;
}

export function GlobalFAB({ shopId, className }: GlobalFABProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showTooltip, setShowTooltip] = useState(true);
    const router = useRouter();

    // Auto-hide tooltip after 3 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowTooltip(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    // Show tooltip briefly when FAB is tapped/closed
    const handleFABInteraction = useCallback(() => {
        setIsOpen(prev => {
            if (prev) {
                // When closing, show tooltip briefly
                setShowTooltip(true);
                setTimeout(() => setShowTooltip(false), 2000);
            } else {
                // When opening, hide tooltip
                setShowTooltip(false);
            }
            return !prev;
        });
    }, []);

    const actions: FABAction[] = [
        {
            id: 'invoice',
            label: 'New Invoice',
            icon: FileText,
            href: `/shop/${shopId}/invoices/new`,
            color: 'bg-[#A5833A] text-white', // Deep luxe gold
        },
        {
            id: 'customer',
            label: 'Add Customer',
            icon: UserPlus,
            href: `/shop/${shopId}/customers?action=add`,
            color: 'bg-[#2AA198] text-white', // Muted teal
        },
        {
            id: 'stock',
            label: 'Add Stock',
            icon: Package,
            href: `/shop/${shopId}/stock?action=add`,
            color: 'bg-slate-500 text-white', // Neutral slate
        },
        {
            id: 'payment',
            label: 'Record Payment',
            icon: CreditCard,
            href: `/shop/${shopId}/invoices?action=payment`,
            color: 'bg-[#A08CD5] text-white', // Muted lavender
        },
    ];

    const handleAction = useCallback((action: FABAction) => {
        setIsOpen(false);
        if (action.onClick) {
            action.onClick();
        } else if (action.href) {
            router.push(action.href);
        }
    }, [router]);

    return (
        <LazyMotion features={domAnimation}>
            {/* Mobile FAB - Hidden on desktop (≥1024px) where we use Desktop Quick Actions */}
            <div className={cn("fixed z-40 lg:hidden", className)}>
                {/* Backdrop */}
                <AnimatePresence>
                    {isOpen && (
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="fixed inset-0 bg-black/30 backdrop-blur-[2px]"
                            onClick={() => {
                                setIsOpen(false);
                                setShowTooltip(true);
                                setTimeout(() => setShowTooltip(false), 2000);
                            }}
                        />
                    )}
                </AnimatePresence>

                {/* FAB Menu Items */}
                <AnimatePresence>
                    {isOpen && (
                        <div className="fixed right-4 bottom-44 flex flex-col-reverse items-end gap-2.5">
                            {actions.map((action, index) => (
                                <m.button
                                    key={action.id}
                                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        scale: 1,
                                    }}
                                    exit={{
                                        opacity: 0,
                                        y: 10,
                                        scale: 0.9,
                                        transition: {
                                            delay: (actions.length - index - 1) * 0.02,
                                            duration: 0.12
                                        }
                                    }}
                                    transition={{
                                        delay: index * 0.05,
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 22,
                                        mass: 0.8
                                    }}
                                    onClick={() => handleAction(action)}
                                    className={cn(
                                        "flex items-center gap-3",
                                        "pl-3 pr-4 py-3 min-h-[52px]",
                                        "bg-white/90 dark:bg-gray-900/90",
                                        "backdrop-blur-md",
                                        "border border-stone-200/50 dark:border-stone-700/30",
                                        "rounded-[18px]",
                                        "shadow-[0_4px_20px_rgba(0,0,0,0.08)]",
                                        "dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]",
                                        "transition-all duration-200",
                                        "hover:bg-stone-50/80 dark:hover:bg-stone-800/30",
                                        "active:scale-[0.97]"
                                    )}
                                    whileHover={{ scale: 1.02, x: -4 }}
                                    whileTap={{ scale: 0.96 }}
                                >
                                    <m.div
                                        className={cn(
                                            "flex items-center justify-center",
                                            "w-9 h-9 rounded-xl",
                                            action.color,
                                            "shadow-sm"
                                        )}
                                        initial={{ rotate: -10, scale: 0.8 }}
                                        animate={{ rotate: 0, scale: 1 }}
                                        transition={{
                                            delay: index * 0.05 + 0.1,
                                            type: "spring",
                                            stiffness: 500,
                                            damping: 20
                                        }}
                                    >
                                        <action.icon className="w-[18px] h-[18px]" />
                                    </m.div>
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                                        {action.label}
                                    </span>
                                </m.button>
                            ))}
                        </div>
                    )}
                </AnimatePresence>

                {/* Main FAB Button with pulse effect */}
                <m.button
                    onClick={handleFABInteraction}
                    className={cn(
                        "fixed right-4 bottom-28",
                        "w-14 h-14",
                        "flex items-center justify-center",
                        "rounded-full",
                        "transition-all duration-300",
                        isOpen
                            ? "bg-gray-800 dark:bg-gray-200"
                            : "bg-gradient-to-br from-[#CBB27A] to-[#A5833A]",
                        "shadow-[0_4px_16px_rgba(165,131,58,0.25)]",
                        isOpen && "shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
                    )}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    animate={{
                        rotate: isOpen ? 45 : 0,
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17
                    }}
                >
                    {/* Pulsing ring animation when closed */}
                    {!isOpen && showTooltip && (
                        <m.div
                            className="absolute inset-0 rounded-full border-2 border-[#CBB27A]"
                            initial={{ scale: 1, opacity: 0.6 }}
                            animate={{
                                scale: [1, 1.4, 1.4],
                                opacity: [0.6, 0, 0]
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeOut"
                            }}
                        />
                    )}

                    {/* Inner highlight */}
                    <div className={cn(
                        "absolute inset-0 rounded-full",
                        "bg-gradient-to-b from-white/20 to-transparent",
                        "pointer-events-none"
                    )} />

                    <m.div
                        animate={{ rotate: isOpen ? 45 : 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                        {isOpen ? (
                            <X className="w-5 h-5 text-white dark:text-gray-800 relative z-10" />
                        ) : (
                            <Plus className="w-6 h-6 text-white relative z-10" strokeWidth={2.5} />
                        )}
                    </m.div>
                </m.button>

                {/* Quick tip badge - now with timed visibility */}
                <AnimatePresence>
                    {!isOpen && showTooltip && (
                        <m.div
                            initial={{ opacity: 0, x: 12, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 8, scale: 0.95 }}
                            transition={{
                                type: "spring",
                                stiffness: 350,
                                damping: 25
                            }}
                            className={cn(
                                "fixed right-[4.75rem] bottom-[7.25rem]",
                                "flex items-center gap-1.5",
                                "px-3 py-1.5",
                                "bg-gray-800/95 dark:bg-gray-100/95",
                                "text-white dark:text-gray-900",
                                "text-xs font-semibold",
                                "rounded-full",
                                "shadow-md",
                                "pointer-events-none"
                            )}
                        >
                            <Sparkles className="w-3 h-3" />
                            Quick Actions
                        </m.div>
                    )}
                </AnimatePresence>
            </div>
        </LazyMotion>
    );
}

export default GlobalFAB;
