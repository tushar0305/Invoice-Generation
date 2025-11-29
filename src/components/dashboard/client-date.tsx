'use client';

import { useState, useEffect } from 'react';

export function ClientDate() {
    const [date, setDate] = useState<string>('');

    useEffect(() => {
        setDate(new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' }));
    }, []);

    if (!date) return <span className="w-24 h-4 bg-muted/20 animate-pulse rounded" />;

    return <>{date}</>;
}
