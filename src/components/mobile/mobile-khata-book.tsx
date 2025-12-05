'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, ArrowUpRight, ArrowDownLeft, History, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { format } from 'date-fns';
import type { CustomerBalance, LedgerTransaction } from '@/lib/ledger-types';
import { StatusBadge } from '@/components/ui/status-badge';

interface MobileKhataBookProps {
  shopId: string;
  customers: CustomerBalance[];
  stats: {
    total_customers: number;
    total_receivable: number;
    total_payable: number;
    net_balance: number;
  };
  recentTransactions: LedgerTransaction[];
}

export function MobileKhataBook({ shopId, customers, stats, recentTransactions }: MobileKhataBookProps) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'customers' | 'transactions'>('customers');

  const filteredCustomers = customers.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="md:hidden min-h-screen bg-gray-50/50 dark:bg-black/50 pb-24">
      {/* Sticky Balance & Controls */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 px-4 py-3 space-y-3">
        {/* Net Balance Card */}
        <div className={`p-4 rounded-2xl border shadow-sm ${stats.net_balance >= 0
          ? 'bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800/30'
          : 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800/30'
          }`}>
          <p className="text-xs font-medium uppercase tracking-wider opacity-70 mb-1">Net Balance</p>
          <div className="flex items-baseline justify-between">
            <h2 className={`text-2xl font-bold ${stats.net_balance >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
              }`}>
              {formatCurrency(Math.abs(stats.net_balance))}
            </h2>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${stats.net_balance >= 0 ? 'bg-green-200/50 text-green-800' : 'bg-red-200/50 text-red-800'
              }`}>
              {stats.net_balance >= 0 ? 'To Receive' : 'To Pay'}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === 'customers'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
              }`}
          >
            Customers
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === 'transactions'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
              }`}
          >
            Recent Activity
          </button>
        </div>

        {activeTab === 'customers' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-gray-100/50 dark:bg-gray-800/50 border-none focus-visible:ring-1 focus-visible:ring-purple-500"
            />
          </div>
        )}
      </div>

      {/* List */}
      <div className="p-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {activeTab === 'customers' ? (
            filteredCustomers.map((customer, index) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/shop/${shopId}/khata/customer/${customer.id}`}>
                  <Card className="border-none shadow-sm bg-white dark:bg-gray-900/50 active:scale-[0.98] transition-transform duration-200">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{customer.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            Last: {customer.last_transaction_date ? format(new Date(customer.last_transaction_date), 'dd MMM') : '-'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <StatusBadge
                          status={customer.current_balance > 0 ? 'receivable' : customer.current_balance < 0 ? 'payable' : 'settled'}
                          className="mb-1"
                        />
                        <p className="text-[10px] text-muted-foreground font-medium">
                          {customer.current_balance > 0 ? 'You get' : customer.current_balance < 0 ? 'You pay' : 'Settled'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))
          ) : (
            recentTransactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-none shadow-sm bg-white dark:bg-gray-900/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${tx.entry_type === 'CREDIT'
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                        {tx.entry_type === 'CREDIT' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{tx.customer?.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.created_at), 'dd MMM, hh:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${tx.entry_type === 'CREDIT'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                        }`}>
                        {tx.entry_type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground capitalize">
                        {tx.transaction_type}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {activeTab === 'customers' && filteredCustomers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No customers found</p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <Link href={`/shop/${shopId}/khata/new`}>
        <Button
          size="lg"
          className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg shadow-purple-500/30 bg-purple-600 hover:bg-purple-700 z-40"
        >
          <ArrowUpRight className="w-6 h-6" />
        </Button>
      </Link>
    </div>
  );
}
