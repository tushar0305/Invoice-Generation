'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export function Showcase() {
    return (
        <section id="showcase" className="py-24 relative overflow-hidden bg-slate-50">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 font-heading">
                        Designed for Modern Jewellers
                    </h2>
                    <p className="text-lg text-slate-600">
                        Experience an interface that's as elegant as the jewellery you sell.
                    </p>
                </div>

                {/* Mockup Container */}
                <div className="relative max-w-5xl mx-auto">
                    {/* Main Desktop Screen */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative z-10 rounded-xl overflow-hidden border border-slate-200 shadow-2xl bg-white"
                    >
                        <div className="absolute top-0 left-0 right-0 h-8 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400" />
                            <div className="w-3 h-3 rounded-full bg-yellow-400" />
                            <div className="w-3 h-3 rounded-full bg-green-400" />
                        </div>

                        {/* Placeholder for Dashboard Screenshot */}
                        <div className="pt-8 aspect-[16/9] bg-slate-50 relative flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-6xl mb-4">💎</div>
                                <p className="text-slate-400 font-medium">Dashboard Interface</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Floating Mobile Screen - Left */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="absolute -bottom-12 -left-12 w-64 z-20 hidden md:block"
                    >
                        <div className="rounded-[2rem] border-4 border-white overflow-hidden shadow-2xl bg-white ring-1 ring-black/5">
                            <div className="aspect-[9/19] bg-slate-50 relative flex items-center justify-center">
                                <p className="text-slate-400 text-sm">Mobile App</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Floating Tablet Screen - Right */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="absolute -bottom-24 -right-12 w-80 z-0 hidden md:block"
                    >
                        <div className="rounded-xl border border-white overflow-hidden shadow-2xl bg-white ring-1 ring-black/5">
                            <div className="aspect-[4/3] bg-slate-50 relative flex items-center justify-center">
                                <p className="text-slate-400 text-sm">Tablet POS</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
