'use client';

import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Delete, Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface NumericKeypadDrawerProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    value: string | number;
    onValueChange: (value: string) => void;
    suffix?: string;
}

export function NumericKeypadDrawer({
    isOpen,
    onOpenChange,
    title,
    value,
    onValueChange,
    suffix
}: NumericKeypadDrawerProps) {
    const [currentValue, setCurrentValue] = useState(String(value || ''));

    // Sync internal state when external value or open state changes
    useEffect(() => {
        if (isOpen) {
            setCurrentValue(String(value === 0 ? '' : value));
        }
    }, [isOpen, value]);

    const handlePress = (key: string) => {
        if (key === '.') {
            if (currentValue.includes('.')) return;
            setCurrentValue(prev => prev + '.');
        } else {
            setCurrentValue(prev => prev + key);
        }
    };

    const handleBackspace = () => {
        setCurrentValue(prev => prev.slice(0, -1));
    };

    const handleClear = () => {
        setCurrentValue('');
    };

    const handleConfirm = () => {
        onValueChange(currentValue === '' ? '0' : currentValue);
        onOpenChange(false);
    };

    const keys = [
        '1', '2', '3',
        '4', '5', '6',
        '7', '8', '9',
        '.', '0'
    ];

    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle className="text-center">{title}</DrawerTitle>
                        <DrawerDescription className="text-center text-xs">Enter value using keypad</DrawerDescription>
                    </DrawerHeader>

                    <div className="p-4 pt-0 space-y-4">
                        {/* Display */}
                        <div className="flex items-center justify-between bg-muted/50 p-4 rounded-xl border-2 border-primary/20">
                            <span className="text-3xl font-bold tracking-tight">{currentValue || <span className="text-muted-foreground opacity-30">0</span>}</span>
                            {suffix && <span className="text-muted-foreground font-medium">{suffix}</span>}
                        </div>

                        {/* Keypad Grid */}
                        <div className="grid grid-cols-3 gap-3">
                            {keys.map((key) => (
                                <Button
                                    key={key}
                                    variant="outline"
                                    className="h-14 text-2xl font-semibold active:scale-95 transition-transform"
                                    onClick={() => handlePress(key)}
                                >
                                    {key}
                                </Button>
                            ))}
                            <Button
                                variant="outline"
                                className="h-14 text-destructive hover:text-destructive active:scale-95 transition-transform"
                                onClick={handleBackspace}
                            >
                                <Delete className="h-6 w-6" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-2">
                            <Button variant="ghost" onClick={handleClear} className="w-full h-12 text-muted-foreground">
                                Clear
                            </Button>
                            <Button onClick={handleConfirm} className="w-full h-12 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90">
                                <Check className="h-5 w-5 mr-2" /> Done
                            </Button>
                        </div>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
