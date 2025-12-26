'use client';

import { SchemeEnrollment, SchemeTransaction } from '@/lib/scheme-types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ShieldCheck, Calendar, Coins, ArrowUpRight, Wallet, Gem, Sparkles } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

interface DigitalPassbookProps {
    enrollment: SchemeEnrollment;
    transactions: SchemeTransaction[];
    shopName: string;
    shopLogo?: string;
}

export function DigitalPassbook({ enrollment, transactions, shopName, shopLogo }: DigitalPassbookProps) {
    const scheme = enrollment.scheme;
    if (!scheme) return null;

    const isWeightScheme = scheme.calculation_type === 'WEIGHT_ACCUMULATION';
    
    // Calculate progress based on duration for fixed schemes, or arbitrary target for flexible
    const totalMonths = scheme.duration_months || 12;
    const paidMonths = transactions.filter(t => t.transaction_type === 'INSTALLMENT').length;
    const progress = Math.min((paidMonths / totalMonths) * 100, 100);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
            {/* Premium Header */}
            <div className="bg-[#0f172a] text-white pt-8 pb-24 px-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] rounded-full bg-amber-500 blur-[100px]" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[300px] h-[300px] rounded-full bg-blue-500 blur-[80px]" />
                </div>
                
                <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                    {shopLogo ? (
                        <img src={shopLogo} alt={shopName} className="h-16 w-16 rounded-full border-2 border-amber-500/50 shadow-lg object-cover bg-white" />
                    ) : (
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                            <Gem className="w-8 h-8 text-white" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{shopName}</h1>
                        <div className="flex items-center justify-center gap-1.5 text-slate-400 text-sm mt-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Verified Gold Passbook</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 -mt-16 relative z-20 max-w-md mx-auto space-y-6">
                {/* Main Gold Card */}
                <div className="relative group perspective-1000">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-300 to-amber-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                    <Card className="relative border-0 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-2xl overflow-hidden rounded-2xl">
                        {/* Card Pattern Overlay */}
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
                        
                        <CardContent className="p-6 space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-amber-400 text-xs font-bold tracking-widest uppercase mb-1">Gold Scheme</p>
                                    <h2 className="text-xl font-bold">{scheme.name}</h2>
                                </div>
                                <Badge className={cn(
                                    "border-0",
                                    enrollment.status === 'ACTIVE' ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-300"
                                )}>
                                    {enrollment.status}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total Saved</p>
                                    <p className="text-2xl font-bold tracking-tight">{formatCurrency(enrollment.total_paid || 0)}</p>
                                </div>
                                {isWeightScheme && (
                                    <div className="text-right">
                                        <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Gold Balance</p>
                                        <p className="text-2xl font-bold text-amber-400 tracking-tight">
                                            {enrollment.total_gold_weight_accumulated?.toFixed(3)}
                                            <span className="text-sm font-medium text-amber-400/70 ml-1">g</span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-slate-300">
                                    <span>Progress ({paidMonths}/{totalMonths} Months)</span>
                                    <span>{progress.toFixed(0)}%</span>
                                </div>
                                <Progress value={progress} className="h-1.5 bg-slate-700" indicatorClassName="bg-gradient-to-r from-amber-400 to-amber-600" />
                            </div>

                            <div className="pt-2 flex items-center justify-between text-xs text-slate-400 font-mono">
                                <span>A/C: {enrollment.account_number}</span>
                                <span>Started: {format(new Date(enrollment.start_date), 'MMM yyyy')}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 h-12 rounded-xl">
                        <Wallet className="w-4 h-4 mr-2" />
                        Pay Online
                    </Button>
                    <Button variant="outline" className="w-full bg-white hover:bg-slate-50 border-slate-200 text-slate-700 h-12 rounded-xl shadow-sm">
                        <ArrowUpRight className="w-4 h-4 mr-2" />
                        Share Details
                    </Button>
                </div>

                {/* Transaction History */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            History
                        </h3>
                        <span className="text-xs text-muted-foreground">{transactions.length} Transactions</span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                        {transactions.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                <Sparkles className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                                <p>No transactions yet.</p>
                                <p className="text-xs mt-1">Your savings journey starts with the first payment!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {transactions.map((tx) => (
                                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                                                tx.transaction_type === 'BONUS' ? "bg-purple-100 text-purple-600" : "bg-emerald-100 text-emerald-600"
                                            )}>
                                                {tx.transaction_type === 'BONUS' ? <Sparkles className="w-5 h-5" /> : <Coins className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                                                    {tx.transaction_type === 'BONUS' ? 'Bonus Credit' : 'Installment Paid'}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {format(new Date(tx.payment_date), 'dd MMM, hh:mm a')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-900 dark:text-slate-100">
                                                +{formatCurrency(tx.amount)}
                                            </p>
                                            {tx.gold_weight && tx.gold_weight > 0 && (
                                                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                                                    {tx.gold_weight.toFixed(3)}g Gold
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center py-8 space-y-2">
                    <p className="text-xs text-slate-400">
                        Secured by Swarnavyapar • Terms & Conditions Apply
                    </p>
                </div>
            </div>
        </div>
    );
}
