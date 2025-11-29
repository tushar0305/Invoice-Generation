'use client';

import { m, AnimatePresence, LazyMotion, domAnimation } from 'framer-motion';
import { ReactNode } from 'react';

interface MotionWrapperProps {
    children: ReactNode;
    className?: string;
    delay?: number;
}

export function MotionWrapper({ children, className, delay = 0 }: MotionWrapperProps) {
    return (
        <LazyMotion features={domAnimation}>
            <AnimatePresence mode="wait">
                <m.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: 'easeOut', delay }}
                    className={className}
                >
                    {children}
                </m.div>
            </AnimatePresence>
        </LazyMotion>
    );
}

export function FadeIn({ children, className, delay = 0 }: MotionWrapperProps) {
    return (
        <LazyMotion features={domAnimation}>
            <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay }}
                className={className}
            >
                {children}
            </m.div>
        </LazyMotion>
    );
}

export function SlideInFromLeft({ children, className, delay = 0 }: MotionWrapperProps) {
    return (
        <LazyMotion features={domAnimation}>
            <m.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay }}
                className={className}
            >
                {children}
            </m.div>
        </LazyMotion>
    );
}
