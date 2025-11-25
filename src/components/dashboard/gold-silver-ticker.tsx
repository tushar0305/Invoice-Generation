'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function GoldSilverTicker() {
    const [prices, setPrices] = useState({
        gold24k: { value: 0, trend: 'up' },
        gold22k: { value: 0, trend: 'up' },
        silver: { value: 0, trend: 'up' },
    });
    const [previousPrices, setPreviousPrices] = useState({
        gold24k: 0,
        gold22k: 0,
        silver: 0,
    });
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
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
            console.error('Error fetching prices:', error);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            // Call the API to scrape fresh prices from the web
            const response = await fetch('/api/cron/update-prices');
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch prices');
            }
            
            // Re-fetch prices from Supabase to get updated values
            await fetchPrices();
            
            toast({
                title: "Prices Updated",
                description: result.source === 'scraped' 
                    ? "Latest rates fetched from market." 
                    : "Using estimated market rates.",
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
        fetchPrices();

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

        return (
            <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 bg-white/5 rounded-full border border-gold-500/10 backdrop-blur-sm shadow-sm hover:bg-gold-500/5 transition-colors flex-shrink-0">
                <div className="flex flex-col">
                    <span className="text-[9px] md:text-[10px] uppercase tracking-wider text-gold-600 dark:text-gold-400 font-bold flex items-center gap-1">
                        {label}
                        <motion.div
                            key={showUp ? 'up' : 'down'}
                            initial={{ y: showUp ? 5 : -5, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: showUp ? -5 : 5, opacity: 0 }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                        >
                            {showUp ? (
                                <TrendingUp className="h-3 w-3 text-green-500" />
                            ) : (
                                <TrendingDown className="h-3 w-3 text-red-500" />
                            )}
                        </motion.div>
                    </span>
                    <div className="flex items-center gap-1">
                        <AnimatePresence mode="popLayout">
                            <motion.span
                                key={price}
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -10, opacity: 0 }}
                                className="font-mono font-bold text-xs md:text-sm text-foreground"
                            >
                                ₹{price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                <span className="text-[10px] text-muted-foreground ml-0.5 font-sans font-medium">/{unit}</span>
                            </motion.span>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full py-2">
            <div className="flex items-center justify-between gap-2 md:gap-4 w-full">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-[10px] md:text-xs font-bold text-gold-600 dark:text-gold-400 whitespace-nowrap tracking-widest flex-shrink-0">
                        <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2 mr-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-full w-full bg-gold-500"></span>
                        </span>
                        LIVE PRICE
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full hover:bg-gold-500/10"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={cn("h-3 w-3 text-muted-foreground", isRefreshing && "animate-spin")} />
                    </Button>
                    {lastUpdated && (
                        <span className="text-[10px] text-muted-foreground hidden sm:inline-block">
                            {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 md:gap-3 overflow-x-auto scrollbar-hide md:overflow-visible md:ml-auto">
                    {prices.gold24k.value > 0 ? (
                        <>
                            <PriceItem label="Gold 24K" price={prices.gold24k.value} unit="10g" trend={prices.gold24k.trend} offset={0} />
                            <PriceItem label="Gold 22K" price={prices.gold22k.value} unit="10g" trend={prices.gold22k.trend} offset={1} />
                            <PriceItem label="Silver" price={prices.silver.value} unit="1kg" trend={prices.silver.trend} offset={2} />
                        </>
                    ) : (
                        <div className="text-xs text-muted-foreground animate-pulse">Fetching rates...</div>
                    )}
                </div>
            </div>
        </div>
    );
}
