'use client';

import { useHotkeys } from 'react-hotkeys-hook';
import { useRouter } from 'next/navigation';
import { useToast } from './use-toast';

export function useKeyboardShortcuts() {
    const router = useRouter();
    const { toast } = useToast();

    // Navigation shortcuts
    useHotkeys('ctrl+h, meta+h', (e) => {
        e.preventDefault();
        router.push('/dashboard');
        toast({ title: 'Navigated to Dashboard', duration: 1000 });
    }, { enableOnFormTags: false });

    useHotkeys('n', (e) => {
        e.preventDefault();
        router.push('/dashboard/invoices/new');
        toast({ title: 'New Invoice', duration: 1000 });
    }, { enableOnFormTags: false });

    useHotkeys('ctrl+k, meta+k', (e) => {
        e.preventDefault();
        // Command palette - to be implemented
        toast({ title: 'Command Palette (Coming Soon)', duration: 1500 });
    });

    // Quick actions
    useHotkeys('ctrl+s, meta+s', (e) => {
        e.preventDefault();
        // Trigger save if form is present
        const saveButton = document.querySelector<HTMLButtonElement>('[data-save-button]');
        if (saveButton) {
            saveButton.click();
            toast({ title: 'Saving...', duration: 1000 });
        }
    });

    useHotkeys('esc', () => {
        // Close modals/dialogs
        const closeButton = document.querySelector<HTMLButtonElement>('[data-close-button]');
        if (closeButton) {
            closeButton.click();
        }
    });

    // Help
    useHotkeys('shift+?', (e) => {
        e.preventDefault();
        // Show keyboard shortcuts modal
        const helpButton = document.querySelector<HTMLButtonElement>('[data-shortcuts-button]');
        if (helpButton) {
            helpButton.click();
        } else {
            toast({
                title: 'Keyboard Shortcuts',
                description: 'Ctrl+H: Home • N: New Invoice • Ctrl+S: Save • Esc: Close',
                duration: 5000
            });
        }
    });

    return {
        shortcuts: [
            { key: 'Ctrl+H', description: 'Go to Dashboard', mac: '⌘H' },
            { key: 'N', description: 'New Invoice', mac: 'N' },
            { key: 'Ctrl+K', description: 'Command Palette', mac: '⌘K' },
            { key: 'Ctrl+S', description: 'Save', mac: '⌘S' },
            { key: 'Esc', description: 'Close Dialog', mac: 'Esc' },
            { key: '?', description: 'Show Help', mac: '?' },
        ]
    };
}
