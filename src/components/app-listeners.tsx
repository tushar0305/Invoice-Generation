// Web-only app listeners
// Capacitor has been removed - mobile app will be handled separately

'use client';

import { useEffect } from 'react';

export function AppListeners() {
    useEffect(() => {
        // No-op for web
        // Mobile app listeners will be handled in the separate native app
        return;
    }, []);

    return null;
}
