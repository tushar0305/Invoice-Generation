'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function GoldSilverTicker({ initialData }: { initialData?: any }) {
    const [prices, setPrices] = useState({
        gold24k: { value: initialData?.gold_24k || 0, trend: 'up' },
        gold22k: { value: initialData?.gold_22k || 0, trend: 'up' },
        silver: { value: initialData?.silver || 0, trend: 'up' },
    });
    const [previousPrices, setPreviousPrices] = useState({
        gold24k: initialData?.gold_24k || 0,
        gold22k: initialData?.gold_22k || 0,
        silver: initialData?.silver || 0,
    });
    const [lastUpdated, setLastUpdated] = useState<Date | null>(initialData?.updated_at ? new Date(initialData.updated_at) : null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const calculateTrend = (current: number, previous: number): string => {
        if (previous === 0) return 'up'; // Default to up for visual appeal
        if (current > previous) return 'up';
        if (current < previous) return 'down';
        return 'up'; // Default to up instead of neutral
    };

    const fetchPrices = async () => {
        try {
            const { data, error } = await supabase
                .from('market_rates')
                .select('*')
                .order('updated_at', { ascending: false })
                .limit(1)
                .single();

            if (error) throw error;

            if (data) {
                const newPrices = {
                    gold24k: {
                        value: data.gold_24k,
                        trend: calculateTrend(data.gold_24k, previousPrices.gold24k)
                    },
                    gold22k: {
                        value: data.gold_22k,
                        trend: calculateTrend(data.gold_22k, previousPrices.gold22k)
                    },
                    silver: {
                        value: data.silver,
                        trend: calculateTrend(data.silver, previousPrices.silver)
                    },
                };

                setPrices(newPrices);
                setPreviousPrices({
                    gold24k: data.gold_24k,
                    gold22k: data.gold_22k,
                    silver: data.silver,
                });
                setLastUpdated(new Date(data.updated_at));
            }
        } catch (error) {
            console.error('Error fetching prices:', JSON.stringify(error, null, 2));
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            // Call the Supabase Edge Function to fetch fresh prices
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/update-prices`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to fetch prices');
            }

            // Re-fetch prices from Supabase to get updated values
            await fetchPrices();

            toast({
                title: "Prices Updated",
                description: result.source === 'IBJA'
                    ? "Latest rates fetched from IBJA."
                    : `Updated from ${result.source}.`,
            });
        } catch (error) {
            console.error('Refresh error:', error);
            toast({
                variant: "destructive",
                title: "Refresh Failed",
                description: "Could not fetch latest prices. Please try again.",
            });
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (!initialData) {
            fetchPrices();
        }

        // Subscribe to real-time updates
        const channel = supabase
            .channel('market_rates_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'market_rates' },
                (payload) => {
                    if (payload.new) {
                        const newRate = payload.new as any;
                        const newPrices = {
                            gold24k: {
                                value: newRate.gold_24k,
                                trend: calculateTrend(newRate.gold_24k, previousPrices.gold24k)
                            },
                            gold22k: {
                                value: newRate.gold_22k,
                                trend: calculateTrend(newRate.gold_22k, previousPrices.gold22k)
                            },
                            silver: {
                                value: newRate.silver,
                                trend: calculateTrend(newRate.silver, previousPrices.silver)
                            },
                        };

                        setPrices(newPrices);
                        setPreviousPrices({
                            gold24k: newRate.gold_24k,
                            gold22k: newRate.gold_22k,
                            silver: newRate.silver,
                        });
                        setLastUpdated(new Date(newRate.updated_at));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const PriceItem = ({ label, price, unit, trend, offset }: { label: string, price: number, unit: string, trend: string, offset: number }) => {
        const [showUp, setShowUp] = useState(offset === 0);
        const [isAnimating, setIsAnimating] = useState(false);
        const [prevPrice, setPrevPrice] = useState(price);

        useEffect(() => {
            // Each item has different timing, creating varied animations.
            // Use a base of ~2.5s so arrows change slowly (2-3s range per request).
            const baseMs = 2500;
            const intervalMs = baseMs + (offset * 500); // offsets: ~2500, 3000, 3500ms
            const interval = setInterval(() => {
                setShowUp(prev => !prev);
            }, intervalMs);
            return () => clearInterval(interval);
        }, [offset]);

        // Trigger animation when price changes
        useEffect(() => {
            if (price !== prevPrice) {
                setIsAnimating(true);
                const timer = setTimeout(() => setIsAnimating(false), 600);
                setPrevPrice(price);
                return () => clearTimeout(timer);
            }
        }, [price, prevPrice]);

        // Gold vs Silver styling
        const isGold = label.toLowerCase().includes('gold');
        const gradientBg = isGold
            ? 'bg-amber-500/5 dark:bg-amber-500/10 hover:bg-amber-500/10 dark:hover:bg-amber-500/20'
            : 'bg-slate-500/5 dark:bg-slate-500/10 hover:bg-slate-500/10 dark:hover:bg-slate-500/20';

        const borderColor = isGold
            ? 'border-amber-500/20 dark:border-amber-500/20'
            : 'border-slate-500/20 dark:border-slate-500/20';

        const labelColor = isGold
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-slate-600 dark:text-slate-400';

        const priceGlow = isAnimating
            ? isGold
                ? 'shadow-[0_0_15px_rgba(245,158,11,0.3)] border-amber-500/40'
                : 'shadow-[0_0_15px_rgba(148,163,184,0.3)] border-slate-500/40'
            : '';

        return (
            <motion.div
                className={cn(
                    "flex items-center px-3.5 md:px-4 py-2 md:py-2.5 rounded-xl border backdrop-blur-md flex-shrink-0 transition-all duration-300",
                    gradientBg,
                    borderColor,
                    priceGlow,
                    "hover:scale-[1.02] hover:shadow-lg"
                )}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: offset * 0.08, duration: 0.3 }}
            >
                <div className="flex flex-col">
                    <span className={cn(
                        "text-[9px] md:text-[10px] uppercase tracking-wider font-bold flex items-center gap-1.5",
                        labelColor
                    )}>
                        {label}
                        <motion.div
                            key={showUp ? 'up' : 'down'}
                            initial={{ y: showUp ? 4 : -4, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: showUp ? -4 : 4, opacity: 0 }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                            className={cn(
                                "flex items-center justify-center w-3.5 h-3.5 rounded-full",
                                showUp ? "bg-emerald-500/10" : "bg-red-500/10"
                            )}
                        >
                            {showUp ? (
                                <TrendingUp className="h-2 w-2 text-emerald-500" />
                            ) : (
                                <TrendingDown className="h-2 w-2 text-red-500" />
                            )}
                        </motion.div>
                    </span>
                    <div className="flex items-baseline gap-0.5 mt-0.5">
                        <AnimatePresence mode="popLayout">
                            <motion.span
                                key={price}
                                initial={{ y: 8, opacity: 0 }}
                                animate={{
                                    y: 0,
                                    opacity: 1,
                                    color: isAnimating
                                        ? (price > prevPrice ? '#10b981' : '#ef4444')
                                        : 'inherit'
                                }}
                                exit={{ y: -8, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                className={cn(
                                    "font-mono font-bold text-xs md:text-sm text-foreground tabular-nums tracking-tight"
                                )}
                            >
                                ₹{price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                            </motion.span>
                        </AnimatePresence>
                        <span className="text-[9px] md:text-[10px] text-muted-foreground font-sans font-medium opacity-60">/{unit}</span>
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="w-full py-2.5 px-3 md:px-4 rounded-2xl bg-card/30 backdrop-blur-xl border border-white/5 shadow-sm overflow-hidden flex items-center gap-4">

            {/* Live Badge (Static) */}
            <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-amber-500 whitespace-nowrap tracking-widest flex-shrink-0 z-10 bg-background/5 p-1 rounded">
                <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-60"></span>
                    <span className="relative inline-flex rounded-full h-full w-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
                </span>
                LIVE
            </div>

            {/* Scrolling Marquee */}
            <div className="flex-1 overflow-hidden relative mask-fade-sides">
                <motion.div
                    className="flex gap-8 items-center w-max"
                    animate={{ x: [0, -500] }}
                    transition={{
                        repeat: Infinity,
                        duration: 15,
                        ease: "linear"
                    }}
                >
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex gap-8">
                            <div className="flex items-center gap-2">
                                <span className="text-amber-500 font-bold text-xs">GOLD 24K</span>
                                <span className="font-mono font-bold text-sm">₹{prices.gold24k.value.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-amber-600/80 font-bold text-xs">GOLD 22K</span>
                                <span className="font-mono font-bold text-sm">₹{prices.gold22k.value.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 font-bold text-xs">SILVER</span>
                                <span className="font-mono font-bold text-sm">₹{prices.silver.value.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>

            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex-shrink-0 z-10"
                onClick={handleRefresh}
                disabled={isRefreshing}
            >
                <RefreshCw className={cn("h-3 w-3 text-muted-foreground", isRefreshing && "animate-spin")} />
            </Button>
        </div>
    );
}
