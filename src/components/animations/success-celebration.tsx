'use client';

import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/use-window-size';

interface SuccessCelebrationProps {
    show: boolean;
    onComplete?: () => void;
    duration?: number;
}

export function SuccessCelebration({
    show,
    onComplete,
    duration = 3000
}: SuccessCelebrationProps) {
    const { width, height } = useWindowSize();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (show) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                onComplete?.();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [show, duration, onComplete]);

    if (!isVisible) return null;

    return (
        <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={200}
            gravity={0.3}
            colors={['#D4AF37', '#FFD700', '#FFED4E', '#F4C542', '#E6B800']}
        />
    );
}
