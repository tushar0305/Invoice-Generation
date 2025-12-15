'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Activity, Users, Target } from 'lucide-react';
import { motion } from 'framer-motion';

interface BusinessHealthProps {
    totalRevenue: number;
    totalOrders: number; // For AOV
    revenueGrowth: number; // MoM Growth %
    returningRate: number; // Retention %
}

export function BusinessHealthWidget({ totalRevenue, totalOrders, revenueGrowth, returningRate }: BusinessHealthProps) {
    // 1. Average Order Value (AOV)
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // 2. Health Score Calculation (0-100)
    // - Growth: Max 40 pts (if > 10% growth)
    // - Retention: Max 30 pts (if > 30% retention)
    // - Consistent Orders: Max 30 pts (if > 10 orders)

    let score = 0;

    // Growth Score
    if (revenueGrowth >= 10) score += 40;
    else if (revenueGrowth > 0) score += 30;
    else if (revenueGrowth > -10) score += 20;
    else score += 10;

    // Retention Score
    if (returningRate >= 30) score += 30;
    else if (returningRate >= 15) score += 20;
    else if (returningRate > 0) score += 10;

    // Activity Score
    if (totalOrders >= 50) score += 30;
    else if (totalOrders >= 10) score += 20;
    else if (totalOrders > 0) score += 10;

    // Determine Health Label
    let healthLabel = "Needs Attention";
    let healthColor = "text-rose-500";
    let healthBg = "bg-rose-500/10";
    let progressGradient = "from-rose-500 via-rose-400 to-rose-500";

    if (score >= 80) {
        healthLabel = "Excellent";
        healthColor = "text-emerald-500";
        healthBg = "bg-emerald-500/10";
        progressGradient = "from-emerald-500 via-emerald-400 to-emerald-500";
    } else if (score >= 60) {
        healthLabel = "Good";
        healthColor = "text-blue-500";
        healthBg = "bg-blue-500/10";
        progressGradient = "from-blue-500 via-blue-400 to-blue-500";
    } else if (score >= 40) {
        healthLabel = "Fair";
        healthColor = "text-amber-500";
        healthBg = "bg-amber-500/10";
        progressGradient = "from-amber-500 via-amber-400 to-amber-500";
    }

    const isPositiveGrowth = revenueGrowth >= 0;

    return (
        <Card className="h-full min-h-[400px] overflow-hidden relative flex flex-col bg-card border border-border shadow-sm hover:shadow-md transition-all duration-300">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />

            <CardHeader className="pb-3 border-b border-border relative">
                <CardTitle className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                        <Activity className="w-4 h-4 text-violet-500" />
                    </div>
                    Business Health
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5 relative">
                {/* Health Score Main Display */}
                <div className={`space-y-3 p-4 rounded-2xl border ${healthBg.replace('10', '5')} border-border/50`}>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Overall Score</p>
                        <span className={`text-[10px] font-bold ${healthColor} ${healthBg} px-2.5 py-1 rounded-full border border-border/10 flex items-center gap-1`}>
                            <Target className="w-3 h-3" />
                            {healthLabel}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <motion.h3
                            className="text-4xl font-bold text-foreground font-heading tabular-nums"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                        >
                            {score}<span className="text-lg text-muted-foreground font-medium">/100</span>
                        </motion.h3>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            transition={{ duration: 1.0, ease: "easeOut" }}
                            className={`h-full bg-gradient-to-r ${progressGradient} rounded-full shadow-[0_0_12px_rgba(0,0,0,0.1)]`}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Based on revenue growth, customer retention, and order volume.
                    </p>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Retention */}
                    <motion.div
                        className="p-3 rounded-xl bg-muted/40 border border-border/60 hover:bg-muted/60 transition-colors space-y-2"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                    >
                        <div className="flex items-center gap-2 text-blue-500">
                            <Users className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase">Retention</span>
                        </div>
                        <p className="text-xl font-bold text-foreground tabular-nums">
                            {returningRate.toFixed(1)}%
                        </p>
                    </motion.div>

                    {/* AOV */}
                    <motion.div
                        className="p-3 rounded-xl bg-muted/40 border border-border/60 hover:bg-muted/60 transition-colors space-y-2"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                    >
                        <div className="flex items-center gap-2 text-emerald-500">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase">Avg Order</span>
                        </div>
                        <p className="text-xl font-bold text-foreground tabular-nums">
                            {formatCurrency(aov)}
                        </p>
                    </motion.div>
                </div>

                {/* Growth Insight */}
                <motion.div
                    className="p-4 rounded-xl border bg-card/50 backdrop-blur-sm border-border space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Monthly Growth</span>
                        <div className={`flex items-center gap-1 text-xs font-bold ${isPositiveGrowth ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isPositiveGrowth ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Math.abs(revenueGrowth).toFixed(1)}%
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {isPositiveGrowth
                            ? "Revenue is trending upwards compared to last month. Keep it up!"
                            : "Revenue has dipped. Consider running a promotion to boost sales."}
                    </p>
                </motion.div>
            </CardContent>
        </Card>
    );
}
