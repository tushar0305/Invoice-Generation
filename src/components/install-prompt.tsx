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
                <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between border border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                            <span className="font-bold text-lg">S</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Install SwarnaVyapar</h3>
                            <p className="text-xs text-slate-400">
                                {support?.platform === 'ios' ? 'Share > Add to Home Screen' : 'Add to Home Screen'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleInstall}
                            className="h-8 text-xs bg-gold-500 text-slate-900 hover:bg-gold-400 border-0"
                        >
                            Install
                        </Button>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="p-1 hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <X className="h-4 w-4 text-slate-400" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
