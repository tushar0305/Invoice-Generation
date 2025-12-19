'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function Loading() {
    const [tipIndex, setTipIndex] = useState(0);

    const tips = [
        "You can quickly create invoices using just your voice.",
        "Share invoices directly to WhatsApp from the dashboard.",
        "Track gold rates live to keep your pricing updated.",
        "Manage your Udhaar Khata and Loans from one place.",
        "Enable offline mode to work without internet.",
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setTipIndex((prev) => (prev + 1) % tips.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
            {/* Animated Logo */}
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.8, 1, 0.8],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="mb-8 relative"
            >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-amber-600 flex items-center justify-center shadow-lg shadow-gold-500/20">
                    <span className="text-3xl font-bold text-white">S</span>
                </div>
                <div className="absolute -inset-4 bg-gold-400/20 blur-xl rounded-full -z-10 animate-pulse" />
            </motion.div>

            {/* Loading Bar */}
            <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden mb-6">
                <motion.div
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className="w-1/2 h-full bg-gradient-to-r from-transparent via-gold-500 to-transparent"
                />
            </div>

            {/* Rotating Tips */}
            <div className="h-12 overflow-hidden relative w-full max-w-sm text-center">
                <motion.p
                    key={tipIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                    className="text-sm text-muted-foreground font-medium"
                >
                    {tips[tipIndex]}
                </motion.p>
            </div>
        </div>
    );
}
