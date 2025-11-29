// Web-only platform redirect
// Capacitor has been removed - mobile app will be handled separately

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function PlatformRedirect() {
    const router = useRouter();

    useEffect(() => {
        // No redirect needed - web-only mode
        // Mobile app is handled separately
    }, [router]);

    return null;
}
