'use client';

import { motion } from 'framer-motion';
import { Sparkles, Zap, Shield, Smartphone, BarChart3, Users, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
    className?: string;
    children: React.ReactNode;
}

const FeatureCard = ({ className, children }: FeatureCardProps) => (
    <div className={cn(
        "relative overflow-hidden rounded-3xl p-8 transition-all duration-300 group",
        "bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10",
        "hover:shadow-2xl hover:shadow-gold-500/10 hover:-translate-y-1",
        className
    )}>
        {/* Spotlight Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-[radial-gradient(600px_at_var(--mouse-x)_var(--mouse-y),rgba(212,175,55,0.06),transparent_80%)]" />
        {children}
    </div>
);

export function Features() {
    return (
        <section id="features" className="py-24 relative overflow-hidden bg-slate-50 dark:bg-black">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-gold-400/5 blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[100px]" />
            </div>

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="text-center max-w-4xl mx-auto mb-20 relative">
                    {/* Glow Effect behind text */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gold-400/10 dark:bg-gold-500/5 blur-[80px] rounded-full pointer-events-none" />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 dark:bg-white/5 border border-gold-200/50 dark:border-white/10 text-gold-700 dark:text-gold-400 text-xs font-bold uppercase tracking-widest mb-8 backdrop-blur-md shadow-lg shadow-gold-500/5"
                    >
                        <Sparkles className="w-3.5 h-3.5 fill-gold-500/50 animate-pulse" />
                        <span>Everything You Need</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="relative text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 font-heading leading-[1.1] sm:leading-[1.1]"
                    >
                        Run Your <br className="hidden sm:block" /> Jewellery Business<br />
                        <span className="relative whitespace-nowrap">
                            <span className="absolute -inset-1 bg-gradient-to-r from-gold-400/20 to-amber-500/20 blur-xl"></span>
                            <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-gold-500 via-amber-400 to-gold-600 animate-shimmer bg-[length:200%_auto]">
                                Like a Pro
                            </span>
                        </span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
                    >
                        Powerful billing, real-time stock tracking, and AI-driven growth tools—wrapped in an interface designed for modern jewellers.
                    </motion.p>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 max-w-7xl mx-auto auto-rows-[minmax(180px,auto)]">

                    {/* Large Feature 1: Billing (Span 8) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="md:col-span-12 lg:col-span-8"
                    >
                        <FeatureCard className="h-full flex flex-col md:flex-row gap-8 items-center">
                            <div className="flex-1 space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-gold-100 dark:bg-gold-500/20 flex items-center justify-center">
                                    <Receipt className="w-6 h-6 text-gold-600 dark:text-gold-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Smart GST Billing</h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Create HUID-compliant invoices in seconds. Automatic tax calculation, instant PDF generation, and direct WhatsApp sharing.
                                </p>
                            </div>
                            <div className="flex-1 w-full relative min-h-[200px] bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 overflow-hidden shadow-inner">
                                {/* Mock UI Element */}
                                <div className="absolute top-4 left-4 right-4 bg-white dark:bg-slate-900 rounded-xl shadow-lg p-4 space-y-3">
                                    <div className="h-2 w-1/3 bg-slate-200 dark:bg-slate-700 rounded" />
                                    <div className="space-y-2">
                                        <div className="h-8 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700" />
                                        <div className="h-8 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700" />
                                    </div>
                                </div>
                            </div>
                        </FeatureCard>
                    </motion.div>

                    {/* Feature 2: Stock (Span 4) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="md:col-span-6 lg:col-span-4"
                    >
                        <FeatureCard className="h-full">
                            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center mb-6">
                                <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Live Stock Tracking</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                                Track every gram of Gold, Silver, and Diamond. Get low stock alerts and detailed purity reports.
                            </p>
                        </FeatureCard>
                    </motion.div>

                    {/* Feature 3: Mobile (Span 4) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="md:col-span-6 lg:col-span-4"
                    >
                        <FeatureCard className="h-full bg-gradient-to-br from-slate-900 to-slate-800 border-none text-white">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                                <Smartphone className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Mobile First</h3>
                            <p className="text-slate-300 text-sm">
                                Run your shop from anywhere. Works perfectly on phones, tablets, and desktops.
                            </p>
                        </FeatureCard>
                    </motion.div>

                    {/* Feature 4: CRM (Span 4) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 }}
                        className="md:col-span-6 lg:col-span-4"
                    >
                        <FeatureCard className="h-full">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mb-6">
                                <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Loyalty & CRM</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                                Built-in Udhaar Khata and customer loyalty profiles to keep them coming back.
                            </p>
                        </FeatureCard>
                    </motion.div>

                    {/* Feature 5: Security (Span 4) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.6 }}
                        className="md:col-span-6 lg:col-span-4"
                    >
                        <FeatureCard className="h-full">
                            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center mb-6">
                                <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Bank-Grade Security</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                                Daily auto-backups and military-grade encryption to keep your business data safe.
                            </p>
                        </FeatureCard>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
