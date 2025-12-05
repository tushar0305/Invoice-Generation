'use client';

import { motion } from 'framer-motion';
import { Mic, Search, ArrowUp } from 'lucide-react';

export function AIShowcase() {
    return (
        <section id="ai-suite" className="py-24 relative bg-white dark:bg-[#080808] border-t border-black/5 dark:border-white/5 transition-colors duration-500">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
                <div className="md:w-1/2">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-block px-3 py-1 mb-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500 text-[10px] font-bold uppercase tracking-wider"
                    >
                        Powered by Swarna AI
                    </motion.div>
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-medium tracking-tight text-neutral-900 dark:text-white mb-6"
                    >
                        Your personal <br /><span className="font-serif italic text-amber-600">Business Analyst</span>
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-neutral-500 dark:text-neutral-400 mb-8 leading-relaxed"
                    >
                        Stop digging through complex reports. Just ask questions in plain English. Swarna AI analyzes your sales, stock, and customer data to give you instant answers.
                    </motion.p>
                    <div className="flex flex-col gap-4">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-white/5 border border-black/5 dark:border-white/5"
                        >
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-black flex items-center justify-center shadow-sm text-amber-600">
                                <Mic className="w-5 h-5" />
                            </div>
                            <div className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">"Show me top 5 customers this month"</div>
                        </motion.div>
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 }}
                            className="flex items-center gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-white/5 border border-black/5 dark:border-white/5"
                        >
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-black flex items-center justify-center shadow-sm text-amber-600">
                                <Search className="w-5 h-5" />
                            </div>
                            <div className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">"Which items are low on stock?"</div>
                        </motion.div>
                    </div>
                </div>

                <div className="md:w-1/2 relative">
                    {/* Abstract AI Visual */}
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-purple-500/20 blur-[60px] animate-pulse rounded-full"></div>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="relative bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-white/20 dark:border-white/10 p-6 rounded-2xl shadow-2xl"
                    >
                        {/* Chat Interface */}
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <div className="bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-white px-4 py-2 rounded-2xl rounded-tr-sm text-sm shadow-sm">
                                    How much did we sell in 22K Gold today?
                                </div>
                            </div>
                            <div className="flex justify-start items-end gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg flex-shrink-0"></div>
                                <div className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/10 dark:to-neutral-900 border border-amber-100 dark:border-amber-500/20 text-neutral-800 dark:text-white px-5 py-4 rounded-2xl rounded-tl-sm text-sm shadow-sm w-full">
                                    <p className="mb-2">Total sales for 22K Gold today: <strong className="text-amber-600">₹4,25,000</strong></p>
                                    <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            whileInView={{ width: "70%" }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 1, delay: 0.5 }}
                                            className="h-full bg-amber-500"
                                        ></motion.div>
                                    </div>
                                    <p className="text-[10px] text-neutral-400 mt-2">15% higher than yesterday.</p>
                                </div>
                            </div>
                        </div>
                        {/* Input */}
                        <div className="mt-6 relative">
                            <input type="text" placeholder="Ask Swarna AI..." className="w-full bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-white/10 rounded-full py-3 px-5 text-sm focus:ring-2 focus:ring-amber-500/50 outline-none text-neutral-900 dark:text-white placeholder:text-neutral-400" />
                            <button className="absolute right-2 top-2 w-8 h-8 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform">
                                <ArrowUp className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
