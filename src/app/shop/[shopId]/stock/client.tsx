/**
 * Stock Client Component
 * Handles interactive UI for stock management
 */

'use client';

import { useState, useTransition, useEffect, useOptimistic } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
import { Edit2, Trash2, Package, PackagePlus, ChevronDown, ChevronUp, Search } from 'lucide-react';
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
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        limit: number;
    };
};

export function StockClient({
    initialItems,
    counts,
    shopId,
    initialFilter,
    initialSearch,
    pagination
}: StockClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { user } = useUser();
    const { permissions } = useActiveShop();

    const [isPending, startTransition] = useTransition();

    const [optimisticItems, addOptimisticItem] = useOptimistic(
        initialItems,
        (state, action: { type: 'DELETE'; payload: string }) => {
            if (action.type === 'DELETE') {
                return state.filter(item => item.id !== action.payload);
            }
            return state;
        }
    );

    const [filter, setFilter] = useState(initialFilter);
    const [searchTerm, setSearchTerm] = useState(initialSearch);

    // Sync state with URL params
    useEffect(() => {
        if (searchParams.get('action') === 'add') {
            router.push(`/shop/${shopId}/stock/new`);
        }
    }, [searchParams, router, shopId]);

    // Handle filter changes
    // Handle filter changes
    const handleFilterChange = (newFilter: string) => {
        setFilter(newFilter);
        updateUrl(newFilter, searchTerm);
    };

    const updateUrl = (f: string, q: string) => {
        const params = new URLSearchParams();
        if (f && f !== 'all') params.set('filter', f);
        if (q) params.set('q', q);
        // Reset page to 1 on filter/search change
        params.set('page', '1');
        router.push(`/shop/${shopId}/stock?${params.toString()}`);
    };

    // Handle search changes
    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            // Reset to page 1 when search or filter changes
            const params = new URLSearchParams(window.location.search);
            const currentQ = params.get('q') || '';
            const currentFilter = params.get('filter') || 'all';

            // Only push if changed
            if (searchTerm !== currentQ || filter !== currentFilter) {
                if (filter && filter !== 'all') params.set('filter', filter);
                else params.delete('filter');

                if (searchTerm) {
                    params.set('q', searchTerm);
                    params.set('page', '1'); // Reset page
                } else {
                    params.delete('q');
                    if (filter === currentFilter) {
                        // If only clearing search, keep page or reset?
                        // Safer to reset to prevent "empty page" if previous result count < current page offset
                        params.set('page', '1');
                    }
                }
                router.push(`/shop/${shopId}/stock?${params.toString()}`);
            }
        }, 300); // 300ms debounce
        return () => clearTimeout(timer);
    }, [searchTerm, filter, shopId, router]);



    const handleEdit = (item: StockItem) => {
        router.push(`/shop/${shopId}/stock/new?edit=${item.id}`);
    };

    const handleDelete = (itemId: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        startTransition(async () => {
            addOptimisticItem({ type: 'DELETE', payload: itemId });

            try {
                // ✅ NEW: Call API endpoint
                const response = await fetch(`/api/v1/stock/${itemId}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    const result = await response.json();
                    throw new Error(result.error || 'Failed to delete stock item');
                }

                toast({ title: 'Success', description: 'Stock item deleted' });
                router.refresh();
            } catch (err: any) {
                console.error('Error deleting item:', err);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: err.message || 'Failed to delete stock item',
                });
            }
        });
    };

    return (
        <MotionWrapper className="space-y-4 pb-24 pt-2 px-4 md:px-0">
            {/* Sticky Header Section for Mobile */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm -mx-4 px-4 md:mx-0 md:px-0 pb-3 md:static md:bg-transparent md:backdrop-blur-none">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search items..."
                            className="pl-9 h-10 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-foreground dark:text-white placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all duration-300"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Link href={`/shop/${shopId}/stock/new`}>
                        <Button
                            className="h-10 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 rounded-xl font-medium shrink-0"
                        >
                            <PackagePlus className="h-4 w-4" />
                            <span className="hidden sm:inline">Add Item</span>
                        </Button>
                    </Link>
                </div>
            </div>



            {
                optimisticItems.length === 0 && !searchTerm && filter === 'all' ? (
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
                        {/* Filter Pills - Enhanced */}
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            <button
                                onClick={() => handleFilterChange('all')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap border ${filter === 'all' ? 'bg-primary/20 text-primary border-primary/50 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]' : 'bg-white dark:bg-white/5 text-muted-foreground dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-primary/50'}`}
                            >
                                All Items <span className="opacity-70">({counts.all})</span>
                            </button>
                            <button
                                onClick={() => handleFilterChange('low')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap border ${filter === 'low' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-white dark:bg-white/5 text-muted-foreground dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-primary/50'}`}
                            >
                                Low Stock <span className="opacity-70">({counts.low})</span>
                            </button>
                            <button
                                onClick={() => handleFilterChange('out')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap border ${filter === 'out' ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-white dark:bg-white/5 text-muted-foreground dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-primary/50'}`}
                            >
                                Out of Stock <span className="opacity-70">({counts.out})</span>
                            </button>
                        </div>



                        {
                            optimisticItems.length === 0 ? (
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
                                    <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden hidden md:block bg-white/50 dark:bg-card/30 backdrop-blur-md shadow-lg">
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                                                    <TableRow className="hover:bg-transparent border-gray-200 dark:border-white/10">
                                                        <TableHead className="font-semibold min-w-[140px] pl-6 sm:pl-4 text-primary glow-text-sm">Name</TableHead>
                                                        <TableHead className="font-semibold min-w-[70px] hidden sm:table-cell text-primary glow-text-sm">Purity</TableHead>
                                                        <TableHead className="font-semibold min-w-[80px] text-primary glow-text-sm">Qty</TableHead>
                                                        <TableHead className="font-semibold hidden sm:table-cell min-w-[60px] text-primary glow-text-sm">Unit</TableHead>
                                                        <TableHead className="font-semibold text-right min-w-[90px] text-primary glow-text-sm">Price</TableHead>
                                                        <TableHead className="font-semibold text-right hidden md:table-cell min-w-[90px] text-primary glow-text-sm">Making</TableHead>
                                                        <TableHead className="font-semibold hidden lg:table-cell min-w-[100px] text-primary glow-text-sm">Category</TableHead>
                                                        {permissions?.canManageStock && (
                                                            <TableHead className="text-right font-semibold min-w-[90px] pr-6 sm:pr-4 text-primary glow-text-sm">Actions</TableHead>
                                                        )}
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {optimisticItems.map((item) => (
                                                        <TableRow key={item.id} className={`${!item.isActive ? 'opacity-50' : 'hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/5'}`}>
                                                            <TableCell className="font-medium pl-6 sm:pl-4 text-gray-900 dark:text-gray-200">
                                                                <div className="flex flex-col">
                                                                    <span className="truncate max-w-[120px] sm:max-w-[200px] md:max-w-xs">{item.name}</span>
                                                                    <span className="text-xs text-muted-foreground dark:text-gray-500 sm:hidden truncate">{item.purity}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="hidden sm:table-cell text-muted-foreground dark:text-gray-400">{item.purity}</TableCell>
                                                            <TableCell className="whitespace-nowrap">
                                                                <div className="flex flex-col sm:flex-row sm:items-center">
                                                                    <span className={`font-medium ${item.quantity === 0 ? 'text-red-600 dark:text-red-400' : item.quantity < 3 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                                                        {item.quantity}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground dark:text-gray-500 sm:hidden">{item.unit}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="hidden sm:table-cell text-muted-foreground dark:text-gray-500">{item.unit}</TableCell>
                                                            <TableCell className="text-right font-medium text-sm sm:text-base text-gray-900 dark:text-gray-300">₹{item.basePrice.toFixed(0)}</TableCell>
                                                            <TableCell className="text-right hidden md:table-cell text-sm sm:text-base text-muted-foreground dark:text-gray-400">₹{item.makingChargePerGram.toFixed(0)}</TableCell>
                                                            <TableCell className="hidden lg:table-cell">
                                                                <span className="text-xs bg-gray-100 dark:bg-white/5 text-muted-foreground dark:text-gray-400 px-2 py-1 rounded border border-gray-200 dark:border-white/5">{item.category || '-'}</span>
                                                            </TableCell>
                                                            {permissions?.canManageStock && (
                                                                <TableCell className="text-right pr-6 sm:pr-4">
                                                                    <div className="flex justify-end gap-1">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => handleEdit(item)}
                                                                            disabled={isPending}
                                                                            className="h-8 w-8 p-0 hover:text-primary hover:bg-primary/10 text-muted-foreground dark:text-gray-400"
                                                                        >
                                                                            <Edit2 className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => handleDelete(item.id)}
                                                                            disabled={isPending}
                                                                            className="text-red-600 dark:text-red-400 h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300"
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
                                    <div className="md:hidden space-y-3">
                                        <AnimatePresence initial={false}>
                                            {optimisticItems.map((item) => (
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
                            )
                        }
                    </>
                )
            }
            {/* Pagination Controls */}
            {
                pagination && (
                    <div className="flex items-center justify-between pt-4 pb-6 border-t border-border mt-4">
                        <div className="text-sm text-muted-foreground">
                            Showing <span className="font-medium text-foreground">{(pagination.currentPage - 1) * pagination.limit + 1}</span> to <span className="font-medium text-foreground">{Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)}</span> of <span className="font-medium text-foreground">{pagination.totalCount}</span> items
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.currentPage <= 1}
                                onClick={() => {
                                    const params = new URLSearchParams(window.location.search);
                                    params.set('page', String(pagination.currentPage - 1));
                                    router.push(`?${params.toString()}`);
                                }}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.currentPage >= pagination.totalPages}
                                onClick={() => {
                                    const params = new URLSearchParams(window.location.search);
                                    params.set('page', String(pagination.currentPage + 1));
                                    router.push(`?${params.toString()}`);
                                }}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )
            }
        </MotionWrapper >
    );
}

function StockCard({ item, onEdit, onDelete, canManage }: { item: StockItem; onEdit: () => void; onDelete: () => void; canManage: boolean }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="relative">
            {/* Background Actions (Delete) */}
            {canManage && (
                <div className="absolute inset-0 flex items-center justify-end px-4 bg-red-900/20 rounded-xl">
                    <Trash2 className="text-red-500 h-6 w-6" />
                </div>
            )}

            {/* Foreground Card - Enhanced */}
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
                className={`relative overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-card/30 backdrop-blur-md shadow-lg transition-all ${!item.isActive ? 'opacity-50' : ''}`}
                style={{ x: 0 }}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="p-4">
                    <div className="absolute right-0 top-0 h-16 w-16 -translate-y-8 translate-x-8 rounded-full bg-primary/10 blur-xl"></div>

                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <div className="text-xs text-primary font-semibold glow-text-sm">{item.purity}</div>
                                {item.quantity === 0 && <div className="text-[10px] bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-medium border border-red-500/20">Out</div>}
                                {item.quantity > 0 && item.quantity < 3 && <div className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium border border-amber-500/20">Low</div>}
                            </div>
                            <h3 className="text-lg font-bold text-foreground dark:text-white truncate pr-2">{item.name}</h3>
                            <div className="text-xs text-muted-foreground dark:text-gray-400 truncate">{item.category || 'Uncategorized'}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-muted-foreground dark:text-gray-500 mb-0.5 uppercase tracking-wide">Base Price</div>
                            <div className="text-xl font-bold text-primary glow-text-sm">₹{item.basePrice.toFixed(0)}</div>
                        </div>
                    </div>

                    <div className="flex justify-between items-end border-t border-gray-100 dark:border-white/10 pt-3">
                        <div>
                            <div className="text-[10px] text-muted-foreground dark:text-gray-500 mb-0.5 uppercase tracking-wide">Stock</div>
                            <div className="font-semibold text-foreground dark:text-white">{item.quantity} <span className="text-xs text-muted-foreground dark:text-gray-500">{item.unit}</span></div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5" onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}>
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
                                <div className="pt-3 mt-3 border-t border-gray-100 dark:border-white/5 grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-xs text-muted-foreground dark:text-gray-500 block">Making Charge</span>
                                        <span className="font-medium text-gray-700 dark:text-gray-300">₹{item.makingChargePerGram}</span>
                                    </div>

                                    <div>
                                        <span className="text-xs text-muted-foreground dark:text-gray-500 block">Added On</span>
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</span>
                                    </div>
                                    <div className="col-span-2 flex justify-end gap-2 mt-2">
                                        {canManage && (
                                            <>
                                                <Button variant="outline" size="sm" className="h-8 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-foreground dark:hover:text-white" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                                                    <Edit2 className="mr-2 h-3.5 w-3.5" /> Edit
                                                </Button>
                                                <Button variant="destructive" size="sm" className="h-8 bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30 border border-red-500/20" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
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
