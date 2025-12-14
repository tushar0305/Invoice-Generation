'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, QrCode, Package, Scale, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import type { InventoryItem } from '@/lib/inventory-types';
import { STATUS_LABELS } from '@/lib/inventory-types';
import { InventoryMobileCard } from '@/components/inventory/inventory-mobile-card';

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

    const goToPage = (page: number) => {
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.set('page', String(page));
        router.push(`/shop/${shopId}/inventory?${newParams.toString()}`);
    };

    const filters = [
        { key: 'all', label: 'All', count: counts.all },
        { key: 'IN_STOCK', label: 'In Stock', count: counts.inStock },
        { key: 'RESERVED', label: 'Reserved', count: counts.reserved },
        { key: 'SOLD', label: 'Sold', count: counts.sold },
    ];

    return (
        <div className="space-y-4 pb-20 md:pb-6 pt-2 md:pt-0">
            {/* Search & Filters */}
            <div className="flex flex-col gap-3">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
                        <Input
                            placeholder="Search by name or tag..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-11"
                        />
                        {searchQuery && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                                onClick={() => {
                                    setSearchQuery('');
                                    updateUrl({ q: null });
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <Button type="submit" variant="outline" className="h-11 px-4">
                        <Filter className="h-4 w-4" />
                    </Button>
                </form>

                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {filters.map((filter) => (
                        <Button
                            key={filter.key}
                            variant={activeFilter === filter.key ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleFilterChange(filter.key)}
                            className={cn(
                                "shrink-0 gap-2",
                                activeFilter === filter.key && "bg-primary"
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
            </div>

            {/* Items Grid */}
            {initialItems.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2 border-border rounded-xl">
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
                    {/* Desktop Grid View */}
                    <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {initialItems.map((item) => (
                            <Link key={item.id} href={`/shop/${shopId}/inventory/${item.tag_id}`}>
                                <Card className={cn(
                                    "group h-full overflow-hidden transition-all",
                                    "bg-card border border-border",
                                    "hover:shadow-lg hover:-translate-y-1 active:scale-[0.98]",
                                    "cursor-pointer touch-manipulation rounded-xl"
                                )}>
                                    <CardContent className="p-4 space-y-3">
                                        {/* Tag & Status */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs font-mono bg-muted/50 px-2 py-1 rounded">
                                                <QrCode className="w-3 h-3 text-primary" />
                                                {item.tag_id}
                                            </div>
                                            <Badge
                                                variant="secondary"
                                                className={cn(
                                                    "text-xs",
                                                    item.status === 'IN_STOCK' && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                                                    item.status === 'RESERVED' && "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
                                                    item.status === 'SOLD' && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                                                )}
                                            >
                                                {STATUS_LABELS[item.status]?.label || item.status}
                                            </Badge>
                                        </div>

                                        {/* Name */}
                                        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                            {item.name}
                                        </h3>

                                        {/* Category & Purity */}
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span>{item.category || item.metal_type}</span>
                                            <span>•</span>
                                            <span className="text-amber-600 dark:text-amber-400 font-medium">{item.purity}</span>
                                        </div>

                                        {/* Weight & Making Charge */}
                                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <Scale className="w-3.5 h-3.5 text-muted-foreground" />
                                                <span className="font-medium">{item.net_weight}g</span>
                                            </div>
                                            {item.making_charge_value > 0 && (
                                                <span className="text-sm text-muted-foreground">
                                                    ₹{item.making_charge_value}/g
                                                </span>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-1">
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

            {/* Pagination */}
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
