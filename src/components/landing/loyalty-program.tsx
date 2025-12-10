'use client';

import { motion } from 'framer-motion';
import { Crown, Gift, TrendingUp, Star, ArrowRight, ShieldCheck, Gem, Sparkles, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const benefits = [
    {
        icon: Gem,
        title: 'Earn Points on Purchases',
        description: 'Auto-calculate points for gold, silver, and diamond purchases. Totally customizable rates.',
        color: 'text-amber-500',
        bg: 'bg-gradient-to-br from-amber-400/20 to-orange-500/10'
    },
    {
        icon: Crown,
        title: 'Tiered Membership',
        description: 'Create Gold, Platinum, and Solitaire tiers. Reward your most valuable customers automatically.',
        color: 'text-gold-600',
        bg: 'bg-gradient-to-br from-gold-400/20 to-amber-500/10'
    },
    {
        icon: Gift,
        title: 'Seamless Redemption',
        description: 'Redeem points directly on the invoice. No complex calculations or manual tracking needed.',
        color: 'text-rose-500',
        bg: 'bg-gradient-to-br from-rose-400/20 to-pink-500/10'
    }
];

const transactions = [
    { type: 'earn', label: 'Purchase Reward', detail: '22k Gold Ring - 12g', points: '+250', color: 'green' },
    { type: 'redeem', label: 'Points Redeemed', detail: 'Silver Coin Gift', points: '-500', color: 'rose' },
    { type: 'upgrade', label: 'Tier Upgrade', detail: 'Silver → Gold', points: '🎉', color: 'blue' },
];

export function LoyaltyProgram() {
    return (
        <section className="py-32 relative overflow-hidden bg-gradient-to-b from-white via-gold-50/30 to-white">
            {/* Background Decor */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-gold-400/10 rounded-full blur-3xl" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-3xl" />
            </div>

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

                    {/* Left Side: Content */}
                    <div className="flex-1 text-center lg:text-left space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            viewport={{ once: true }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-gold-100 to-amber-100 border border-gold-200 text-gold-700 text-sm font-semibold mb-6">
                                <Star className="w-4 h-4 fill-current" />
                                <span>Customer Retention Engine</span>
                            </div>
                            <h2 className="text-4xl md:text-6xl font-heading font-bold text-gray-900 leading-[1.1] mb-6">
                                Turn One-Time Buyers into <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-600 to-amber-500">Lifetime Patrons</span>
                            </h2>
                            <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                In the jewellery business, trust is everything. Build lasting relationships with a fully automated loyalty program that keeps customers coming back for generations.
                            </p>
                        </motion.div>

                        <motion.div
                            className="space-y-5"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            viewport={{ once: true }}
                        >
                            {benefits.map((benefit, index) => (
                                <div
                                    key={index}
                                    className="group flex items-start gap-4 p-5 rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300"
                                >
                                    <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300", benefit.bg, benefit.color)}>
                                        <benefit.icon className="w-7 h-7" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-heading font-bold text-lg text-gray-900 mb-1 group-hover:text-gold-700 transition-colors">{benefit.title}</h3>
                                        <p className="text-gray-600 text-sm leading-relaxed">{benefit.description}</p>
                                    </div>
                                </div>
                            ))}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            viewport={{ once: true }}
                            className="pt-4"
                        >
                            <Button size="lg" className="h-14 px-8 bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-600 hover:to-amber-600 text-white rounded-full shadow-xl shadow-gold-500/30 group" asChild>
                                <Link href="/auth/register">
                                    Start Loyalty Program <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                        </motion.div>
                    </div>

                    {/* Right Side: Premium Card Visual */}
                    <div className="flex-1 w-full max-w-lg lg:max-w-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.7 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
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
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-amber-500 flex items-center justify-center shadow-lg">
                                                <Sparkles className="w-8 h-8 text-white" />
                                            </div>
                                        </div>

                                        <div className="flex items-end justify-between">
                                            <div>
                                                <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Available Points</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-5xl font-bold font-mono tracking-tight text-gold-400">2,450</span>
                                                    <span className="text-sm font-medium text-white/60">pts</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-white/50 text-xs">Member Since</p>
                                                <p className="text-white font-medium">Jan 2023</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Transaction History */}
                                <div className="p-6 bg-white space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-bold text-gray-900">Recent Activity</h4>
                                        <span className="text-xs text-gold-600 font-medium">View All</span>
                                    </div>

                                    {transactions.map((tx, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.1 * i }}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-11 h-11 rounded-full flex items-center justify-center",
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

                                    {/* Progress Bar */}
                                    <div className="pt-4 border-t border-gray-100 mt-4">
                                        <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
                                            <span>Gold Tier</span>
                                            <span>750 pts to Platinum</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                            <div className="bg-gradient-to-r from-gold-400 to-amber-500 h-full w-[75%] rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Badge */}
                            <motion.div
                                className="absolute -top-8 -right-8 bg-white p-5 rounded-2xl shadow-2xl z-20 hidden md:flex items-center gap-4 border border-slate-100"
                                animate={{ y: [0, -8, 0] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            >
                                <div className="w-14 h-14 bg-gradient-to-br from-gold-400 to-amber-500 rounded-full flex items-center justify-center text-white shadow-lg">
                                    <Gift className="w-7 h-7" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-gray-900 text-lg">FREE Gift!</p>
                                    <p className="text-xs text-gray-500">Silver Coin Redeemed</p>
                                </div>
                            </motion.div>

                            {/* Background Shadow */}
                            <div className="absolute -bottom-4 -left-4 -z-10 w-full h-full bg-gradient-to-br from-gold-200 to-amber-200 rounded-3xl opacity-30 transform rotate-2" />
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
