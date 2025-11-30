/**
 * Stock Client Component
 * Handles interactive UI for stock management
 */

'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/supabase/provider';
import { supabase } from '@/supabase/client';
import type { StockItem } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Edit2, Trash2, Package, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '@/lib/haptics';
import { ImpactStyle } from '@/lib/haptics';
import { useActiveShop } from '@/hooks/use-active-shop';
import { EmptyState } from '@/components/ui/empty-state';

type StockClientProps = {
    initialItems: StockItem[];
    counts: { all: number; low: number; out: number };
    shopId: string;
    initialFilter: string;
    initialSearch: string;
};

export function StockClient({
    initialItems,
    counts,
    shopId,
    initialFilter,
    initialSearch
}: StockClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { user } = useUser();
    const { permissions } = useActiveShop();
    const [isPending, startTransition] = useTransition();

    const [filter, setFilter] = useState(initialFilter);
    const [searchTerm, setSearchTerm] = useState(initialSearch);

    // Sync state with URL params
    useEffect(() => {
        if (searchParams.get('action') === 'add') {
            router.push(`/shop/${shopId}/stock/new`);
        }
    }, [searchParams, router, shopId]);

    // Handle filter changes
    const handleFilterChange = (newFilter: string) => {
        setFilter(newFilter);
        updateUrl(newFilter, searchTerm);
    };

    // Handle search changes
    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        // Debounce URL update could be added here, but for now direct update
        // Or just let the local state drive the input and update URL on blur/delay?
        // For simplicity and responsiveness, let's update URL which triggers server refresh
        // But that might be slow for typing.
        // Better: Keep local filtering for instant feedback if we had all data,
        // but we only have filtered data from server.
        // So we MUST update URL to get new data.
        // Let's use a timeout for search.
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== initialSearch) {
                updateUrl(filter, searchTerm);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, filter]);

    const updateUrl = (f: string, q: string) => {
        const params = new URLSearchParams();
        if (f && f !== 'all') params.set('filter', f);
        if (q) params.set('q', q);
        router.push(`/shop/${shopId}/stock?${params.toString()}`);
    };

    const handleEdit = (item: StockItem) => {
        router.push(`/shop/${shopId}/stock/new?edit=${item.id}`);
    };

    const handleDelete = (itemId: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        startTransition(async () => {
            try {
                const { error } = await supabase
                    .from('stock_items')
                    .delete()
                    .eq('id', itemId)
                    .eq('user_id', user?.uid || '');

                if (error) throw error;

                toast({ title: 'Success', description: 'Stock item deleted' });
                router.refresh(); // Refresh server data
            } catch (err) {
                console.error('Error deleting item:', err);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to delete stock item',
                });
            }
        });
    };

    return (
        <MotionWrapper className="space-y-4 sm:space-y-6 pb-24">
            <div className="space-y-4">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search items..."
                        className="pl-9 h-10 bg-background"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {initialItems.length === 0 && !searchTerm && filter === 'all' ? (
                    <EmptyState
                        icon={Package}
                        title="No stock items yet"
                        description="Add your first item to get started with inventory management."
                        action={{
                            label: 'Add Item',
                            onClick: () => router.push(`/shop/${shopId}/stock/new`)
                        }}
                    />
                ) : (
                    <>
                        {/* Filter Pills */}
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            <button
                                onClick={() => handleFilterChange('all')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                            >
                                All Items <span className="opacity-70">({counts.all})</span>
                            </button>
                            <button
                                onClick={() => handleFilterChange('low')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${filter === 'low' ? 'bg-amber-500 text-white' : 'bg-muted hover:bg-muted/80'}`}
                            >
                                Low Stock <span className="opacity-70">({counts.low})</span>
                            </button>
                            <button
                                onClick={() => handleFilterChange('out')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${filter === 'out' ? 'bg-destructive text-white' : 'bg-muted hover:bg-muted/80'}`}
                            >
                                Out of Stock <span className="opacity-70">({counts.out})</span>
                            </button>
                        </div>

                        {initialItems.length === 0 ? (
                            <div className="py-12">
                                <EmptyState
                                    icon={Package}
                                    title="No items found"
                                    description="Try adjusting your filters or search terms."
                                    action={{
                                        label: 'Clear filters',
                                        onClick: () => { handleFilterChange('all'); setSearchTerm(''); }
                                    }}
                                />
                            </div>
                        ) : (
                            <>
                                <div className="rounded-md border border-white/10 overflow-hidden hidden md:block bg-card">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-muted/50">
                                                <TableRow className="hover:bg-transparent border-b-white/10">
                                                    <TableHead className="font-semibold min-w-[140px] pl-6 sm:pl-4 text-primary">Name</TableHead>
                                                    <TableHead className="font-semibold min-w-[70px] hidden sm:table-cell text-primary">Purity</TableHead>
                                                    <TableHead className="font-semibold min-w-[80px] text-primary">Qty</TableHead>
                                                    <TableHead className="font-semibold hidden sm:table-cell min-w-[60px] text-primary">Unit</TableHead>
                                                    <TableHead className="font-semibold text-right min-w-[90px] text-primary">Price</TableHead>
                                                    <TableHead className="font-semibold text-right hidden md:table-cell min-w-[90px] text-primary">Making</TableHead>
                                                    <TableHead className="font-semibold hidden lg:table-cell min-w-[100px] text-primary">Category</TableHead>
                                                    {permissions?.canManageStock && (
                                                        <TableHead className="text-right font-semibold min-w-[90px] pr-6 sm:pr-4 text-primary">Actions</TableHead>
                                                    )}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {initialItems.map((item) => (
                                                    <TableRow key={item.id} className={!item.isActive ? 'opacity-50 border-b-white/5' : 'hover:bg-muted/50 border-b-white/5 transition-colors'}>
                                                        <TableCell className="font-medium pl-6 sm:pl-4">
                                                            <div className="flex flex-col">
                                                                <span className="truncate max-w-[120px] sm:max-w-none">{item.name}</span>
                                                                <span className="text-xs text-muted-foreground sm:hidden">{item.purity}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="hidden sm:table-cell">{item.purity}</TableCell>
                                                        <TableCell className="whitespace-nowrap">
                                                            <div className="flex flex-col sm:flex-row sm:items-center">
                                                                <span className={`font-medium ${item.quantity === 0 ? 'text-destructive' : item.quantity < 3 ? 'text-amber-500' : ''}`}>
                                                                    {item.quantity}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground sm:hidden">{item.unit}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="hidden sm:table-cell text-muted-foreground">{item.unit}</TableCell>
                                                        <TableCell className="text-right font-medium text-sm sm:text-base">₹{item.basePrice.toFixed(0)}</TableCell>
                                                        <TableCell className="text-right hidden md:table-cell text-sm sm:text-base">₹{item.makingChargePerGram.toFixed(0)}</TableCell>
                                                        <TableCell className="hidden lg:table-cell">
                                                            <span className="text-xs bg-muted px-2 py-1 rounded">{item.category || '-'}</span>
                                                        </TableCell>
                                                        {permissions?.canManageStock && (
                                                            <TableCell className="text-right pr-6 sm:pr-4">
                                                                <div className="flex justify-end gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleEdit(item)}
                                                                        disabled={isPending}
                                                                        className="h-8 w-8 p-0 hover:text-primary"
                                                                    >
                                                                        <Edit2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleDelete(item.id)}
                                                                        disabled={isPending}
                                                                        className="text-destructive h-8 w-8 p-0 hover:bg-destructive/10"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden space-y-4">
                                    <AnimatePresence initial={false}>
                                        {initialItems.map((item) => (
                                            <StockCard
                                                key={item.id}
                                                item={item}
                                                onEdit={() => handleEdit(item)}
                                                onDelete={() => handleDelete(item.id)}
                                                canManage={permissions?.canManageStock || false}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </MotionWrapper>
    );
}

function StockCard({ item, onEdit, onDelete, canManage }: { item: StockItem; onEdit: () => void; onDelete: () => void; canManage: boolean }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="relative">
            {/* Background Actions (Delete) */}
            {canManage && (
                <div className="absolute inset-0 flex items-center justify-end px-4 bg-destructive/20 rounded-xl">
                    <Trash2 className="text-destructive h-6 w-6" />
                </div>
            )}

            {/* Foreground Card */}
            <motion.div
                drag={canManage ? "x" : false}
                dragConstraints={{ left: -100, right: 0 }}
                dragElastic={0.1}
                onDragEnd={(_, info: any) => {
                    if (info.offset.x < -80) {
                        haptics.impact(ImpactStyle.Heavy);
                        onDelete();
                    }
                }}
                className={`relative overflow-hidden rounded-xl border border-white/10 bg-card shadow-sm transition-all ${!item.isActive ? 'opacity-50' : ''}`}
                style={{ x: 0, background: 'hsl(var(--card))' }}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="p-4">
                    <div className="absolute right-0 top-0 h-16 w-16 -translate-y-8 translate-x-8 rounded-full bg-[#D4AF37]/10 blur-xl"></div>

                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <div className="text-xs text-[#D4AF37] font-medium">{item.purity}</div>
                                {item.quantity === 0 && <div className="text-[10px] bg-destructive/20 text-destructive px-1.5 rounded">Out</div>}
                                {item.quantity > 0 && item.quantity < 3 && <div className="text-[10px] bg-amber-500/20 text-amber-500 px-1.5 rounded">Low</div>}
                            </div>
                            <h3 className="font-serif text-lg font-bold text-foreground">{item.name}</h3>
                            <div className="text-xs text-muted-foreground">{item.category || 'Uncategorized'}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-muted-foreground mb-0.5">Base Price</div>
                            <div className="font-serif text-xl font-bold text-[#D4AF37]">₹{item.basePrice.toFixed(0)}</div>
                        </div>
                    </div>

                    <div className="flex justify-between items-end border-t border-white/5 pt-3">
                        <div>
                            <div className="text-xs text-muted-foreground mb-0.5">Stock</div>
                            <div className="font-medium">{item.quantity} <span className="text-xs text-muted-foreground">{item.unit}</span></div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}>
                                {isExpanded ? 'Less' : 'More'}
                                {isExpanded ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
                            </Button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="pt-3 mt-3 border-t border-white/5 grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Making Charge</span>
                                        <span className="font-medium">₹{item.makingChargePerGram}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Base Weight</span>
                                        <span className="font-medium">{item.baseWeight || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Added On</span>
                                        <span className="font-medium">{new Date(item.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="col-span-2 flex justify-end gap-2 mt-2">
                                        {canManage && (
                                            <>
                                                <Button variant="outline" size="sm" className="h-8" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                                                    <Edit2 className="mr-2 h-3.5 w-3.5" /> Edit
                                                </Button>
                                                <Button variant="destructive" size="sm" className="h-8" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                                                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
