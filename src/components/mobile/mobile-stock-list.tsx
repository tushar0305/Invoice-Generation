'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Plus, AlertCircle, Package, ArrowUpRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import type { StockItem } from '@/lib/definitions';

interface MobileStockListProps {
  shopId: string;
  items: StockItem[];
}

export function MobileStockList({ shopId, items }: MobileStockListProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all'
      ? true
      : filter === 'low'
        ? item.quantity > 0 && item.quantity < 3
        : item.quantity === 0;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="md:hidden min-h-screen bg-gray-50/50 dark:bg-black/50 pb-24">
      {/* Sticky Search & Filter */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 px-4 py-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-gray-100/50 dark:bg-gray-800/50 border-none focus-visible:ring-1 focus-visible:ring-amber-500"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'low', label: 'Low Stock' },
            { id: 'out', label: 'Out of Stock' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${filter === tab.id
                ? 'bg-gray-900 text-white dark:bg-white dark:text-black shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="p-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/shop/${shopId}/stock/edit?id=${item.id}`}>
                <Card className="border-none shadow-sm bg-white dark:bg-gray-900/50 active:scale-[0.98] transition-transform duration-200">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${item.quantity === 0
                        ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                        : item.quantity < 3
                          ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                        <Package className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{item.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {item.purity}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white">
                        {item.quantity} <span className="text-xs font-normal text-muted-foreground">{item.unit}</span>
                      </p>
                      <Badge variant="outline" className={`mt-1 text-[10px] h-5 border-0 ${item.quantity === 0
                        ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        : item.quantity < 3
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                          : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        }`}>
                        {item.quantity === 0 ? 'Out of Stock' : item.quantity < 3 ? 'Low Stock' : 'In Stock'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No items found</p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <Link href={`/shop/${shopId}/stock/new`}>
        <Button
          size="lg"
          className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg shadow-amber-500/30 bg-amber-500 hover:bg-amber-600 z-40"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </Link>
    </div>
  );
}
