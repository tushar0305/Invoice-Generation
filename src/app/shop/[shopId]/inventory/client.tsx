'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, QrCode, Package, X, ChevronLeft, ChevronRight, RefreshCw, Download } from 'lucide-react';
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
        { key: 'RESERVED', label: 'Reserved', count: counts.reserved },
        { key: 'SOLD', label: 'Sold', count: counts.sold },
    ];

    return (
        <div className="pb-20 md:pb-6 pt-2 px-4 md:px-0">
            {/* Sticky Header Section */}
            <div className="sticky top-0 z-20 bg-background pb-3 space-y-3 -mx-4 px-4 md:mx-0 md:px-0">
                {/* Search Bar */}
                <div className="flex items-center gap-2 pt-0">
                    <div className="relative flex-1">
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
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 z-10"
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
                        className="shrink-0 h-11 w-11 transition-all duration-300 hover:shadow-glow-sm interactive-scale bg-white dark:bg-white/5 border-2 border-gray-300 dark:border-white/20 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-primary"
                        title="Refresh inventory"
                    >
                        <RefreshCw className={cn("h-4 w-4 transition-transform duration-500", isRefreshing && "animate-spin")} />
                    </Button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <Link href={`/shop/${shopId}/inventory/new`} className="flex-1 sm:flex-initial">
                        <Button className="w-full sm:w-auto h-11 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 rounded-xl font-medium">
                            <Plus className="h-4 w-4" />
                            <span>Add Item</span>
                        </Button>
                    </Link>

                    <ExportDialog
                        onExport={fetchExportData}
                        filename={`inventory-${new Date().toISOString().split('T')[0]}`}
                        statusOptions={statusOptions}
                        trigger={
                            <Button variant="outline" className="flex-1 sm:flex-initial h-11 gap-2 bg-white dark:bg-white/5 border-2 border-gray-300 dark:border-white/20 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-primary rounded-xl">
                                <Download className="h-4 w-4" />
                                <span>Export</span>
                            </Button>
                        }
                    />
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-4 -mx-4 px-4 md:mx-0 md:px-0">
                {filters.map((filter) => (
                    <Button
                        key={filter.key}
                        variant={activeFilter === filter.key ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilterChange(filter.key)}
                        className={cn(
                            "shrink-0 gap-2 h-9 rounded-full transition-all",
                            activeFilter === filter.key
                                ? "bg-primary text-primary-foreground shadow-glow-sm"
                                : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10"
                        )}
                    >
                        {filter.label}
                        <Badge variant="secondary" className={cn(
                            "h-5 px-1.5 text-xs",
                            activeFilter === filter.key ? "bg-primary-foreground/20 text-primary-foreground" : ""
                        )}>
                            {filter.count}
                        </Badge>
                    </Button>
                ))}
            </div>

            {/* Items Grid */}
            <div className="space-y-3">
                {initialItems.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2 border-gray-300 dark:border-white/20 rounded-2xl">
                        <Package className="w-12 h-12 text-muted-foreground/50 mb-4" />
                        <h3 className="font-semibold text-lg mb-2">No items found</h3>
                        <p className="text-muted-foreground mb-4 max-w-sm">
                            {initialSearch ? 'Try adjusting your search' : 'Add your first inventory item to get started'}
                        </p>
                        <Link href={`/shop/${shopId}/inventory/new`}>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add First Item
                            </Button>
                        </Link>
                    </Card>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block">
                            <Card className="border-2 border-gray-300 dark:border-white/20 shadow-lg rounded-2xl overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50 border-b-2 border-gray-300 dark:border-white/20">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider h-12">Tag ID</TableHead>
                                            <TableHead className="text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider h-12">Product Name</TableHead>
                                            <TableHead className="text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider h-12">Category / Type</TableHead>
                                            <TableHead className="text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider h-12">Net Weight</TableHead>
                                            <TableHead className="text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider h-12">Status</TableHead>
                                            <TableHead className="text-right text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider h-12">Price Info</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {initialItems.map((item) => (
                                            <TableRow
                                                key={item.id}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => router.push(`/shop/${shopId}/inventory/${item.tag_id}`)}
                                            >
                                                <TableCell className="font-medium font-mono text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <QrCode className="h-3 w-3 text-muted-foreground" />
                                                        {item.tag_id}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-xs">
                                                        <span>{item.category || item.metal_type}</span>
                                                        <span className="text-muted-foreground">{item.purity}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{item.net_weight.toFixed(3)} g</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="secondary"
                                                        className={cn(
                                                            "text-xs font-normal",
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
                            </Card>
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
                        </div>
                    </>
                )}
            </div>            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => goToPage(pagination.currentPage - 1)}
                        disabled={pagination.currentPage <= 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground px-4">
                        Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => goToPage(pagination.currentPage + 1)}
                        disabled={pagination.currentPage >= pagination.totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
