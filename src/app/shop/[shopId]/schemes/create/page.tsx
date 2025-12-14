'use client';

import { useActiveShop } from '@/hooks/use-active-shop';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { SchemeForm } from '@/components/schemes/scheme-form';

export default function CreateSchemePage() {
    const { activeShop } = useActiveShop();
    const shopId = activeShop?.id || '';

    return (
        <div className="space-y-6 pb-24 md:pb-8 max-w-5xl mx-auto px-4 md:px-8 mt-4 md:mt-8">

            {/* Mobile Back Button */}
            <div className="md:hidden mb-4">
                <Link href={`/shop/${shopId}/schemes`}>
                    <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent text-muted-foreground">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Schemes
                    </Button>
                </Link>
            </div>

            {/* Header with Breadcrumbs - Hidden on Mobile */}
            <div className="hidden md:flex flex-col gap-2 md:mb-6">
                <div className="flex items-center gap-3">
                    <Link href={`/shop/${shopId}/schemes`}>
                        <Button variant="ghost" size="icon" className="h-9 w-9 -ml-2 rounded-full hover:bg-muted">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Create New Scheme</h1>
                        <p className="text-muted-foreground text-sm md:text-base">
                            Design a new gold savings plan for your customers.
                        </p>
                    </div>
                </div>
            </div>

            {shopId && <SchemeForm shopId={shopId} />}
        </div>
    );
}
