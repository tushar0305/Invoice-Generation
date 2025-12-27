'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, QrCode, Package, X, ChevronLeft, ChevronRight, RefreshCw, Download, Layers, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from '@/lib/utils';
import type { InventoryItem } from '@/lib/inventory-types';
import { STATUS_LABELS } from '@/lib/inventory-types';
import { InventoryMobileCard } from '@/components/inventory/inventory-mobile-card';
import { supabase } from '@/supabase/client';
import { ExportDialog } from '@/components/shared/export-dialog';
import { DateRange } from 'react-day-picker';
import { startOfDay, endOfDay } from 'date-fns';

interface InventoryClientProps {
    initialItems: InventoryItem[];
    shopId: string;
    initialFilter: string;
    initialSearch: string;
    pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        limit: number;
    };
    counts: {
        all: number;
        inStock: number;
        reserved: number;
        sold: number;
        aging: number;
    };
}

export function InventoryClient({
    initialItems,
    shopId,
    initialFilter,
    initialSearch,
    pagination,
    counts,
}: InventoryClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [activeFilter, setActiveFilter] = useState(initialFilter);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');

    const updateUrl = (params: Record<string, string | null>) => {
        const newParams = new URLSearchParams(searchParams.toString());
        Object.entries(params).forEach(([key, value]) => {
            if (value === null || value === '' || value === 'all') {
                newParams.delete(key);
            } else {
                newParams.set(key, value);
            }
        });
        newParams.delete('page'); // Reset to page 1 on filter change
        router.push(`/shop/${shopId}/inventory?${newParams.toString()}`);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        updateUrl({ q: searchQuery });
    };

    const handleFilterChange = (filter: string) => {
        setActiveFilter(filter);
        updateUrl({ status: filter === 'all' ? null : filter });
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.refresh();
        setTimeout(() => setIsRefreshing(false), 1000); // Visual feedback
    };

    const goToPage = (page: number) => {
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.set('page', String(page));
        router.push(`/shop/${shopId}/inventory?${newParams.toString()}`);
    };

    const fetchExportData = async ({ dateRange, status }: { dateRange?: DateRange; status?: string }) => {
        let query = supabase
            .from('inventory_items')
            .select('*')
            .eq('shop_id', shopId)
            .order('created_at', { ascending: false });

        // Apply filters passed from the dialog
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        // Respect search query if present
        if (searchQuery) {
            query = query.or(`name.ilike.%${searchQuery}%,tag_id.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
        }

        if (dateRange?.from) {
            query = query.gte('created_at', startOfDay(dateRange.from).toISOString());
            if (dateRange.to) {
                query = query.lte('created_at', endOfDay(dateRange.to).toISOString());
            } else {
                query = query.lte('created_at', endOfDay(dateRange.from).toISOString());
            }
        }

        const { data, error } = await query;
        if (error) {
            console.error(error);
            return [];
        }

        // Format for Excel
        return (data || []).map((item: any) => ({
            'Tag ID': item.tag_id,
            'Name': item.name,
            'Category': item.category || item.metal_type,
            'Purity': item.purity,
            'Weight (g)': item.net_weight,
            'Status': item.status,
            'Making Charge': item.making_charge_value,
            'Created At': new Date(item.created_at).toLocaleDateString(),
        }));
    };

    const statusOptions = [
        { label: 'In Stock', value: 'IN_STOCK' },
        { label: 'Reserved', value: 'RESERVED' },
        { label: 'Sold', value: 'SOLD' },
    ];

    const filters = [
        { key: 'all', label: 'All', count: counts.all },
        { key: 'IN_STOCK', label: 'In Stock', count: counts.inStock },
        { key: 'aging', label: 'Dead Stock', count: counts.aging, variant: 'destructive' as const },
        { key: 'RESERVED', label: 'Reserved', count: counts.reserved },
        { key: 'SOLD', label: 'Sold', count: counts.sold },
    ];

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col px-4 md:px-0 overflow-hidden">
            {/* Sticky Header Section */}
            <div className="shrink-0 bg-background pb-4 space-y-3 pt-2">
                {/* Top Bar: Search + Refresh */}
                <div className="flex items-center gap-2 pt-2">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                        <Input
                            placeholder="Search by name or tag..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (e.target.value === '') {
                                    updateUrl({ q: null });
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    updateUrl({ q: searchQuery });
                                }
                            }}
                            className="pl-9 h-11 bg-white dark:bg-white/5 border-2 border-gray-300 dark:border-white/20 focus:border-primary rounded-xl backdrop-blur-sm transition-all shadow-sm w-full"
                        />
                        {searchQuery && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 z-10 rounded-full hover:bg-muted"
                                onClick={() => {
                                    setSearchQuery('');
                                    updateUrl({ q: null });
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRefresh}
                        className="shrink-0 h-11 w-11 transition-all duration-300 hover:shadow-glow-sm interactive-scale bg-white dark:bg-white/5 border-2 border-gray-300 dark:border-white/20 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-primary rounded-xl"
                        title="Refresh inventory"
                    >
                        <RefreshCw className={cn("h-4 w-4 transition-transform duration-500", isRefreshing && "animate-spin")} />
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setViewMode(prev => prev === 'list' ? 'grouped' : 'list')}
                        className={cn("h-11 w-11 rounded-xl border-2", viewMode === 'grouped' ? "border-primary bg-primary/10 text-primary" : "border-gray-300 dark:border-white/20")}
                        title="Group by Weight"
                    >
                        <Layers className="h-4 w-4" />
                    </Button>

                    <Link href={`/shop/${shopId}/inventory/new`} className="flex-1 sm:flex-initial">
                        <Button className="w-full sm:w-auto h-11 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 rounded-xl font-medium transition-all hover:scale-[1.02]">
                            <Plus className="h-4 w-4" />
                            <span>Add Item</span>
                        </Button>
                    </Link>



                    <ExportDialog
                        onExport={fetchExportData}
                        filename={`inventory-${new Date().toISOString().split('T')[0]}`}
                        statusOptions={statusOptions}
                        trigger={
                            <Button variant="outline" className="flex-1 sm:flex-initial h-11 gap-2 bg-white dark:bg-white/5 border-2 border-gray-300 dark:border-white/20 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-primary rounded-xl transition-all">
                                <Download className="h-4 w-4" />
                                <span>Export</span>
                            </Button>
                        }
                    />
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-hide mb-4 shrink-0">
                {filters.map((filter) => (
                    <Button
                        key={filter.key}
                        variant={activeFilter === filter.key ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilterChange(filter.key)}
                        className={cn(
                            "shrink-0 gap-2 h-9 px-4 rounded-lg transition-all border shadow-sm",
                            activeFilter === filter.key
                                ? "bg-primary text-primary-foreground shadow-md"
                                : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:bg-gray-50 hover:text-foreground",
                            filter.variant === 'destructive' && activeFilter === filter.key && "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        )}
                    >
                        {filter.label}
                        <Badge variant="secondary" className={cn(
                            "h-5 px-1.5 text-[10px] font-bold rounded-md",
                            activeFilter === filter.key ? "bg-white/20 text-white" : "bg-muted text-muted-foreground",
                            filter.variant === 'destructive' && activeFilter === filter.key && "bg-white/20 text-white",
                            filter.variant === 'destructive' && activeFilter !== filter.key && "bg-destructive/10 text-destructive"
                        )}>
                            {filter.count}
                        </Badge>
                    </Button>
                ))}
            </div>

            {/* Items Grid */}
            <div className="flex-1 flex flex-col min-h-0">
                {initialItems.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center p-12 text-center border-none shadow-xl shadow-gray-200/50 dark:shadow-black/20 rounded-3xl bg-card m-auto">
                        <div className="p-4 bg-primary/5 rounded-full mb-4">
                            <Package className="w-12 h-12 text-primary/50" />
                        </div>
                        <h3 className="font-bold text-xl mb-2">No items found</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm">
                            {initialSearch ? 'Try adjusting your search' : 'Add your first inventory item to get started'}
                        </p>
                        <Link href={`/shop/${shopId}/inventory/new`}>
                            <Button className="gap-2 rounded-full h-11 px-6 shadow-lg shadow-primary/20">
                                <Plus className="h-4 w-4" />
                                Add First Item
                            </Button>
                        </Link>
                    </Card>
                ) : viewMode === 'grouped' ? (
                    <div className="space-y-6 pb-20 overflow-auto scrollbar-hide">
                        {Object.entries({
                            '0-5g': initialItems.filter(i => i.net_weight > 0 && i.net_weight <= 5),
                            '5-10g': initialItems.filter(i => i.net_weight > 5 && i.net_weight <= 10),
                            '10-20g': initialItems.filter(i => i.net_weight > 10 && i.net_weight <= 20),
                            '20-50g': initialItems.filter(i => i.net_weight > 20 && i.net_weight <= 50),
                            '50g+': initialItems.filter(i => i.net_weight > 50),
                        }).filter(([_, items]) => items.length > 0).map(([range, items]) => (
                            <div key={range} className="space-y-3">
                                <div className="flex items-center gap-3 px-2">
                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs ring-2 ring-primary/20">
                                        {items.length}
                                    </div>
                                    <h3 className="font-bold text-lg">{range} Range</h3>
                                    <div className="h-px bg-border flex-1" />
                                </div>
                                <div className="rounded-2xl border-2 border-gray-200 dark:border-white/10 overflow-hidden bg-card shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow className="hover:bg-transparent border-b border-border/50">
                                                <TableHead className="h-10 pl-6 w-[120px]">Tag ID</TableHead>
                                                <TableHead className="h-10">Item</TableHead>
                                                <TableHead className="h-10">Category</TableHead>
                                                <TableHead className="h-10 text-right pr-6">Weight</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.map(item => (
                                                <TableRow
                                                    key={item.id}
                                                    onClick={() => router.push(`/shop/${shopId}/inventory/${item.tag_id}`)}
                                                    className="cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0"
                                                >
                                                    <TableCell className="font-mono text-xs pl-6 py-3">{item.tag_id}</TableCell>
                                                    <TableCell className="font-medium text-sm py-3">{item.name}</TableCell>
                                                    <TableCell className="text-xs text-muted-foreground py-3">{item.category || item.metal_type}</TableCell>
                                                    <TableCell className="text-right font-mono font-medium py-3 pr-6">{item.net_weight.toFixed(3)}g</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View - Standardized */}
                        <div className="hidden md:flex flex-col shrink min-h-0 rounded-2xl border-2 border-gray-300 dark:border-white/20 overflow-hidden bg-card shadow-lg relative animate-in fade-in transition-all duration-300">
                            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                                <Table className="table-modern min-w-[1000px] relative">
                                    <TableHeader className="bg-muted/50 border-b-2 border-gray-300 dark:border-white/20 sticky top-0 z-20 shadow-sm backdrop-blur-sm">
                                        <TableRow className="hover:bg-transparent border-b border-border/50">
                                            <TableHead className="text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider h-10 pl-6">Tag ID</TableHead>
                                            <TableHead className="text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider h-10">Product Name</TableHead>
                                            <TableHead className="text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider h-10">Category / Type</TableHead>
                                            <TableHead className="text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider h-10">Net Weight</TableHead>
                                            <TableHead className="text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider h-10">Status</TableHead>
                                            <TableHead className="text-right text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider h-10 pr-6">Price Info</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {initialItems.map((item) => (
                                            <TableRow
                                                key={item.id}
                                                className="cursor-pointer hover:bg-primary/5 transition-colors border-b border-border/50 last:border-0 group"
                                                onClick={() => router.push(`/shop/${shopId}/inventory/${item.tag_id}`)}
                                            >
                                                <TableCell className="font-medium font-mono text-xs pl-6 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 bg-primary/10 rounded-md group-hover:bg-primary/20 transition-colors">
                                                            <QrCode className="h-3.5 w-3.5 text-primary" />
                                                        </div>
                                                        {item.tag_id}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-semibold text-foreground py-2 text-sm">{item.name}</TableCell>
                                                <TableCell className="py-2">
                                                    <div className="flex flex-col text-xs">
                                                        <span>{item.category || item.metal_type}</span>
                                                        <span className="text-muted-foreground">{item.purity}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm">{item.net_weight.toFixed(3)} g</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="secondary"
                                                        className={cn(
                                                            "text-[10px] font-normal h-5 px-2",
                                                            item.status === 'IN_STOCK' && "bg-emerald-500/10 text-emerald-600",
                                                            item.status === 'RESERVED' && "bg-yellow-500/10 text-yellow-600",
                                                            item.status === 'SOLD' && "bg-blue-500/10 text-blue-600",
                                                        )}
                                                    >
                                                        {STATUS_LABELS[item.status]?.label || item.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right text-xs">
                                                    {item.making_charge_value > 0 ? (
                                                        <span>₹{item.making_charge_value}/{item.making_charge_type === 'PER_GRAM' ? 'g' : ' flat'}</span>
                                                    ) : '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            {/* Fixed Pagination Footer (Desktop) */}
                            {pagination && (
                                <div className="flex items-center justify-between border-t border-gray-200 dark:border-white/10 p-4 bg-muted/20 backdrop-blur-sm z-20">
                                    <div className="text-sm text-muted-foreground text-center sm:text-left">
                                        Showing <span className="font-medium text-foreground">{(pagination?.currentPage - 1) * pagination?.limit + 1}</span> - <span className="font-medium text-foreground">{Math.min(pagination?.currentPage * pagination?.limit, pagination?.totalCount)}</span> of <span className="font-medium text-foreground">{pagination?.totalCount}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => goToPage(pagination.currentPage - 1)}
                                            disabled={pagination.currentPage <= 1}
                                            className="rounded-full px-4 border-none shadow-sm bg-background hover:bg-muted"
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => goToPage(pagination.currentPage + 1)}
                                            disabled={pagination.currentPage >= pagination.totalPages}
                                            className="rounded-full px-4 border-none shadow-sm bg-background hover:bg-muted"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3">
                            {initialItems.map((item) => (
                                <InventoryMobileCard
                                    key={item.id}
                                    item={item}
                                    shopId={shopId}
                                />
                            ))}
                            {/* Mobile Pagination */}
                            {pagination && (
                                <div className="flex items-center justify-between pt-4 pb-24">
                                    <div className="text-sm text-muted-foreground">
                                        Showing {((pagination.currentPage - 1) * pagination.limit) + 1}-{Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => goToPage(pagination.currentPage - 1)}
                                            disabled={pagination.currentPage <= 1}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => goToPage(pagination.currentPage + 1)}
                                            disabled={pagination.currentPage >= pagination.totalPages}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
