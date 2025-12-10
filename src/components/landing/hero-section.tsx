'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Sparkles, Bot, Mic, ScanLine, Gift } from 'lucide-react';
import { useCallback } from 'react';

const floatingCards = [
    {
        icon: Bot,
        label: 'AI Assistant',
        text: '"Gold rate is up 2%"',
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        position: 'top-1/4 left-4 md:left-10 lg:left-20',
        animation: { y: [0, -20, 0], rotate: [0, 5, 0] },
        duration: 6,
        delay: 0,
    },
    {
        icon: Mic,
        label: 'Voice Invoice',
        text: '"Add 22k Ring..."',
        bgColor: 'bg-purple-50',
        iconColor: 'text-purple-600',
        position: 'bottom-1/3 right-4 md:right-10 lg:right-20',
        animation: { y: [0, 20, 0], rotate: [0, -5, 0] },
        duration: 7,
        delay: 1,
    },
    {
        icon: ScanLine,
        label: 'Smart Scan',
        text: 'Paper → Digital ✨',
        bgColor: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
        position: 'top-[45%] left-4 md:left-8 lg:left-16',
        animation: { y: [0, -15, 0], rotate: [0, 3, 0], x: [0, 10, 0] },
        duration: 8,
        delay: 2,
    },
    {
        icon: Gift,
        label: 'Loyalty Rewards',
        text: '+500 pts earned 🎁',
        bgColor: 'bg-rose-50',
        iconColor: 'text-rose-600',
        position: 'bottom-[20%] right-4 md:right-8 lg:right-16',
        animation: { y: [0, 18, 0], rotate: [0, -4, 0], x: [0, -8, 0] },
        duration: 9,
        delay: 3,
    },
];

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
            className="relative min-h-screen flex items-center justify-center pt-20 md:pt-24 pb-12 overflow-hidden bg-white"
            aria-labelledby="hero-heading"
        >
            {/* Background Elements - using CSS for better performance */}
            <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-gold-100/40 via-white to-white"
                aria-hidden="true"
            />
            <div
                className="absolute top-0 left-0 w-full h-full bg-[url('/grid-pattern.svg')] opacity-[0.03]"
                aria-hidden="true"
            />

            {/* Animated Floating Elements - Hidden on mobile for performance */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none hidden lg:block" aria-hidden="true">
                {floatingCards.map((card, index) => (
                    <motion.div
                        key={index}
                        animate={shouldReduceMotion ? {} : card.animation}
                        transition={shouldReduceMotion ? {} : { duration: card.duration, repeat: Infinity, ease: "easeInOut", delay: card.delay }}
                        className={`absolute ${card.position} p-3 md:p-4 bg-white rounded-2xl shadow-xl border border-slate-200`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 ${card.bgColor} rounded-lg ${card.iconColor}`}>
                                <card.icon className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">{card.label}</p>
                                <p className="text-sm font-bold text-slate-900">{card.text}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

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