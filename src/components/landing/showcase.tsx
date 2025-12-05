'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Sparkles, ArrowUpRight, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Showcase() {

    return (
        <section className="py-24 relative overflow-hidden bg-white dark:bg-black">
            {/* Background Decoration */}
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-50" />

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

                    {/* Left content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="flex-1 text-center lg:text-left"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 font-heading leading-tight">
                            Designed for{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-600 to-amber-500">
                                Modern Jewellers
                            </span>
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                            Experience the interface that's changing how India sells gold. Clean, intuitive, and powerful enough to run your entire showroom.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                            <Button size="lg" className="h-12 px-8 bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 rounded-full shadow-lg shadow-gold-500/10 transition-transform hover:scale-105">
                                Try Interactive Demo <ArrowUpRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>

                        <div className="mt-12 flex items-center justify-center lg:justify-start gap-8 text-sm font-medium text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                <span>ISO 27001 Certified</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap className="h-5 w-5 text-gold-500" />
                                <span>99.99% Uptime</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right content - 3D Card */}
                    <div className="flex-1 w-full perspective-1000">
                        <ThreeDCard />
                    </div>
                </div>
            </div>
        </section>
    );
}

function ThreeDCard() {
    const ref = useRef<HTMLDivElement>(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();

        const width = rect.width;
        const height = rect.height;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateY,
                rotateX,
                transformStyle: "preserve-3d",
            }}
            className="relative w-full max-w-md mx-auto aspect-[4/5] rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-2xl shadow-slate-900/40 cursor-pointer group"
        >
            {/* Glossy Overlay */}
            <div
                style={{ transform: "translateZ(50px)" }}
                className="absolute inset-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-inner"
            />

            {/* Content Floating Layer 1 */}
            <div style={{ transform: "translateZ(75px)" }} className="absolute top-12 left-8 right-8 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="h-8 w-24 bg-white/20 rounded-lg animate-pulse" />
                    <div className="h-8 w-8 bg-gold-500/80 rounded-full shadow-lg shadow-gold-500/40" />
                </div>
                <div className="h-32 w-full bg-gradient-to-br from-gold-500/20 to-transparent rounded-xl border border-gold-500/30 backdrop-blur-md" />
            </div>

            {/* Content Floating Layer 2 (Cards) */}
            <div style={{ transform: "translateZ(100px)" }} className="absolute bottom-12 left-8 right-8">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-xl">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                            <div className="h-2 w-20 bg-white/40 rounded mb-1" />
                            <div className="h-2 w-12 bg-white/20 rounded" />
                        </div>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded mb-2" />
                    <div className="h-2 w-2/3 bg-white/10 rounded" />
                </div>
            </div>

            {/* Floating Particles */}
            <div style={{ transform: "translateZ(120px)" }} className="absolute -top-4 -right-4 h-16 w-16 bg-gold-400/30 rounded-full blur-xl" />
            <div style={{ transform: "translateZ(60px)" }} className="absolute -bottom-8 -left-8 h-24 w-24 bg-blue-500/20 rounded-full blur-2xl" />

        </motion.div>
    );
}
