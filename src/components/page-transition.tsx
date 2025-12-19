'use client';

import { useEffect, Suspense, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { motion, AnimatePresence } from 'framer-motion';

NProgress.configure({ showSpinner: false, speed: 400 });

function NavigationEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  return null;
}

// Helper to expose start function
let startFunction: (() => void) | null = null;
let stopFunction: (() => void) | null = null;

export const startProgress = () => {
  if (startFunction) startFunction();
};

export const stopProgress = () => {
  if (stopFunction) stopFunction();
};

const tips = [
  "You can quickly create invoices using just your voice.",
  "Share invoices directly to WhatsApp from the dashboard.",
  "Track gold rates live to keep your pricing updated.",
  "Manage your Udhaar Khata and Loans from one place.",
  "Enable offline mode to work without internet.",
  "Customize your invoice template in Settings.",
];

function PageTransitionContent() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    // Register helpers
    startFunction = () => {
      NProgress.start();
      setIsLoading(true);
      setTipIndex(prev => (prev + 1) % tips.length); // Rotate tip on new load
    };
    stopFunction = () => {
      NProgress.done();
      setIsLoading(false);
    }
    return () => {
      startFunction = null;
      stopFunction = null;
    };
  }, []);

  useEffect(() => {
    if (isLoading) {
      // Safety timeout
      const timer = setTimeout(() => {
        setIsLoading(false);
        NProgress.done();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) {
      NProgress.done();
      setIsLoading(false);
    }
  }, [pathname, searchParams]);

  // Rotate tips while loading
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <>
      <NavigationEvents />
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] z-index-priority flex flex-col items-center justify-center bg-background/90 backdrop-blur-md"
          >
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
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center shadow-2xl shadow-gold-500/20 overflow-hidden relative border border-white/20 backdrop-blur-sm">
                <img
                  src="/icons/icon-512x512.png"
                  alt="App Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -inset-4 bg-gold-400/20 blur-xl rounded-full -z-10 animate-pulse" />
            </motion.div>

            {/* Custom Progress Bar */}
            <div className="w-64 h-1.5 bg-muted/50 rounded-full overflow-hidden mb-8 border border-white/10">
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
            <div className="h-16 overflow-hidden relative w-full max-w-sm text-center px-4">
              <AnimatePresence mode="wait">
                <motion.p
                  key={tipIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm text-muted-foreground font-medium"
                >
                  {tips[tipIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <style jsx global>{`
                #nprogress {
                  pointer-events: none;
                }
                #nprogress .bar {
                  background: #D4AF37;
                  position: fixed;
                  z-index: 1031;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 3px;
                }
                #nprogress .peg {
                  display: block;
                  position: absolute;
                  right: 0px;
                  width: 100px;
                  height: 100%;
                  box-shadow: 0 0 10px #D4AF37, 0 0 5px #D4AF37;
                  opacity: 1.0;
                  transform: rotate(3deg) translate(0px, -4px);
                }
                .z-index-priority {
                    z-index: 99999 !important;
                }
            `}</style>
    </>
  );
}

export function PageTransition() {
  return (
    <Suspense fallback={null}>
      <PageTransitionContent />
    </Suspense>
  );
}

