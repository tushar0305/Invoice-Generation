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
    recentDueInvoices?: any[];
}

export function PendingPaymentsWidget({
    shopId,
    pendingCount,
    totalDue,
    overdueCount,
    overdueDays = 0,
    recentDueInvoices = []
}: PendingPaymentsWidgetProps) {
    const hasUrgent = overdueCount > 0;

    return (
        <Card className="h-full overflow-hidden bg-card border border-border shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-2 flex flex-row items-center justify-between border-b border-border/50">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <div className={`p-1.5 rounded-lg ${hasUrgent ? 'bg-destructive/10 border border-destructive/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
                        <Clock className={`h-4 w-4 ${hasUrgent ? 'text-destructive' : 'text-amber-600 dark:text-amber-400'}`} />
                    </div>
                    Pending
                </CardTitle>
                {pendingCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        {pendingCount} invoices
                    </span>
                )}
            </CardHeader>
            <CardContent className="pt-2">
                {pendingCount === 0 ? (
                    <div className="text-center py-4">
                        <IndianRupee className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-xs text-muted-foreground">All payments received!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Total Due Amount */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10"
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
                                className="flex items-center gap-2 p-2 rounded-lg bg-destructive/5 border border-destructive/20"
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                >
                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                </motion.div>
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-destructive">
                                        {overdueCount} overdue
                                    </p>
                                    {overdueDays > 0 && (
                                        <p className="text-[10px] text-destructive/80">
                                            Oldest: {overdueDays} days
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Recent Due Invoices List */}
                        {recentDueInvoices.length > 0 && (
                            <div className="space-y-2 pt-1">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Recent Due</p>
                                <div className="space-y-1">
                                    {recentDueInvoices.map((inv, i) => (
                                        <motion.div
                                            key={inv.id}
                                            initial={{ opacity: 0, x: -5 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 * i }}
                                            className="flex items-center justify-between p-1.5 rounded-md hover:bg-muted/50 transition-colors text-xs"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                                                <span className="truncate font-medium text-foreground">{inv.customer_name}</span>
                                            </div>
                                            <span className="font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap ml-2">
                                                {formatCurrency(inv.grand_total)}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* View All Button */}
                        <Button variant="ghost" size="sm" className="w-full text-xs h-7 text-muted-foreground hover:text-primary hover:bg-primary/10" asChild>
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
