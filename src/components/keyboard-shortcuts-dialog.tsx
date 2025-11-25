'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Keyboard } from 'lucide-react';

interface ShortcutsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
    const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    const shortcuts = [
        { keys: isMac ? ['⌘', 'H'] : ['Ctrl', 'H'], description: 'Go to Dashboard' },
        { keys: ['N'], description: 'New Invoice' },
        { keys: isMac ? ['⌘', 'K'] : ['Ctrl', 'K'], description: 'Command Palette' },
        { keys: isMac ? ['⌘', 'S'] : ['Ctrl', 'S'], description: 'Save' },
        { keys: ['Esc'], description: 'Close Dialog' },
        { keys: ['?'], description: 'Show This Help' },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Keyboard className="h-5 w-5 text-primary" />
                        Keyboard Shortcuts
                    </DialogTitle>
                    <DialogDescription>
                        Use these shortcuts to navigate faster
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                    {shortcuts.map((shortcut, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                            <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                            <div className="flex items-center gap-1">
                                {shortcut.keys.map((key, j) => (
                                    <kbd
                                        key={j}
                                        className="px-2 py-1 text-xs font-semibold bg-muted border border-border rounded"
                                    >
                                        {key}
                                    </kbd>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
