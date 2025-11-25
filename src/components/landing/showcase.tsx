'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { useState } from 'react';

export function Showcase() {
    const [isDark, setIsDark] = useState(false);

    return (
        <motion.section
            id="showcase"
            animate={{
                backgroundColor: isDark
                    ? 'rgb(15 23 42)' // slate-900
                    : 'rgb(248 250 252)' // slate-50
            }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="py-32 relative overflow-hidden"
        >
            {/* Animated Background Effects */}
            <motion.div
                animate={{
                    opacity: isDark ? 0 : 1
                }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-gold-100/20 via-transparent to-transparent"
            />
            <motion.div
                animate={{
                    opacity: isDark ? 1 : 0
                }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"
            />

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-100/50 border border-gold-200/50 text-gold-700 text-sm font-semibold mb-4"
                    >
                        <span className="text-xl">✨</span>
                        <span>Available on All Devices</span>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        animate={{
                            color: isDark ? 'rgb(248 250 252)' : 'rgb(15 23 42)'
                        }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl md:text-5xl font-bold tracking-tight font-heading"
                    >
                        Designed for Modern Jewellers
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        animate={{
                            color: isDark ? 'rgb(203 213 225)' : 'rgb(71 85 105)'
                        }}
                        className="text-lg md:text-xl"
                    >
                        Experience an interface that's as elegant as the jewellery you sell. Seamlessly works on desktop, tablet, and mobile.
                    </motion.p>

                    {/* Magical Theme Toggle */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="pt-6 flex justify-center"
                    >
                        <motion.button
                            onClick={() => setIsDark(!isDark)}
                            className="group relative inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-slate-300/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {/* Animated background shimmer */}
                            <motion.div
                                animate={{
                                    x: ['-100%', '100%']
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "linear"
                                }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            />

                            <AnimatePresence mode="wait">
                                {isDark ? (
                                    <motion.div
                                        key="moon"
                                        initial={{ rotate: -90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: 90, opacity: 0 }}
                                        transition={{ duration: 0.4 }}
                                        className="relative z-10"
                                    >
                                        <Moon className="h-5 w-5 text-blue-400" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="sun"
                                        initial={{ rotate: 90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: -90, opacity: 0 }}
                                        transition={{ duration: 0.4 }}
                                        className="relative z-10"
                                    >
                                        <Sun className="h-5 w-5 text-amber-500" />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.span
                                animate={{
                                    color: isDark ? 'rgb(203 213 225)' : 'rgb(51 65 85)'
                                }}
                                className="font-semibold relative z-10"
                            >
                                {isDark ? 'Dark Mode' : 'Light Mode'}
                            </motion.span>

                            {/* Sparkle effect on toggle */}
                            <AnimatePresence>
                                {isDark && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        className="relative z-10"
                                    >
                                        <Sparkles className="h-4 w-4 text-blue-400" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    </motion.div>
                </div>

                {/* Mockup Container */}
                <div className="relative max-w-6xl mx-auto">
                    {/* Main Desktop Screen */}
                    <motion.div
                        initial={{ opacity: 0, y: 60 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative z-10"
                    >
                        <motion.div
                            animate={{
                                borderColor: isDark ? 'rgb(30 41 59)' : 'rgb(203 213 225)'
                            }}
                            className="rounded-2xl overflow-hidden border-8 shadow-2xl bg-white backdrop-blur-sm"
                        >
                            {/* Browser Chrome */}
                            <motion.div
                                animate={{
                                    backgroundColor: isDark ? 'rgb(30 41 59)' : 'rgb(241 245 249)',
                                    borderColor: isDark ? 'rgb(51 65 85)' : 'rgb(226 232 240)'
                                }}
                                className="absolute top-0 left-0 right-0 h-10 border-b flex items-center px-4 gap-2 z-10"
                            >
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <motion.div
                                    animate={{
                                        backgroundColor: isDark ? 'rgb(15 23 42)' : 'rgb(255 255 255)',
                                        color: isDark ? 'rgb(148 163 184)' : 'rgb(100 116 139)'
                                    }}
                                    className="ml-4 flex-1 rounded px-3 py-1 text-xs"
                                >
                                    swarnavyapar.in/dashboard
                                </motion.div>
                            </motion.div>

                            {/* Desktop Screenshot with smooth transition */}
                            <div className="pt-10 relative">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={isDark ? 'dark' : 'light'}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.05 }}
                                        transition={{ duration: 0.6, ease: "easeInOut" }}
                                    >
                                        <Image
                                            src={isDark ? "/screenshots/web_dashboard_dark.png" : "/screenshots/web_dash_light.png"}
                                            alt={`SwarnaVyapar Dashboard - ${isDark ? 'Dark' : 'Light'} Mode`}
                                            width={1920}
                                            height={1080}
                                            className="w-full h-auto"
                                            priority
                                        />
                                    </motion.div>
                                </AnimatePresence>

                                {/* Magical sparkle effect on transition */}
                                <AnimatePresence>
                                    {isDark && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: [0, 0.3, 0] }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 1.5 }}
                                            className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-transparent pointer-events-none"
                                        />
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Floating Mobile Screen - Left */}
                    <motion.div
                        initial={{ opacity: 0, x: -60, rotate: -5 }}
                        whileInView={{ opacity: 1, x: 0, rotate: -3 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                        whileHover={{ rotate: 0, scale: 1.05, transition: { duration: 0.3 } }}
                        className="absolute -bottom-16 -left-8 md:-left-16 w-48 md:w-64 z-20 hidden sm:block"
                    >
                        <div className="rounded-[2.5rem] border-[6px] border-slate-800 overflow-hidden shadow-2xl bg-slate-800 ring-4 ring-white">
                            {/* Phone Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-10" />
                            <div className="aspect-[9/19] relative">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={isDark ? 'dark-mobile' : 'light-mobile'}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <Image
                                            src={isDark ? "/screenshots/phone_dash_dark.png" : "/screenshots/phone_dash_light.png"}
                                            alt={`SwarnaVyapar Mobile App - ${isDark ? 'Dark' : 'Light'} Mode`}
                                            width={390}
                                            height={844}
                                            className="w-full h-full object-cover"
                                        />
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>

                    {/* Floating Tablet Screen - Right */}
                    <motion.div
                        initial={{ opacity: 0, x: 60, rotate: 5 }}
                        whileInView={{ opacity: 1, x: 0, rotate: 3 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                        whileHover={{ rotate: 0, scale: 1.05, transition: { duration: 0.3 } }}
                        className="absolute -bottom-24 -right-8 md:-right-16 w-64 md:w-96 z-20 hidden sm:block"
                    >
                        <div className="rounded-2xl border-4 border-slate-700 overflow-hidden shadow-2xl bg-slate-700 ring-4 ring-white">
                            <div className="aspect-[4/3] relative">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={isDark ? 'dark-tablet' : 'light-tablet'}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <Image
                                            src={isDark ? "/screenshots/tab_dash_dark.png" : "/screenshots/tab_light.png"}
                                            alt={`SwarnaVyapar Tablet POS - ${isDark ? 'Dark' : 'Light'} Mode`}
                                            width={1024}
                                            height={768}
                                            className="w-full h-full object-cover"
                                        />
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.section>
    );
}
