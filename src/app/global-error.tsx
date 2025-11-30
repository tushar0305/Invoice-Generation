'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html>
            <body className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background p-4 text-center font-sans antialiased">
                <div className="rounded-full bg-destructive/10 p-4">
                    <AlertTriangle className="h-10 w-10 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Something went wrong!</h2>
                <p className="text-muted-foreground max-w-[500px]">
                    A critical error occurred. Please try refreshing the page.
                </p>
                <Button onClick={() => reset()}>Try Again</Button>
            </body>
        </html>
    );
}
