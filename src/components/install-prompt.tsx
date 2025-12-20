'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [support, setSupport] = useState<{ platform: 'ios' | 'android' | 'desktop' } | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        // Only show on clean landing page or login, not inside the app
        if (pathname !== '/' && pathname !== '/login') {
            return;
        }

        if (process.env.NODE_ENV === 'development') {
            console.log('[InstallPrompt] Component mounted, listening for beforeinstallprompt');
        }

        const handler = (e: any) => {
            if (process.env.NODE_ENV === 'development') {
                console.log('[InstallPrompt] beforeinstallprompt event fired!');
            }
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Basic platform detection
        const ua = navigator.userAgent.toLowerCase();
        if (/iphone|ipad|ipod/.test(ua)) setSupport({ platform: 'ios' });
        else if (/android/.test(ua)) setSupport({ platform: 'android' });
        else setSupport({ platform: 'desktop' });

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setIsVisible(false);
        }
        setDeferredPrompt(null);
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
            >
                <div className="bg-slate-900 dark:bg-slate-800 border border-slate-700 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl flex items-center justify-center overflow-hidden">
                            <img src="/logo/logo.png" alt="App Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-white">Install SwarnaVyapar</h3>
                            <p className="text-xs text-slate-300">
                                {support?.platform === 'ios' ? 'Tap Share › Add to Home Screen' : 'Add to home screen for the best experience'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            onClick={handleInstall}
                            className="h-9 px-4 text-sm font-semibold bg-gradient-to-r from-gold-500 to-amber-500 text-slate-900 hover:from-gold-400 hover:to-amber-400 border-0 shadow-md"
                        >
                            Install
                        </Button>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="p-1.5 hover:bg-slate-700 rounded-full transition-colors"
                        >
                            <X className="h-4 w-4 text-slate-400" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
