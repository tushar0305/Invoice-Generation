'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';

export function GoldSilverTicker() {
    // Mock data with "live" updates
    const [prices, setPrices] = useState({
        gold24k: { value: 72500, trend: 'up' },
        gold22k: { value: 68500, trend: 'down' },
        silver: { value: 88000, trend: 'up' },
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setPrices(prev => ({
                gold24k: {
                    value: prev.gold24k.value + (Math.random() * 20 - 10),
                    trend: Math.random() > 0.5 ? 'up' : 'down'
                },
                gold22k: {
                    value: prev.gold22k.value + (Math.random() * 20 - 10),
                    trend: Math.random() > 0.5 ? 'up' : 'down'
                },
                silver: {
                    value: prev.silver.value + (Math.random() * 10 - 5),
                    trend: Math.random() > 0.5 ? 'up' : 'down'
                },
            }));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const PriceItem = ({ label, price, trend }: { label: string, price: number, trend: string }) => (
        <div className="flex items-center gap-3 px-4 py-2 bg-card/50 rounded-full border border-white/5 backdrop-blur-sm shadow-sm">
            <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
                <div className="flex items-center gap-1.5">
                    <AnimatePresence mode="popLayout">
                        <motion.span
                            key={price}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            className="font-mono font-bold text-sm"
                        >
                            ₹{price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        </motion.span>
                    </AnimatePresence>
                    {trend === 'up' ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full overflow-hidden py-2">
            <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar px-1">
                <div className="flex items-center gap-1 text-xs font-medium text-[#D4AF37] whitespace-nowrap">
                    <span className="relative flex h-2 w-2 mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]"></span>
                    </span>
                    LIVE RATES
                </div>
                <div className="flex items-center gap-3">
                    <PriceItem label="Gold 24K" price={prices.gold24k.value} trend={prices.gold24k.trend} />
                    <PriceItem label="Gold 22K" price={prices.gold22k.value} trend={prices.gold22k.trend} />
                    <PriceItem label="Silver" price={prices.silver.value} trend={prices.silver.trend} />
                </div>
            </div>
        </div>
    );
}
