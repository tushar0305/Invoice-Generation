'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, AlertCircle, TrendingDown, Gift, X } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/supabase/client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Notification {
    id: string;
    type: 'due_invoice' | 'low_stock' | 'loyalty';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    href?: string;
}

interface NotificationCenterProps {
    shopId: string;
    userId: string;
}

export function NotificationCenter({ shopId, userId }: NotificationCenterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen, shopId]);

    const fetchNotifications = async () => {
        setIsLoading(true);
        const allNotifications: Notification[] = [];

        try {
            // Fetch due invoices
            const { data: dueInvoices } = await supabase
                .from('invoices')
                .select('id, invoice_number, customer_name, grand_total, invoice_date')
                .eq('shop_id', shopId)
                .eq('status', 'due')
                .order('invoice_date', { ascending: true })
                .limit(5);

            if (dueInvoices) {
                dueInvoices.forEach(inv => {
                    const daysOverdue = Math.floor((Date.now() - new Date(inv.invoice_date).getTime()) / (1000 * 60 * 60 * 24));
                    allNotifications.push({
                        id: `due-${inv.id}`,
                        type: 'due_invoice',
                        title: 'Payment Due',
                        message: `${inv.customer_name} • ${inv.invoice_number} • ${formatCurrency(inv.grand_total)}${daysOverdue > 0 ? ` (${daysOverdue}d overdue)` : ''}`,
                        timestamp: new Date(inv.invoice_date),
                        read: false,
                        href: `/shop/${shopId}/invoices/view?id=${inv.id}`,
                    });
                });
            }

            // Fetch low stock items
            const { data: lowStock } = await supabase
                .from('stock_items')
                .select('id, name, quantity, min_stock_level')
                .eq('shop_id', shopId)
                .lte('quantity', supabase.rpc('min_stock_level'))
                .limit(5);

            if (lowStock) {
                lowStock.forEach(item => {
                    if (item.quantity <= (item.min_stock_level || 10)) {
                        allNotifications.push({
                            id: `stock-${item.id}`,
                            type: 'low_stock',
                            title: 'Low Stock Alert',
                            message: `${item.name} • Only ${item.quantity} units remaining`,
                            timestamp: new Date(),
                            read: false,
                            href: `/shop/${shopId}/stock`,
                        });
                    }
                });
            }

            // Sort by timestamp (newest first)
            allNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            setNotifications(allNotifications);
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error fetching notifications:', error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const markAsRead = (notificationId: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
    };

    const clearAll = () => {
        setNotifications([]);
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const getIcon = (type: string) => {
        switch (type) {
            case 'due_invoice': return AlertCircle;
            case 'low_stock': return TrendingDown;
            case 'loyalty': return Gift;
            default: return Bell;
        }
    };

    const getColorClass = (type: string) => {
        switch (type) {
            case 'due_invoice': return 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30';
            case 'low_stock': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
            case 'loyalty': return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30';
            default: return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
        }
    };

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
                <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <h3 className="font-semibold text-slate-900 dark:text-white">
                                    Notifications
                                </h3>
                                {notifications.length > 0 && (
                                    <button
                                        onClick={clearAll}
                                        className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>

                            {/* Notifications List */}
                            <div className="max-h-[400px] overflow-y-auto">
                                {isLoading ? (
                                    <div className="px-4 py-8 text-center text-sm text-slate-500">
                                        Loading notifications...
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="px-4 py-12 text-center">
                                        <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">All caught up!</p>
                                        <p className="text-xs text-slate-500 mt-1">No new notifications</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {notifications.map((notification) => {
                                            const Icon = getIcon(notification.type);
                                            const colorClass = getColorClass(notification.type);

                                            return (
                                                <div
                                                    key={notification.id}
                                                    className={cn(
                                                        "px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative group",
                                                        !notification.read && "bg-blue-50/50 dark:bg-blue-950/10"
                                                    )}
                                                >
                                                    {notification.href ? (
                                                        <Link
                                                            href={notification.href}
                                                            onClick={() => {
                                                                markAsRead(notification.id);
                                                                setIsOpen(false);
                                                            }}
                                                            className="flex gap-3"
                                                        >
                                                            <div className={cn("p-2 rounded-lg shrink-0 h-fit", colorClass)}>
                                                                <Icon className="w-4 h-4" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                                    {notification.title}
                                                                </p>
                                                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                                                                    {notification.message}
                                                                </p>
                                                                <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">
                                                                    {formatTimestamp(notification.timestamp)}
                                                                </p>
                                                            </div>
                                                        </Link>
                                                    ) : (
                                                        <div className="flex gap-3">
                                                            <div className={cn("p-2 rounded-lg shrink-0 h-fit", colorClass)}>
                                                                <Icon className="w-4 h-4" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                                    {notification.title}
                                                                </p>
                                                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                                                    {notification.message}
                                                                </p>
                                                                <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">
                                                                    {formatTimestamp(notification.timestamp)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Mark as read button */}
                                                    {!notification.read && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                markAsRead(notification.id);
                                                            }}
                                                            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                                            title="Mark as read"
                                                        >
                                                            <Check className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function formatTimestamp(date: Date): string {
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
}
