'use client';

import { motion } from 'framer-motion';

export function HeroBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
            {/* 1. Base Gradient */}
            <div className="absolute inset-0 bg-white" />

            {/* 2. Animated Aurora Blobs - Desktop Only */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                className="hidden md:block absolute inset-0 overflow-hidden"
            >
                {/* Gold/Amber Blob - Top Center/Right */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        x: [0, 50, 0],
                        y: [0, 30, 0],
                        opacity: [0.3, 0.4, 0.3]
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute -top-[20%] left-[20%] w-[800px] h-[800px] bg-gradient-to-r from-gold-200/40 via-amber-200/40 to-transparent rounded-full blur-[100px] mix-blend-multiply"
                />

                {/* Blue/Slate Blob - Bottom Left */}
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        x: [0, -30, 0],
                        y: [0, -50, 0],
                        opacity: [0.2, 0.3, 0.2]
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1
                    }}
                    className="absolute top-[20%] -left-[10%] w-[600px] h-[600px] bg-gradient-to-tr from-blue-100/40 via-slate-200/40 to-transparent rounded-full blur-[80px] mix-blend-multiply"
                />

                {/* Gold Accent - Top Right */}
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        rotate: [0, 90, 0]
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute -top-[10%] -right-[10%] w-[500px] h-[500px] bg-gradient-to-bl from-gold-100/50 to-transparent rounded-full blur-[60px] opacity-40 mix-blend-multiply"
                />
            </motion.div>

            {/* Mobile Fallback - Static Gradient */}
            <div className="md:hidden absolute inset-0 bg-gradient-to-br from-gold-50/50 via-white to-blue-50/30" />

            {/* 3. Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70" />

            {/* 4. Noise Texture Overlay */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* 5. Fade to White at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
        </div>
    );
}
