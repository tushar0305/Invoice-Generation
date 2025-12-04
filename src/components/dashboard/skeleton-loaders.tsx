'use client';

import { motion } from 'framer-motion';

export function KPICardSkeleton({ index = 0 }: { index?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 
        border-2 border-gray-200 dark:border-gray-700 p-5 h-full"
        >
            {/* Animated shimmer effect */}
            <div className="animate-pulse">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>

                {/* Value */}
                <div className="mb-2">
                    <div className="h-8 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>

                {/* Change indicator */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>

                {/* Sparkline placeholder */}
                <div className="pt-3">
                    <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>

            {/* Shimmer overlay */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </motion.div>
    );
}

export function HeroSkeleton() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 
        border-2 border-gray-200 dark:border-gray-700 p-6 md:p-8"
        >
            <div className="animate-pulse">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left side */}
                    <div>
                        <div className="h-12 w-48 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
                        <div className="h-6 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>

                    {/* Right side - chart */}
                    <div className="flex items-center justify-end">
                        <div className="h-32 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </div>
            </div>

            {/* Shimmer */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </motion.div>
    );
}
