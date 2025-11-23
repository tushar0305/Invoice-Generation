'use client';

import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { useRouter, usePathname } from 'next/navigation';

export function AppListeners() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        // Configure Status Bar
        const configStatusBar = async () => {
            try {
                await StatusBar.setStyle({ style: Style.Light });
                // Make status bar transparent and overlay on content
                await StatusBar.setBackgroundColor({ color: '#00000000' }); // Fully transparent
                await StatusBar.setOverlaysWebView({ overlay: true }); // Overlay on content
            } catch (error) {
                console.error('Error configuring status bar:', error);
            }
        };

        configStatusBar();

        // Handle Back Button
        const backListener = App.addListener('backButton', (data) => {
            if (pathname === '/dashboard' || pathname === '/login' || pathname === '/') {
                // If on root pages, minimize app instead of exit (optional, or just exit)
                App.minimizeApp();
            } else {
                // Go back in history
                router.back();
            }
        });

        return () => {
            backListener.then(h => h.remove());
        };
    }, [router, pathname]);

    return null;
}
