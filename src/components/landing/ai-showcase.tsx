'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Bot, Mic, Send, Sparkles, BarChart3, Play, TrendingUp, MessageCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';

export function AIShowcase() {
    const sectionRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

    return (
        <section ref={sectionRef} id="ai-features" className="py-16 md:py-32 bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden scroll-mt-20" aria-labelledby="ai-features-heading">
            {/* Enhanced Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,_var(--tw-gradient-stops))] from-purple-100/30 via-transparent to-transparent" />

            {/* Floating Grid Pattern */}
            <motion.div
                style={{ y }}
                className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.02]"
            />

            {/* Animated Sparkles */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-20 right-20 text-gold-400/20"
            >
                <Sparkles className="h-32 w-32" />
            </motion.div>
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    rotate: [360, 180, 0]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-20 left-20 text-blue-400/20"
            >
                <Zap className="h-24 w-24" />
            </motion.div>

            <div className="container px-4 md:px-6 relative z-10 mx-auto">
                <motion.div
                    style={{ opacity }}
                    className="text-center max-w-4xl mx-auto mb-20 flex flex-col items-center"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-blue-700 text-sm font-semibold mb-6 backdrop-blur-sm"
                    >
                        <Bot className="h-4 w-4" />
                        <span>Powered by Advanced AI</span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-slate-900 font-heading text-center"
                    >
                        Your Personal Business{' '}
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 animate-shimmer bg-[length:200%_100%]">
                            AI Assistant
                        </span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg md:text-xl text-slate-600 leading-relaxed text-center max-w-3xl"
                    >
                        Chat with your business in plain language. Get instant insights, create invoices by voice, and make data-driven decisions — all powered by cutting-edge AI.
                    </motion.p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center max-w-7xl mx-auto">
                    {/* Feature 1: AI Chatbot */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-3xl -z-10 blur-2xl" />
                        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8 relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                                    <Bot className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900">Swarna AI</h3>
                                    <p className="text-xs text-green-500 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Online
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-end">
                                    <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-tr-sm text-sm max-w-[80%]">
                                        How much gold did we sell today?
                                    </div>
                                </div>
                                <div className="flex justify-start">
                                    <div className="bg-slate-100 text-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm text-sm max-w-[90%] shadow-sm">
                                        <p className="mb-2">Here's your update for today:</p>
                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                            <div className="bg-white p-2 rounded border border-slate-200">
                                                <p className="text-xs text-slate-500">Gold Sales</p>
                                                <p className="font-bold text-slate-900">125g</p>
                                            </div>
                                            <div className="bg-white p-2 rounded border border-slate-200">
                                                <p className="text-xs text-slate-500">Revenue</p>
                                                <p className="font-bold text-slate-900">₹8.5L</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500">📈 15% higher than yesterday!</p>
                                    </div>
                                </div>
                            </div>

                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Ask anything about your business..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    readOnly
                                />
                                <button
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 rounded-full text-white"
                                    aria-label="Send message"
                                >
                                    <Send className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Feature 1 Text */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="space-y-6"
                    >
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                            <Bot className="h-6 w-6" />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900">Instant Business Insights</h3>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            No need to dig through complex reports. Just ask Swarna AI in plain English (or Hinglish) to get real-time stats on sales, stock, and staff performance.
                        </p>
                        <ul className="space-y-3">
                            {['"Show me top selling items"', '"Which customers have birthdays today?"', '"What is my current stock value?"'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-700 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    <span className="italic">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Feature 2 Text */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="space-y-6 order-4 lg:order-3"
                    >
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 mb-4">
                            <Mic className="h-6 w-6" />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900">Voice-Powered Invoicing</h3>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            Create bills 3x faster without typing. Just speak the item details, and our AI fills the form automatically. Perfect for busy counters.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <Button variant="outline" className="rounded-full border-purple-200 text-purple-700 hover:bg-purple-50">
                                <Play className="mr-2 h-4 w-4" /> Watch Demo
                            </Button>
                        </div>
                    </motion.div>

                    {/* Feature 2: Voice Demo */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="relative order-3 lg:order-4"
                    >
                        <div className="absolute inset-0 bg-gradient-to-bl from-purple-500/5 to-pink-500/5 rounded-3xl -z-10 blur-2xl" />
                        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping" />
                                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white shadow-lg relative z-10">
                                    <Mic className="h-8 w-8" />
                                </div>
                            </div>

                            <div className="space-y-2 mb-6">
                                <p className="text-sm font-medium text-purple-600 uppercase tracking-wider">Listening...</p>
                                <h4 className="text-xl font-medium text-slate-900">"Add 2 Gold Bangles, 22 Karat, 25 grams"</h4>
                            </div>

                            <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-100 text-left">
                                <div className="flex justify-between text-xs text-slate-500 mb-2">
                                    <span>Item</span>
                                    <span>Weight</span>
                                </div>
                                <div className="flex justify-between font-medium text-slate-900">
                                    <span>Gold Bangle (22K)</span>
                                    <span>25.000 g</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
