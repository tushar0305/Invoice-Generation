'use client';

import { useState, useEffect } from 'react';
import { Bell, CheckCheck, Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationItem, type NotificationItemProps } from '@/components/notifications/notification-item';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import { supabase } from '@/supabase/client';

interface NotificationCenterProps {
    shopId?: string;
    userId?: string;
}

export function NotificationCenter({ shopId, userId }: NotificationCenterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItemProps[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        if (isOpen && shopId) {
            fetchNotifications();
        }
    }, [isOpen, shopId]);

    const fetchNotifications = async () => {
        setIsLoading(true);
        const allNotifications: NotificationItemProps[] = [];

        try {
            // 1. Fetch Due Invoices (High Priority)
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
                        type: 'warning',
                        title: 'Payment Due',
                        message: `${inv.customer_name} • ${inv.invoice_number} • ${formatCurrency(inv.grand_total)}${daysOverdue > 0 ? ` (${daysOverdue}d overdue)` : ''}`,
                        createdAt: inv.invoice_date,
                        isRead: false,
                        onClick: () => { window.location.href = `/shop/${shopId}/invoices/view?id=${inv.id}`; }
                    });
                });
            }

            // 2. Fetch Damaged Items
            const { data: damagedItems } = await supabase
                .from('inventory_items')
                .select('id, name, status, updated_at')
                .eq('shop_id', shopId)
                .eq('status', 'DAMAGED')
                .limit(5);

            if (damagedItems) {
                damagedItems.forEach(item => {
                    allNotifications.push({
                        id: `damaged-${item.id}`,
                        type: 'error',
                        title: 'Item Needs Attention',
                        message: `${item.name} is marked as DAMAGED.`,
                        createdAt: item.updated_at || new Date().toISOString(),
                        isRead: false,
                        onClick: () => { window.location.href = `/shop/${shopId}/inventory`; }
                    });
                });
            }

            // Sort by Date
            allNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setNotifications(allNotifications);

        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleMarkAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const handleNotificationClick = (id: string) => {
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, isRead: true } : n
        ));
    };

    const filteredNotifications = activeTab === 'unread'
        ? notifications.filter(n => !n.isRead)
        : notifications;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 rounded-full bg-white/80 dark:bg-white/10 border border-gray-200/50 dark:border-white/10 shadow-sm hover:bg-white dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 relative transition-all duration-200 hover:scale-105"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[380px] p-0 mr-4 md:mr-0 bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl rounded-2xl overflow-hidden"
                align="end"
                sideOffset={8}
            >
                <div className="flex flex-col h-[500px]">
                    {/* Header */}
                    <div className="p-4 border-b border-border/50 bg-muted/30">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-base">Notifications</h3>
                                {unreadCount > 0 && (
                                    <Badge variant="secondary" className="px-1.5 h-5 min-w-[20px] bg-primary/10 text-primary border-primary/20">
                                        {unreadCount}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                    onClick={handleMarkAllRead}
                                    title="Mark all as read"
                                >
                                    <CheckCheck className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 h-9 p-1 bg-muted/50 rounded-lg">
                                <TabsTrigger value="all" className="text-xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                    All
                                </TabsTrigger>
                                <TabsTrigger value="unread" className="text-xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                    Unread
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* List */}
                    <ScrollArea className="flex-1 p-2">
                        <div className="space-y-1">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-10 space-y-2">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">Loading alerts...</p>
                                </div>
                            ) : filteredNotifications.length > 0 ? (
                                filteredNotifications.map((notification) => (
                                    <NotificationItem
                                        key={notification.id}
                                        {...notification}
                                        onClick={() => {
                                            handleNotificationClick(notification.id);
                                            notification.onClick?.();
                                        }}
                                    />
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[300px] text-center p-4 space-y-3">
                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                        <Bell className="h-6 w-6 text-muted-foreground/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium text-foreground">All caught up!</p>
                                        <p className="text-sm text-muted-foreground">
                                            {activeTab === 'unread'
                                                ? "You have no unread notifications."
                                                : "You have no notifications yet."}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </PopoverContent>
        </Popover>
    );
}
