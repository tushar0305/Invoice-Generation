'use client';

import { motion } from 'framer-motion';
import { Sparkles, Users, Heart, TrendingUp, Bell } from 'lucide-react';

export function Testimonials() {
    return (
        <section id="testimonials" className="py-32 relative bg-gradient-to-b from-white via-slate-50 to-white overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.02]" />
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-gold-200/20 to-transparent rounded-full blur-3xl"
            />
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    rotate: [360, 180, 0]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-transparent rounded-full blur-3xl"
            />

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16 max-w-4xl mx-auto"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-gold-100/60 to-amber-100/60 border border-gold-200 text-gold-700 text-sm font-semibold mb-8"
                    >
                        <Bell className="h-4 w-4" />
                        <span>Join the Waitlist</span>
                    </motion.div>

                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-slate-900 font-heading leading-tight">
                        Soon, You'll Join{' '}
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-gold-600 via-amber-500 to-gold-600 animate-shimmer bg-[length:200%_100%]">
                            India's Best
                        </span>
                    </h2>
                    <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
                        We're preparing to revolutionize jewellery business management. Be ready to experience what modern software should feel like.
                    </p>
                </motion.div>

                {/* Value Props Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className="relative p-8 rounded-3xl bg-white border-2 border-slate-100 shadow-xl hover:shadow-2xl transition-all group overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Users className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                                Built for Jewellers
                            </h3>
                            <p className="text-slate-600 leading-relaxed">
                                Designed specifically for Indian jewellery businesses after months of research and conversations with industry experts.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className="relative p-8 rounded-3xl bg-white border-2 border-slate-100 shadow-xl hover:shadow-2xl transition-all group overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-gold-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-50 to-amber-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Heart className="h-8 w-8 text-gold-600 fill-gold-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-gold-600 transition-colors">
                                Made with Love
                            </h3>
                            <p className="text-slate-600 leading-relaxed">
                                Every feature, every pixel, every interaction has been carefully crafted to make your daily work effortless and joyful.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className="relative p-8 rounded-3xl bg-white border-2 border-slate-100 shadow-xl hover:shadow-2xl transition-all group overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <TrendingUp className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-green-600 transition-colors">
                                Constantly Improving
                            </h3>
                            <p className="text-slate-600 leading-relaxed">
                                We're committed to continuous innovation. Your feedback will shape the future of jewellery management software.
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* CTA Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="relative p-12 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white text-center overflow-hidden shadow-2xl">
                        {/* Animated background pattern */}
                        <motion.div
                            animate={{
                                backgroundPosition: ['0% 0%', '100% 100%']
                            }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 opacity-10"
                            style={{
                                backgroundImage: 'url("/grid-pattern.svg")',
                                backgroundSize: '30px 30px'
                            }}
                        />

                        <div className="relative z-10">
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="text-6xl mb-6"
                            >
                                ✨
                            </motion.div>

                            <h3 className="text-3xl md:text-4xl font-bold mb-4">
                                Real Reviews Are Coming Soon
                            </h3>
                            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
                                When we launch, you'll hear directly from jewellers who've experienced the transformation. Until then, we're perfecting every detail.
                            </p>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-gold-500 to-amber-500 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all"
                            >
                                <Sparkles className="h-5 w-5" />
                                <span>Get Early Access</span>
                            </motion.button>

                            <p className="text-sm text-slate-400 mt-6">
                                Join the waitlist • No credit card required • Free trial for early adopters
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
