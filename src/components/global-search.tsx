'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, Loader2, FileText, Users, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase/client';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/utils';

interface SearchResult {
    type: 'invoice' | 'customer' | 'inventory';
    id: string;
    title: string;
    subtitle: string;
    metadata?: string;
    href: string;
}

interface GlobalSearchProps {
    shopId: string;
    isOpen: boolean;
    onClose: () => void;
}

export function GlobalSearch({ shopId, isOpen, onClose }: GlobalSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();

    // Debounced search
    useEffect(() => {
        if (!query || query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            await performSearch(query);
            setIsLoading(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, shopId]);

    const performSearch = async (searchQuery: string) => {
        const searchPattern = `%${searchQuery}%`;
        const allResults: SearchResult[] = [];

        try {
            // Search Invoices
            const { data: invoices } = await supabase
                .from('invoices')
                .select('id, invoice_number, customer_name, grand_total, status')
                .eq('shop_id', shopId)
                .or(`invoice_number.ilike.${searchPattern},customer_name.ilike.${searchPattern}`)
                .limit(5);

            if (invoices) {
                invoices.forEach(inv => {
                    allResults.push({
                        type: 'invoice',
                        id: inv.id,
                        title: inv.invoice_number,
                        subtitle: inv.customer_name,
                        metadata: `${formatCurrency(inv.grand_total)} • ${inv.status}`,
                        href: `/shop/${shopId}/invoices/view?id=${inv.id}`,
                    });
                });
            }

            // Search Customers
            const { data: customers } = await supabase
                .from('customers')
                .select('id, name, phone, email')
                .eq('shop_id', shopId)
                .or(`name.ilike.${searchPattern},phone.ilike.${searchPattern},email.ilike.${searchPattern}`)
                .limit(5);

            if (customers) {
                customers.forEach(cust => {
                    allResults.push({
                        type: 'customer',
                        id: cust.id,
                        title: cust.name,
                        subtitle: cust.phone || cust.email || 'No contact',
                        href: `/shop/${shopId}/customers`,
                    });
                });
            }

            // Search Inventory
            const { data: inventory } = await supabase
                .from('inventory_items')
                .select('id, tag_id, name, metal_type, purity, status')
                .eq('shop_id', shopId)
                .eq('status', 'IN_STOCK')
                .or(`name.ilike.${searchPattern},tag_id.ilike.${searchPattern}`)
                .limit(5);

            if (inventory) {
                inventory.forEach(item => {
                    allResults.push({
                        type: 'inventory',
                        id: item.id,
                        title: item.name,
                        subtitle: item.tag_id,
                        metadata: `${item.metal_type} ${item.purity}`,
                        href: `/shop/${shopId}/inventory/${item.tag_id}`,
                    });
                });
            }

            setResults(allResults);
            setSelectedIndex(0);
        } catch (error) {
            console.error('Search error:', error);
        }
    };

    const handleSelect = (result: SearchResult) => {
        router.push(result.href);
        onClose();
        setQuery('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            e.preventDefault();
            handleSelect(results[selectedIndex]);
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'invoice': return FileText;
            case 'customer': return Users;
            case 'inventory': return Package;
            default: return Search;
        }
    };

    const getTypeLabel = (type: string) => {
        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-start justify-center pt-[15vh] px-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Search Input */}
                    <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-200 dark:border-slate-800">
                        <Search className="w-5 h-5 text-slate-400" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search invoices, customers, inventory..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 bg-transparent outline-none text-lg text-slate-900 dark:text-white placeholder:text-slate-400"
                        />
                        {isLoading && <Loader2 className="w-5 h-5 animate-spin text-gold-500" />}
                        <kbd className="hidden sm:block px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">
                            ESC
                        </kbd>
                    </div>

                    {/* Results */}
                    <div className="max-h-[60vh] overflow-y-auto">
                        {query.length < 2 && (
                            <div className="px-4 py-8 text-center text-sm text-slate-500">
                                Type at least 2 characters to search
                            </div>
                        )}

                        {query.length >= 2 && results.length === 0 && !isLoading && (
                            <div className="px-4 py-8 text-center text-sm text-slate-500">
                                No results found for "{query}"
                            </div>
                        )}

                        {results.length > 0 && (
                            <div className="py-2">
                                {results.map((result, index) => {
                                    const Icon = getIcon(result.type);
                                    const isSelected = index === selectedIndex;

                                    return (
                                        <button
                                            key={`${result.type}-${result.id}`}
                                            onClick={() => handleSelect(result)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                                                isSelected
                                                    ? "bg-gold-50 dark:bg-gold-950/20"
                                                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-2 rounded-lg",
                                                isSelected ? "bg-gold-100 dark:bg-gold-900/30 text-gold-600 dark:text-gold-400" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                            )}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                                                        {result.title}
                                                    </p>
                                                    <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                        {getTypeLabel(result.type)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-xs text-slate-500 truncate">
                                                        {result.subtitle}
                                                    </p>
                                                    {result.metadata && (
                                                        <>
                                                            <span className="text-slate-300 dark:text-slate-700">•</span>
                                                            <p className="text-xs text-slate-500">
                                                                {result.metadata}
                                                            </p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700">↑</kbd>
                                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700">↓</kbd>
                                    <span className="ml-1">Navigate</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700">↵</kbd>
                                    <span className="ml-1">Select</span>
                                </span>
                            </div>
                            <span>{results.length} results</span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}
