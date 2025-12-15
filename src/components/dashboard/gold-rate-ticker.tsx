'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function GoldRateTicker() {
    const [rates, setRates] = useState({
        gold24k: 72500,
        gold22k: 66450,
        silver: 88000,
    });

    // Mock live updates for demo feel
    useEffect(() => {
        const interval = setInterval(() => {
            setRates(prev => ({
                gold24k: prev.gold24k + (Math.random() > 0.5 ? 10 : -10),
                gold22k: prev.gold22k + (Math.random() > 0.5 ? 10 : -10),
                silver: prev.silver + (Math.random() > 0.5 ? 5 : -5),
            }));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full bg-[#0c0a09] text-[#D4AF37] overflow-hidden py-1.5 border-b border-[#D4AF37]/20">
            <div className="animate-marquee whitespace-nowrap flex items-center gap-8 text-xs font-medium tracking-wide">
                <span className="flex items-center gap-1">
                    GOLD 24K: ₹{rates.gold24k.toLocaleString()} <TrendingUp className="w-3 h-3 text-green-500" />
                </span>
                <span className="flex items-center gap-1">
                    GOLD 22K: ₹{rates.gold22k.toLocaleString()} <TrendingDown className="w-3 h-3 text-red-500" />
                </span>
                <span className="flex items-center gap-1">
                    SILVER: ₹{rates.silver.toLocaleString()} <Minus className="w-3 h-3 text-gray-500" />
                </span>
                {/* Duplicate for seamless loop */}
                <span className="flex items-center gap-1 opacity-50">|</span>
                <span className="flex items-center gap-1">
                    GOLD 24K: ₹{rates.gold24k.toLocaleString()} <TrendingUp className="w-3 h-3 text-green-500" />
                </span>
                <span className="flex items-center gap-1">
                    GOLD 22K: ₹{rates.gold22k.toLocaleString()} <TrendingDown className="w-3 h-3 text-red-500" />
                </span>
                <span className="flex items-center gap-1">
                    SILVER: ₹{rates.silver.toLocaleString()} <Minus className="w-3 h-3 text-gray-500" />
                </span>
            </div>
        </div>
    );
}
