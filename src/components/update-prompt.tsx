'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { clearCacheAndReload, onServiceWorkerUpdate } from '@/lib/service-worker';

/**
 * Shows a banner when a new app version is available
 * Prompts users to refresh to get the latest version
 */
export function UpdatePrompt() {
    const [showUpdate, setShowUpdate] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        // Listen for service worker updates
        const unsubscribe = onServiceWorkerUpdate(() => {
            setShowUpdate(true);
        });

        return unsubscribe;
    }, []);

    const handleUpdate = async () => {
        setIsUpdating(true);
        await clearCacheAndReload();
    };

    if (!showUpdate) return null;

    return (
        <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50 animate-in slide-in-from-bottom-5 duration-300">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <RefreshCw className="h-5 w-5 animate-spin-slow" />
                    <div>
                        <p className="font-medium text-sm">New version available!</p>
                        <p className="text-xs text-white/80">Refresh to get the latest features</p>
                    </div>
                </div>
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    className="shrink-0"
                >
                    {isUpdating ? 'Updating...' : 'Refresh'}
                </Button>
            </div>
        </div>
    );
}
