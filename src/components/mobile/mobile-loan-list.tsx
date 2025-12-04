'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Banknote, Calendar, AlertCircle, CheckCircle2, Clock, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { format } from 'date-fns';
import type { LoanDashboardStats } from '@/lib/loan-types';

interface MobileLoanListProps {
  shopId: string;
  loans: any[];
  stats: LoanDashboardStats;
}

export function MobileLoanList({ shopId, loans, stats }: MobileLoanListProps) {
  const [search, setSearch] = useState('');

  const filteredLoans = loans.filter(loan => 
    loan.loan_customers?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="md:hidden min-h-screen bg-gray-50/50 dark:bg-black/50 pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            Loans
          </h1>
          <Link href={`/shop/${shopId}/loans/new`}>
            <Button size="sm" className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
              <Plus className="w-4 h-4 mr-1" /> New Loan
            </Button>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider">Active Loans</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{stats.total_active_loans}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800/30">
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider">Disbursed</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatCurrency(stats.total_principal_disbursed)}</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search loans..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-gray-100/50 dark:bg-gray-800/50 border-none focus-visible:ring-1 focus-visible:ring-emerald-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="p-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredLoans.map((loan, index) => (
            <motion.div
              key={loan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/shop/${shopId}/loans/${loan.id}`}>
                <Card className="border-none shadow-sm bg-white dark:bg-gray-900/50 active:scale-[0.98] transition-transform duration-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{loan.loan_customers?.name}</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(loan.start_date), 'dd MMM yyyy')}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${
                        loan.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {loan.status === 'active' ? <Clock className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {loan.status}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Principal</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(loan.principal_amount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Interest</p>
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          +{formatCurrency(loan.total_interest_accrued)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredLoans.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Banknote className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No active loans found</p>
          </div>
        )}
      </div>
    </div>
  );
}
