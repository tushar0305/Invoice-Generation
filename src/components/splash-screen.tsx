'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '@/components/logo';

export function SplashScreen() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Hide splash screen after a delay
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 2500); // Adjust duration as needed

        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2 }}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="flex flex-col items-center gap-4"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#D4AF37]/20 blur-3xl rounded-full animate-pulse" />
                            <Logo className="h-24 w-24 md:h-32 md:w-32 relative z-10" />
                        </div>
                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="text-2xl md:text-3xl font-serif font-bold text-foreground"
                        >
                            Saambh Jewellers
                        </motion.h1>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
