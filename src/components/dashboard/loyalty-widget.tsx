'use client';

import { motion } from 'framer-motion';
import { Gift, Users, Star, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface LoyaltyWidgetProps {
    shopId: string;
    totalPointsDistributed: number;
    activeMembers: number;
    topRewarder?: {
        name: string;
        points: number;
    };
}

export function LoyaltyWidget({
    shopId,
    totalPointsDistributed,
    activeMembers,
    topRewarder
}: LoyaltyWidgetProps) {
    return (
        <Card className="h-full overflow-hidden bg-card border border-border shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-2 flex flex-row items-center justify-between border-b border-border/50">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <Gift className="h-4 w-4 text-purple-500" />
                    </div>
                    Loyalty
                </CardTitle>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20">
                    {activeMembers} members
                </span>
            </CardHeader>
            <CardContent className="pt-2">
                <div className="space-y-3">
                    {/* Points Counter */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 hover:bg-purple-500/10 transition-colors"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] uppercase tracking-wide text-purple-500 font-medium mb-1">
                                    Points Given
                                </p>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-xl font-bold text-purple-400 glow-text-sm"
                                >
                                    {totalPointsDistributed.toLocaleString()}
                                </motion.p>
                            </div>
                            <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 + i * 0.1 }}
                                    >
                                        <Star
                                            className={`h-4 w-4 ${i < 4 ? 'text-purple-500 fill-purple-500' : 'text-purple-500/30'}`}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Top Rewarder */}
                    {topRewarder && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10 transition-colors"
                        >
                            <Users className="h-4 w-4 text-amber-500" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate text-foreground">{topRewarder.name}</p>
                                <p className="text-[10px] text-amber-500">
                                    {topRewarder.points} pts earned
                                </p>
                            </div>
                            <TrendingUp className="h-3 w-3 text-amber-500" />
                        </motion.div>
                    )}

                    {/* View All Button */}
                    <Button variant="ghost" size="sm" className="w-full text-xs h-7 text-muted-foreground hover:text-primary hover:bg-primary/10" asChild>
                        <Link href={`/shop/${shopId}/loyalty`}>
                            Manage <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
