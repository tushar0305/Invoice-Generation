'use client';

import { motion } from 'framer-motion';
import { Clock, IndianRupee, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

interface PendingPaymentsWidgetProps {
    shopId: string;
    pendingCount: number;
    totalDue: number;
    overdueCount: number;
    overdueDays?: number;
}

export function PendingPaymentsWidget({
    shopId,
    pendingCount,
    totalDue,
    overdueCount,
    overdueDays = 0
}: PendingPaymentsWidgetProps) {
    const hasUrgent = overdueCount > 0;

    return (
        <Card className="h-full overflow-hidden bg-gradient-to-br from-white via-stone-50 to-[#D4AF37]/5 dark:from-[#2e2410] dark:via-[#1c1917] dark:to-[#D4AF37]/20 border border-[#D4AF37]/20 hover:border-[#D4AF37]/50 shadow-lg hover:shadow-[#D4AF37]/10 transition-all duration-300">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${hasUrgent ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                        <Clock className={`h-4 w-4 ${hasUrgent ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`} />
                    </div>
                    Pending
                </CardTitle>
                {pendingCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                        {pendingCount} invoices
                    </span>
                )}
            </CardHeader>
            <CardContent className="pt-2">
                {pendingCount === 0 ? (
                    <div className="text-center py-4">
                        <IndianRupee className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                        <p className="text-xs text-gray-500">All payments received!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Total Due Amount */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800"
                        >
                            <p className="text-[10px] uppercase tracking-wide text-amber-600 dark:text-amber-400 font-medium mb-1">
                                Total Outstanding
                            </p>
                            <motion.p
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-xl font-bold text-amber-700 dark:text-amber-300"
                            >
                                {formatCurrency(totalDue)}
                            </motion.p>
                        </motion.div>

                        {/* Overdue Warning */}
                        {overdueCount > 0 && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                >
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                </motion.div>
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                                        {overdueCount} overdue
                                    </p>
                                    {overdueDays > 0 && (
                                        <p className="text-[10px] text-red-500">
                                            Oldest: {overdueDays} days
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* View All Button */}
                        <Button variant="ghost" size="sm" className="w-full text-xs h-7 text-muted-foreground hover:text-amber-600 hover:bg-amber-50" asChild>
                            <Link href={`/shop/${shopId}/invoices?status=due`}>
                                View All <ArrowRight className="h-3 w-3 ml-1" />
                            </Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
