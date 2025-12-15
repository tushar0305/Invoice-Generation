'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Sparkles, Star } from 'lucide-react';
import { useCallback } from 'react';
import { HeroDashboardPreview } from './hero-dashboard-preview';
import { HeroBackground } from './hero-background';

export function HeroSection() {
    const shouldReduceMotion = useReducedMotion();

    const handleSmoothScroll = useCallback((e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
        e.preventDefault();
        const element = document.querySelector(targetId);
        if (element) {
            const navHeight = 80;
            const elementPosition = element.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({ top: elementPosition - navHeight, behavior: 'smooth' });
        }
    }, []);

    const fadeInUp = {
        initial: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
        animate: { opacity: 1, y: 0 },
    };

    return (
        <section
            className="relative z-0 min-h-screen flex items-center justify-center pt-20 md:pt-24 pb-12 overflow-hidden"
            aria-labelledby="hero-heading"
        >
            {/* Animated Background */}
            <HeroBackground />

            <div className="container px-4 md:px-6 relative z-10">
                <div className="flex flex-col items-center text-center space-y-6 md:space-y-8 max-w-5xl mx-auto">
                    {/* Badge */}
                    <motion.div
                        {...fadeInUp}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs md:text-sm font-medium"
                        role="status"
                    >
                        <Sparkles className="h-3 w-3 md:h-3.5 md:w-3.5 text-gold-600" aria-hidden="true" />
                        <span>Now with AI Voice Invoicing & Chatbot</span>
                    </motion.div>

                    {/* Main Heading - Semantic H1 */}
                    <motion.h1
                        id="hero-heading"
                        {...fadeInUp}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 font-heading leading-tight"
                    >
                        Smart Management for{' '}
                        <br className="hidden sm:block" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 animate-shimmer bg-[length:200%_100%]">
                            Modern Jewellers
                        </span>
                    </motion.h1>

                    {/* Description */}
                    <motion.p
                        {...fadeInUp}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-light px-2"
                    >
                        Run your entire jewellery shop with AI. Talk to your business, create invoices with voice, and manage inventory effortlessly.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        {...fadeInUp}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 pt-4 w-full sm:w-auto px-4 sm:px-0"
                    >
                        <a
                            href="#pricing"
                            onClick={(e) => handleSmoothScroll(e, '#pricing')}
                            className="w-full sm:w-auto group"
                        >
                            <div className="relative">
                                <div
                                    className="absolute -inset-1 bg-gradient-to-r from-gold-400 via-pink-500 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-500"
                                    aria-hidden="true"
                                />
                                <Button
                                    size="lg"
                                    className="relative w-full sm:w-auto min-h-[48px] md:min-h-[56px] px-6 md:px-8 bg-slate-900 text-white hover:bg-slate-800 shadow-2xl shadow-slate-900/20 rounded-full text-base md:text-lg font-semibold transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
                                >
                                    Get Started Free
                                    <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
                                </Button>
                            </div>
                        </a>
                        <Button
                            size="lg"
                            variant="outline"
                            className="w-full sm:w-auto min-h-[48px] md:min-h-[56px] px-6 md:px-8 rounded-full border-2 border-slate-300 bg-white hover:bg-slate-50 text-base md:text-lg text-slate-900 font-semibold transition-all hover:scale-105 hover:border-gold-400 focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
                            aria-label="Watch demo video showing AI features in action"
                        >
                            <Play className="mr-2 h-4 w-4 fill-current" aria-hidden="true" />
                            See AI in Action
                        </Button>
                    </motion.div>

                    {/* Trust Signal */}
                    <motion.div
                        {...fadeInUp}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="flex items-center gap-4 pt-2"
                    >
                        <div className="flex -space-x-3">
                            {[
                                "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=faces",
                                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop&crop=faces",
                                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=faces",
                                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=32&h=32&fit=crop&crop=faces"
                            ].map((src, i) => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                                    <img src={src} alt="" className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col items-start">
                            <div className="flex items-center gap-1">
                                <div className="flex">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                    ))}
                                </div>
                                <span className="text-xs font-bold text-slate-900">5.0</span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium">Trusted by <span className="text-slate-900 font-bold">500+ Jewellers</span></p>
                        </div>
                    </motion.div>
                </div>

                {/* Mobile Sticky CTA */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-slate-200 md:hidden z-50 safe-area-bottom">
                    <a href="#pricing" onClick={(e) => handleSmoothScroll(e, '#pricing')}>
                        <Button size="lg" className="w-full bg-slate-900 text-white hover:bg-slate-800 shadow-lg rounded-xl h-12 text-base font-semibold">
                            Get Started Free
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </a>
                </div>

                {/* Dashboard Preview */}
                <div className="mt-16 md:mt-24 relative z-10">
                    <HeroDashboardPreview />
                </div>
            </div>

            {/* Decorative Glows - CSS only for performance */}
            <div
                className="absolute top-1/4 -left-32 md:-left-64 w-64 md:w-96 h-64 md:h-96 bg-gold-200/30 rounded-full blur-[80px] md:blur-[128px] -z-10 mix-blend-multiply"
                aria-hidden="true"
            />
            <div
                className="absolute bottom-0 -right-32 md:-right-64 w-64 md:w-96 h-64 md:h-96 bg-blue-200/20 rounded-full blur-[80px] md:blur-[128px] -z-10 mix-blend-multiply"
                aria-hidden="true"
            />
        </section>
    );
}