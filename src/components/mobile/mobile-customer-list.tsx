'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, Phone, ShoppingBag, Calendar, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import Link from 'next/link';

interface MobileCustomerListProps {
  shopId: string;
  customerData: Record<string, {
    totalPurchase: number;
    invoiceCount: number;
    lastPurchase: string;
  }>;
}

export function MobileCustomerList({ shopId, customerData }: MobileCustomerListProps) {
  const [search, setSearch] = useState('');

  const customers = Object.entries(customerData).map(([name, stats]) => ({
    name,
    ...stats
  })).sort((a, b) => b.totalPurchase - a.totalPurchase);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="md:hidden min-h-screen bg-gray-50/50 dark:bg-black/50 pb-24">
      {/* Sticky Search */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-gray-100/50 dark:bg-gray-800/50 border-none focus-visible:ring-1 focus-visible:ring-blue-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="p-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredCustomers.map((customer, index) => (
            <motion.div
              key={customer.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/shop/${shopId}/customers/view?name=${encodeURIComponent(customer.name)}`}>
                <Card className="border-none shadow-sm bg-white dark:bg-gray-900/50 active:scale-[0.98] transition-transform duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{customer.name}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3" /> {customer.invoiceCount} Orders
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total Spent</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(customer.totalPurchase)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Last Visit</p>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {format(new Date(customer.lastPurchase), 'dd MMM yyyy')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No customers found</p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <Link href={`/shop/${shopId}/customers/new`}>
        <Button
          size="lg"
          className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg shadow-blue-500/30 bg-blue-600 hover:bg-blue-700 z-40"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </Link>
    </div>
  );
}
