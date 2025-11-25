'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';

export function PlatformRedirect() {
    const router = useRouter();

    useEffect(() => {
        // Check if running in Capacitor (mobile app)
        if (Capacitor.isNativePlatform()) {
            // Redirect to login page for mobile app
            router.replace('/login');
        }
    }, [router]);

    return null;
}
