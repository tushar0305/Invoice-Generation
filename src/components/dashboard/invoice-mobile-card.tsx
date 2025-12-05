'use client';

import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Invoice } from '@/lib/definitions';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Trash2, Share2, CheckCircle, RefreshCw, Check } from 'lucide-react';
import { haptics } from '@/lib/haptics';
import { ImpactStyle, NotificationType } from '@/lib/haptics';
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface InvoiceMobileCardProps {
    invoice: Invoice;
    onView: (id: string) => void;
    onDelete: (id: string) => void;
    onDownload: (id: string) => void;
    onShare: (id: string) => void;
    onMarkPaid: (id: string) => void;
}

export function InvoiceMobileCard({ invoice, onView, onDelete, onDownload, onShare, onMarkPaid }: InvoiceMobileCardProps) {
    const [isDragging, setIsDragging] = useState(false);
    const x = useMotionValue(0);

    // Transform x value to opacity and scale for visual feedback
    const opacityRight = useTransform(x, [50, 100], [0, 1]);
    const scaleRight = useTransform(x, [50, 100], [0.8, 1.2]);

    const opacityLeft = useTransform(x, [-50, -100], [0, 1]);
    const scaleLeft = useTransform(x, [-50, -100], [0.8, 1.2]);

    // Background color based on swipe direction and invoice status
    const bgRight = useTransform(x, [0, 150], ['rgba(239, 68, 68, 0)', 'rgba(239, 68, 68, 0.2)']);
    const bgLeft = useTransform(
        x,
        [0, -150],
        invoice.status === 'paid'
            ? ['rgba(234, 179, 8, 0)', 'rgba(234, 179, 8, 0.2)'] // Yellow for paid->due
            : ['rgba(34, 197, 94, 0)', 'rgba(34, 197, 94, 0.2)']  // Green for due->paid
    );

    // Long press logic
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const handleTouchStart = () => {
        timerRef.current = setTimeout(() => {
            haptics.impact(ImpactStyle.Medium);
            onShare(invoice.id);
        }, 800); // 800ms long press
    };

    const handleTouchEnd = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    const handleDragEnd = (event: any, info: PanInfo) => {
        setIsDragging(false);
        if (info.offset.x > 100) {
            // Swipe Right -> Delete
            haptics.notification(NotificationType.Warning);
            onDelete(invoice.id);
        } else if (info.offset.x < -100) {
            // Swipe Left -> Toggle Status
            haptics.notification(NotificationType.Success);
            onMarkPaid(invoice.id);
        }
    };

    return (
        <div className="relative mb-3 overflow-hidden rounded-lg select-none touch-pan-y">
            {/* Background Color Overlay */}
            <motion.div
                className="absolute inset-0 rounded-xl"
                style={{
                    backgroundColor: x.get() > 0 ? bgRight : bgLeft
                }}
            />

            {/* Background Actions */}
            <div className="absolute inset-0 flex items-center justify-between px-6 z-[1]">
                {/* Left Side (Delete) - Visible when swiping right */}
                <motion.div
                    style={{ opacity: opacityRight, scale: scaleRight }}
                    className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500 text-white"
                >
                    <Trash2 className="h-6 w-6" />
                </motion.div>

                {/* Right Side (Toggle Status) - Visible when swiping left */}
                <motion.div
                    style={{ opacity: opacityLeft, scale: scaleLeft }}
                    className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-full",
                        invoice.status === 'paid'
                            ? "bg-yellow-500 text-white"
                            : "bg-green-500 text-white"
                    )}
                >
                    {invoice.status === 'paid' ? (
                        <RefreshCw className="h-6 w-6" />
                    ) : (
                        <Check className="h-6 w-6" />
                    )}
                </motion.div>
            </div>

            {/* Foreground Card */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleDragEnd}
                style={{ x, touchAction: 'none', background: 'hsl(var(--card))' }}
                className="relative z-10 overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-card shadow-sm transition-shadow active:shadow-md"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchEnd} // Cancel long press on move
                onMouseDown={handleTouchStart}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                whileTap={{ scale: 0.98 }}
            >
                <div className="p-4" onClick={() => !isDragging && onView(invoice.id)}>
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <div className="text-xs text-primary font-medium mb-0.5">#{invoice.invoiceNumber}</div>
                            <h3 className="font-serif text-lg font-bold text-foreground">{invoice.customerSnapshot?.name || 'Unknown'}</h3>
                            <div className="text-xs text-muted-foreground">{format(new Date(invoice.invoiceDate), 'dd MMM yyyy')}</div>
                        </div>
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'destructive'} className="shadow-none capitalize">
                            {invoice.status}
                        </Badge>
                    </div>

                    <div className="flex justify-between items-end border-t border-gray-100 dark:border-white/5 pt-3">
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-primary hover:text-primary-foreground hover:border-primary" onClick={() => onDownload(invoice.id)}>
                                <Download className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-primary hover:text-primary-foreground" onClick={() => onShare(invoice.id)}>
                                <Share2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-muted-foreground mb-0.5">Total Amount</div>
                            <div className="font-serif text-xl font-bold text-primary">₹{invoice.grandTotal.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
