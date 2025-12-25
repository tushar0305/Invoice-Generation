'use client';

import Link from 'next/link';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Check, QrCode, Scale, Eye } from 'lucide-react';
import { useState } from 'react';
import { cn, formatCurrency } from '@/lib/utils';
import type { InventoryItem } from '@/lib/inventory-types';
import { STATUS_LABELS } from '@/lib/inventory-types';

interface InventoryMobileCardProps {
    item: InventoryItem;
    shopId: string;
    onDelete?: (id: string) => void;
    onMarkSold?: (id: string) => void;
}

export function InventoryMobileCard({ item, shopId, onDelete, onMarkSold }: InventoryMobileCardProps) {
    const [isDragging, setIsDragging] = useState(false);
    const x = useMotionValue(0);

    // Transform x value to opacity and scale for visual feedback
    const opacityRight = useTransform(x, [50, 100], [0, 1]);
    const scaleRight = useTransform(x, [50, 100], [0.8, 1.2]);

    const opacityLeft = useTransform(x, [-50, -100], [0, 1]);
    const scaleLeft = useTransform(x, [-50, -100], [0.8, 1.2]);

    // Background color based on swipe direction
    const bgRight = useTransform(x, [0, 150], ['rgba(239, 68, 68, 0)', 'rgba(239, 68, 68, 0.2)']);
    const bgLeft = useTransform(x, [0, -150], ['rgba(34, 197, 94, 0)', 'rgba(34, 197, 94, 0.2)']);

    const handleDragEnd = (event: any, info: PanInfo) => {
        setIsDragging(false);
        if (info.offset.x > 100 && onDelete) {
            // Swipe Right -> Delete
            onDelete(item.id);
        } else if (info.offset.x < -100 && onMarkSold && item.status === 'IN_STOCK') {
            // Swipe Left -> Mark as Sold
            onMarkSold(item.id);
        }
    };

    const statusConfig: Record<string, { bg: string; text: string; border: string }> = {
        'IN_STOCK': { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' },
        'RESERVED': { bg: 'bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-500/20' },
        'SOLD': { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20' },
        'DAMAGED': { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/20' },
        'RETURNED': { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/20' },
        'EXCHANGED': { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/20' },
    };

    const config = statusConfig[item.status] || statusConfig['IN_STOCK'];

    return (
        <div className="relative mb-3 overflow-hidden rounded-2xl select-none touch-pan-y">
            {/* Background Color Overlay */}
            <motion.div
                className="absolute inset-0 rounded-2xl"
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

                {/* Right Side (Mark Sold) - Visible when swiping left */}
                {item.status === 'IN_STOCK' && (
                    <motion.div
                        style={{ opacity: opacityLeft, scale: scaleLeft }}
                        className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500 text-white"
                    >
                        <Check className="h-6 w-6" />
                    </motion.div>
                )}
            </div>

            {/* Foreground Card */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleDragEnd}
                style={{ x, touchAction: 'none', background: 'hsl(var(--card))', WebkitTapHighlightColor: 'transparent' }}
                className="relative z-10 overflow-hidden rounded-2xl border-none shadow-lg shadow-gray-200/50 dark:shadow-black/20 bg-card transition-shadow active:shadow-xl touch-manipulation"
                whileTap={{ scale: 0.98 }}
            >
                <Link
                    href={`/shop/${shopId}/inventory/${item.tag_id}`}
                    onClick={(e) => isDragging && e.preventDefault()}
                >
                    <div className="p-4">
                        {/* Header: Tag & Status */}
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <div className="flex items-center gap-1.5 text-xs font-mono text-primary mb-0.5">
                                    <QrCode className="w-3 h-3" />
                                    {item.tag_id}
                                </div>
                                <h3 className="font-serif text-lg font-bold text-foreground line-clamp-1">
                                    {item.name}
                                </h3>
                                <div className="text-xs text-muted-foreground">
                                    {item.category || item.metal_type} • <span className="text-amber-600 dark:text-amber-400 font-medium">{item.purity}</span>
                                </div>
                            </div>
                            <Badge
                                variant="secondary"
                                className={cn("text-xs shadow-none", config.bg, config.text, "border", config.border)}
                            >
                                {STATUS_LABELS[item.status]?.label || item.status}
                            </Badge>
                        </div>

                        {/* Footer: Weight & Price */}
                        <div className="flex justify-between items-end border-t border-border pt-3">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Scale className="w-3.5 h-3.5" />
                                    <span className="font-medium text-foreground">{item.net_weight}g</span>
                                </div>
                                {item.gross_weight !== item.net_weight && (
                                    <div className="text-xs text-muted-foreground">
                                        (Gross: {item.gross_weight}g)
                                    </div>
                                )}
                            </div>
                            <div className="text-right">
                                {item.making_charge_value > 0 ? (
                                    <>
                                        <div className="text-xs text-muted-foreground mb-0.5">Making</div>
                                        <div className="font-serif text-xl font-bold text-primary">
                                            ₹{item.making_charge_value}/g
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-xs text-muted-foreground">No charge set</div>
                                )}
                            </div>
                        </div>
                    </div>
                </Link>
            </motion.div>
        </div>
    );
}
