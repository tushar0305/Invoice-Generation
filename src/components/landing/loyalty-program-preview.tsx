'use client';

import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Crown, Sparkles, TrendingUp, Gift, Award, MousePointer2, CheckCircle2 } from 'lucide-react';

export function LoyaltyProgramPreview() {
    const [points, setPoints] = useState(2450);
    const [recentActivity, setRecentActivity] = useState([
        { type: 'earn', label: 'Purchase Reward', detail: '22k Gold Ring - 12g', points: '+250', color: 'green' }
    ]);
    const [showCoupon, setShowCoupon] = useState(false);
    const cursorControls = useAnimation();

    useEffect(() => {
        let mounted = true;

        const sequence = async () => {
            // Wait for component to fully mount before starting animations
            await new Promise(r => setTimeout(r, 100));
            if (!mounted) return;

            // Initial State
            setPoints(2450);
            setRecentActivity([
                { type: 'earn', label: 'Purchase Reward', detail: '22k Gold Ring - 12g', points: '+250', color: 'green' }
            ]);
            setShowCoupon(false);

            while (mounted) {
                // 1. Initial wait
                if (!mounted) break;
                await cursorControls.start({ x: 0, y: 0, opacity: 0, transition: { duration: 0 } });
                await new Promise(r => setTimeout(r, 1500));

                if (!mounted) break;

                // 2. Simulate "New Purchase" event
                setPoints(prev => prev + 500);
                setRecentActivity(prev => [
                    { type: 'earn', label: 'Big Purchase', detail: 'Diamond Necklace', points: '+500', color: 'green' },
                    ...prev
                ]);
                await new Promise(r => setTimeout(r, 1000));

                if (!mounted) break;

                // 3. Cursor moves to "Redeem" button
                await cursorControls.start({ opacity: 1, transition: { duration: 0.5 } });
                await cursorControls.start({ x: 380, y: 160, transition: { duration: 1.5, ease: "easeInOut" } });

                if (!mounted) break;

                // 4. Click "Redeem"
                await cursorControls.start({ scale: 0.9, transition: { duration: 0.1 } });
                if (window.navigator.vibrate) window.navigator.vibrate(20);
                await cursorControls.start({ scale: 1, transition: { duration: 0.1 } });

                if (!mounted) break;

                setShowCoupon(true);
                if (!mounted) break;
                setPoints(prev => prev - 500);
                setRecentActivity(prev => [
                    { type: 'redeem', label: 'Points Redeemed', detail: 'Gold Coin Coupon', points: '-500', color: 'rose' },
                    ...prev
                ]);

                await new Promise(r => setTimeout(r, 2000));

                if (!mounted) break;

                // 5. Reset loop
                await cursorControls.start({ opacity: 0, transition: { duration: 0.5 } });
                await new Promise(r => setTimeout(r, 2000));

                if (!mounted) break;

                // Reset State
                setPoints(2450);
                setRecentActivity([
                    { type: 'earn', label: 'Purchase Reward', detail: '22k Gold Ring - 12g', points: '+250', color: 'green' }
                ]);
                setShowCoupon(false);
            }
        };

        sequence();

        return () => { mounted = false; };
    }, [cursorControls]);

    return (
        <div className="relative w-full max-w-md mx-auto aspect-[4/5] md:aspect-auto md:h-auto">
            {/* Main Card */}
            <div className="relative z-10 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform hover:scale-[1.02] transition-transform duration-500">
                {/* Card Header - Premium Dark */}
                <div className="bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 p-8 text-white relative overflow-hidden">
                    {/* Decorative Pattern */}
                    <div className="absolute inset-0 opacity-5">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-400 rounded-full translate-x-1/2 -translate-y-1/2" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold-400 rounded-full -translate-x-1/2 translate-y-1/2" />
                    </div>

                    <div className="relative">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Crown className="w-5 h-5 text-gold-400" />
                                    <span className="text-gold-400 text-sm font-semibold">GOLD MEMBER</span>
                                </div>
                                <h3 className="text-3xl font-bold font-heading">Priya Sharma</h3>
                            </div>
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-amber-500 flex items-center justify-center shadow-lg relative">
                                <Sparkles className="w-8 h-8 text-white" />
                                <AnimatePresence>
                                    {showCoupon && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center"
                                        >
                                            <CheckCircle2 className="w-3 h-3 text-white" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Available Points</p>
                                <div className="flex items-baseline gap-2">
                                    <motion.span
                                        key={points}
                                        initial={{ scale: 1.2, color: '#fbbf24' }}
                                        animate={{ scale: 1, color: '#facc15' }}
                                        className="text-5xl font-bold font-mono tracking-tight text-gold-400"
                                    >
                                        {points.toLocaleString()}
                                    </motion.span>
                                    <span className="text-sm font-medium text-white/60">pts</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <button className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-lg backdrop-blur-md border border-white/20 transition-colors">
                                    Redeem Points
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="p-6 bg-white space-y-4 h-[320px]">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-900">Recent Activity</h4>
                        <span className="text-xs text-gold-600 font-medium">View All</span>
                    </div>

                    <div className="space-y-3">
                        <AnimatePresence initial={false}>
                            {recentActivity.map((tx, i) => (
                                <motion.div
                                    key={`${tx.label}-${i}`} // Ensure unique key for animation
                                    initial={{ opacity: 0, height: 0, y: -20 }}
                                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors overflow-hidden"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-11 h-11 rounded-full flex items-center justify-center shrink-0",
                                            tx.color === 'green' && "bg-green-100 text-green-600",
                                            tx.color === 'rose' && "bg-rose-100 text-rose-600",
                                            tx.color === 'blue' && "bg-blue-100 text-blue-600"
                                        )}>
                                            {tx.type === 'earn' && <TrendingUp className="w-5 h-5" />}
                                            {tx.type === 'redeem' && <Gift className="w-5 h-5" />}
                                            {tx.type === 'upgrade' && <Award className="w-5 h-5" />}
                                        </div>
                                        <div className="text-left">
                                            <p className="font-semibold text-gray-900 text-sm">{tx.label}</p>
                                            <p className="text-xs text-gray-500">{tx.detail}</p>
                                        </div>
                                    </div>
                                    <span className={cn(
                                        "font-bold text-sm",
                                        tx.color === 'green' && "text-green-600",
                                        tx.color === 'rose' && "text-rose-600",
                                        tx.color === 'blue' && "text-blue-600"
                                    )}>{tx.points}</span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Fake Coupon Popover */}
                    <AnimatePresence>
                        {showCoupon && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute bottom-4 left-4 right-4 bg-gray-900 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between z-20"
                            >
                                <div className="flex items-center gap-3">
                                    <Gift className="text-gold-400 w-6 h-6" />
                                    <div>
                                        <p className="font-bold text-sm">Coupon Generated!</p>
                                        <p className="text-xs text-gray-400">Code: GOLD500 applied</p>
                                    </div>
                                </div>
                                <button className="text-xs bg-white text-black px-3 py-1.5 rounded-lg font-bold">
                                    View
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Simulated Cursor */}
            <motion.div
                animate={cursorControls}
                className="absolute top-0 left-0 z-50 pointer-events-none drop-shadow-xl"
            >
                <MousePointer2 className="h-6 w-6 text-black fill-white drop-shadow-md transform -rotate-12" />
            </motion.div>
        </div>
    );
}
