'use client';

import { useEffect, useState } from 'react';

export function ClientDate() {
    const [date, setDate] = useState<string>('');

    useEffect(() => {
        setDate(new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        }));
    }, []);

    if (!date) return null;

    return <>{date}</>;
}
