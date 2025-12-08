/**
 * Service Worker utilities
 * Use these to manage caching and ensure users see fresh content
 */

/**
 * Clear all caches and reload the page
 * Useful when you want to force users to get fresh content
 */
export async function clearCacheAndReload(): Promise<void> {
    try {
        // Clear service worker cache
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage('clearCache');
        }

        // Clear browser caches
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map((name) => caches.delete(name)));
        }

        // Clear localStorage version flag if exists
        localStorage.removeItem('app-version');

        // Hard reload
        window.location.reload();
    } catch (error) {
        console.error('Failed to clear cache:', error);
        // Fallback to simple reload
        window.location.reload();
    }
}

/**
 * Check if there's a new version available and prompt user to update
 */
export function checkForUpdates(): void {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
            registration.update();
        });
    }
}

/**
 * Force skip waiting on the new service worker
 */
export function activateNewServiceWorker(): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage('skipWaiting');
    }
}

/**
 * App version tracking
 * Call this on app load to detect version changes
 */
export function checkAppVersion(currentVersion: string): boolean {
    const storedVersion = localStorage.getItem('app-version');

    if (storedVersion !== currentVersion) {
        localStorage.setItem('app-version', currentVersion);

        // If there was an old version, this is an update
        if (storedVersion) {
            console.log(`App updated from ${storedVersion} to ${currentVersion}`);
            return true; // Version changed
        }
    }

    return false; // No change
}

/**
 * Hook into service worker updates
 * Returns a function to listen for update events
 */
export function onServiceWorkerUpdate(callback: () => void): () => void {
    if (!('serviceWorker' in navigator)) {
        return () => { };
    }

    const handler = () => {
        navigator.serviceWorker.ready.then((registration) => {
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New content is available
                            callback();
                        }
                    });
                }
            });
        });
    };

    if (document.readyState === 'complete') {
        handler();
    } else {
        window.addEventListener('load', handler);
    }

    return () => window.removeEventListener('load', handler);
}
