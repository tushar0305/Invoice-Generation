'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Sparkles, Bot, Mic } from 'lucide-react';
import Link from 'next/link';

export function HeroSection() {
    return (
        <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-white">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-gold-100/40 via-white to-white" />
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid-pattern.svg')] opacity-[0.03]" />

            {/* Animated Floating Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/4 left-10 md:left-20 p-4 bg-white rounded-2xl shadow-xl border border-black/5 hidden lg:block"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Bot className="h-6 w-6" /></div>
                        <div>
                            <p className="text-xs text-muted-foreground">AI Assistant</p>
                            <p className="text-sm font-bold">"Gold rate is up 2%"</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-1/3 right-10 md:right-20 p-4 bg-white rounded-2xl shadow-xl border border-black/5 hidden lg:block"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Mic className="h-6 w-6" /></div>
                        <div>
                            <p className="text-xs text-muted-foreground">Voice Invoice</p>
                            <p className="text-sm font-bold">"Add 22k Ring..."</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="container px-4 md:px-6 relative z-10">
                <div className="flex flex-col items-center text-center space-y-8 max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/5 border border-black/5 text-black/70 text-sm font-medium backdrop-blur-sm"
                    >
                        <Sparkles className="h-3.5 w-3.5 text-gold-600" />
                        <span>Now with AI Voice Invoicing & Chatbot</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 font-heading"
                    >
                        Smart Management for <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 animate-shimmer bg-[length:200%_100%]">
                            Modern Jewellers
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light"
                    >
                        Run your entire jewellery shop with AI. Talk to your business, create invoices with voice, and manage inventory effortlessly.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center gap-4 pt-4"
                    >
                        <Link href="/signup">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-gold-400 via-pink-500 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                                <Button size="lg" className="relative h-14 px-8 bg-black text-white hover:bg-black/90 shadow-2xl shadow-black/20 rounded-full text-lg font-semibold transition-all hover:scale-105">
                                    Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </div>
                        </Link>
                        <Button size="lg" variant="outline" className="h-14 px-8 rounded-full border-black/10 hover:bg-black/5 text-lg text-black backdrop-blur-sm transition-all hover:scale-105 hover:border-gold-400/50">
                            <Play className="mr-2 h-4 w-4 fill-current" /> See AI in Action
                        </Button>
                    </motion.div>
                </div>
            </div>

            {/* Decorative Glows with 3D Hover Effect */}
            <motion.div
                className="absolute top-1/4 -left-64 w-96 h-96 bg-gold-200/30 rounded-full blur-[128px] -z-10 mix-blend-multiply"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
            <motion.div
                className="absolute bottom-0 -right-64 w-96 h-96 bg-blue-200/20 rounded-full blur-[128px] -z-10 mix-blend-multiply"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                }}
            />
        </section>
    );
}
