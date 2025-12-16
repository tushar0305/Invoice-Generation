'use client';

import { formatDistanceToNow } from 'date-fns';
import { Bell, Info, AlertTriangle, CheckCircle, Package, CreditCard, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'order' | 'payment';

export interface NotificationItemProps {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    createdAt: string; // ISO string
    isRead: boolean;
    onClick?: () => void;
}

export function NotificationItem({
    title,
    message,
    type,
    createdAt,
    isRead,
    onClick
}: NotificationItemProps) {

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
            case 'error': return <AlertTriangle className="w-4 h-4 text-rose-500" />;
            case 'order': return <Package className="w-4 h-4 text-blue-500" />;
            case 'payment': return <CreditCard className="w-4 h-4 text-purple-500" />;
            default: return <Info className="w-4 h-4 text-primary" />;
        }
    };

    const getBgColor = () => {
        if (isRead) return 'bg-transparent hover:bg-muted/50';
        switch (type) {
            case 'success': return 'bg-emerald-500/5 hover:bg-emerald-500/10';
            case 'warning': return 'bg-amber-500/5 hover:bg-amber-500/10';
            case 'error': return 'bg-rose-500/5 hover:bg-rose-500/10';
            case 'order': return 'bg-blue-500/5 hover:bg-blue-500/10';
            case 'payment': return 'bg-purple-500/5 hover:bg-purple-500/10';
            default: return 'bg-primary/5 hover:bg-primary/10';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "relative group flex gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer border border-transparent hover:border-border/50",
                getBgColor(),
                !isRead && "font-medium"
            )}
            onClick={onClick}
        >
            {/* Status Dot */}
            {!isRead && (
                <div className="absolute right-3 top-3 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
            )}

            {/* Icon Wrapper */}
            <div className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center shrink-0 border border-white/10 shadow-sm",
                "bg-white dark:bg-white/5"
            )}>
                {getIcon()}
            </div>

            {/* Content */}
            <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start pr-4">
                    <p className={cn("text-sm leading-none", isRead ? "text-foreground" : "text-foreground font-semibold")}>
                        {title}
                    </p>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {message}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 pt-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                </div>
            </div>
        </motion.div>
    );
}
