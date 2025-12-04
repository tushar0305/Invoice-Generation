'use client';

import { motion } from 'framer-motion';
import { Plus, Users, PackagePlus, TrendingUp, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const quickActions = [
    { label: 'New Invoice', icon: Plus, color: 'bg-amber-500 hover:bg-amber-600', path: '/invoices/new' },
    { label: 'Customers', icon: Users, color: 'bg-blue-500 hover:bg-blue-600', path: '/customers' },
    { label: 'Add Stock', icon: PackagePlus, color: 'bg-emerald-500 hover:bg-emerald-600', path: '/stock' },
    { label: 'Insights', icon: TrendingUp, color: 'bg-purple-500 hover:bg-purple-600', path: '/insights' },
];

interface FloatingActionsProps {
    shopId: string;
}

export function FloatingActions({ shopId }: FloatingActionsProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Action Buttons - Show when open */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute bottom-20 right-0 flex flex-col gap-3 mb-2"
                >
                    {quickActions.map((action, index) => (
                        <motion.div
                            key={action.path}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Link
                                href={`/shop/${shopId}${action.path}`}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-full shadow-lg",
                                    "text-white font-medium text-sm",
                                    "transition-all duration-200 hover:scale-105",
                                    "border-2 border-white/20",
                                    action.color
                                )}
                                onClick={() => setIsOpen(false)}
                            >
                                <action.icon className="h-5 w-5" />
                                <span className="whitespace-nowrap">{action.label}</span>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Main FAB Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-14 h-14 rounded-full shadow-xl",
                    "flex items-center justify-center",
                    "text-white font-bold",
                    "transition-all duration-300",
                    "border-2 border-white/20",
                    isOpen
                        ? "bg-red-500 hover:bg-red-600 rotate-90"
                        : "bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                )}
                aria-label={isOpen ? "Close menu" : "Open quick actions"}
            >
                {isOpen ? (
                    <X className="h-6 w-6" />
                ) : (
                    <Plus className="h-6 w-6" />
                )}
            </motion.button>
        </div>
    );
}
