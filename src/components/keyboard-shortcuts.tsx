'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveShop } from '@/hooks/use-active-shop';

/**
 * Global keyboard shortcuts for power users
 * - Ctrl/Cmd + K: Open command palette (if exists)
 * - Ctrl/Cmd + N: New Invoice
 * - Ctrl/Cmd + I: Go to Inventory
 * - Ctrl/Cmd + U: Go to Customers
 */
export function KeyboardShortcuts() {
    const router = useRouter();
    const { activeShop } = useActiveShop();
    const shopId = activeShop?.id;

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Only trigger with Ctrl (Windows) or Cmd (Mac)
        if (!(e.ctrlKey || e.metaKey)) return;

        // Don't trigger in input fields
        if (e.target instanceof HTMLInputElement ||
            e.target instanceof HTMLTextAreaElement ||
            (e.target as HTMLElement).isContentEditable) {
            return;
        }

        if (!shopId) return;

        switch (e.key.toLowerCase()) {
            case 'n':
                e.preventDefault();
                router.push(`/shop/${shopId}/invoices/new`);
                break;
            case 'i':
                e.preventDefault();
                router.push(`/shop/${shopId}/inventory`);
                break;
            case 'u':
                e.preventDefault();
                router.push(`/shop/${shopId}/customers`);
                break;
            case 'd':
                e.preventDefault();
                router.push(`/shop/${shopId}/dashboard`);
                break;
        }
    }, [router, shopId]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return null; // This component doesn't render anything
}
