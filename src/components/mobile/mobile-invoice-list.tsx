'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import type { Invoice } from '@/lib/definitions';
import { format } from 'date-fns';

interface MobileInvoiceListProps {
  shopId: string;
  invoices: Invoice[];
}

export function MobileInvoiceList({ shopId, invoices }: MobileInvoiceListProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'paid' | 'due'>('all');

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.customerName.toLowerCase().includes(search.toLowerCase()) || 
                          inv.invoiceNumber.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' ? true : inv.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="md:hidden min-h-screen bg-gray-50/50 dark:bg-black/50 pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            Invoices
          </h1>
          <Link href={`/shop/${shopId}/invoices/new`}>
            <Button size="sm" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
              <FileText className="w-4 h-4 mr-1" /> New Invoice
            </Button>
          </Link>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search invoices..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-gray-100/50 dark:bg-gray-800/50 border-none focus-visible:ring-1 focus-visible:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { id: 'all', label: 'All' },
            { id: 'paid', label: 'Paid' },
            { id: 'due', label: 'Pending' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                filter === tab.id
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
          {filteredInvoices.map((inv, index) => (
            <motion.div
              key={inv.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/shop/${shopId}/invoices/view?id=${inv.id}`}>
                <Card className="border-none shadow-sm bg-white dark:bg-gray-900/50 active:scale-[0.98] transition-transform duration-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{inv.customerName}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(inv.invoiceDate), 'dd MMM yyyy')}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${
                        inv.status === 'paid'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                      }`}>
                        {inv.status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {inv.status}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-end mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <span className="text-xs text-muted-foreground font-mono">#{inv.invoiceNumber}</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(inv.grandTotal)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No invoices found</p>
          </div>
        )}
      </div>
    </div>
  );
}
