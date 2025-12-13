'use client';

import Link from 'next/link';
import { Plus, Loader2, ArrowRight, Sparkles, Calendar, Gift, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useActiveShop } from '@/hooks/use-active-shop';
import { useSchemes } from '@/hooks/use-schemes';
import { Switch } from '@/components/ui/switch';
import { formatCurrency, cn } from '@/lib/utils';

export default function SchemesPage() {
    const { activeShop } = useActiveShop();
    const shopId = activeShop?.id;
    const { schemes, isLoading, toggleSchemeStatus } = useSchemes(shopId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">Loading schemes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 md:pb-6">
            {/* Header Section */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-center sm:text-left">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                            Gold Schemes
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                            Launch and manage customer saving plans
                        </p>
                    </div>

                    <Link href={`/shop/${shopId}/schemes/create`} className="w-full sm:w-auto">
                        <Button
                            className="w-full sm:w-auto h-10 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-xl font-medium"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Create New Scheme</span>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Content Area */}
            {schemes.length === 0 ? (
                <EmptyState shopId={shopId} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                    {schemes.map((scheme, index) => (
                        <Card
                            key={scheme.id}
                            className={cn(
                                "group relative overflow-hidden",
                                "bg-card border border-border",
                                "transition-all duration-200",
                                "hover:shadow-md hover:border-primary/30",
                                "rounded-xl",
                            )}
                        >
                            {/* Subtle gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-transparent pointer-events-none" />

                            {/* Status Toggle */}
                            <div className="absolute top-4 right-4 z-10">
                                <Switch
                                    checked={scheme.is_active}
                                    onCheckedChange={() => toggleSchemeStatus(scheme.id, scheme.is_active)}
                                    className="data-[state=checked]:bg-emerald-500 scale-105"
                                />
                            </div>

                            <CardHeader className="pb-3 relative">
                                {/* Status Badge */}
                                <div className="flex items-start gap-2 mb-3">
                                    <Badge
                                        variant={scheme.is_active ? 'default' : 'secondary'}
                                        className={cn(
                                            "text-xs font-medium px-2.5 py-0.5 rounded-full",
                                            scheme.is_active
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                                : 'bg-muted text-muted-foreground'
                                        )}
                                    >
                                        <span className={cn(
                                            "w-1.5 h-1.5 rounded-full mr-1.5",
                                            scheme.is_active ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                                        )} />
                                        {scheme.is_active ? 'Active' : 'Paused'}
                                    </Badge>
                                </div>

                                {/* Scheme Name */}
                                <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 pr-12">
                                    {scheme.name}
                                </CardTitle>

                                {/* Amount & Duration */}
                                <div className="flex items-baseline gap-2 mt-2">
                                    {scheme.type === 'FIXED_AMOUNT' ? (
                                        <span className="text-2xl font-bold text-primary">
                                            {formatCurrency(scheme.scheme_amount || 0)}
                                            <span className="text-sm font-normal text-muted-foreground ml-1">/month</span>
                                        </span>
                                    ) : (
                                        <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                            Flexible Amount
                                        </span>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="pb-4 relative">
                                {/* Quick Info Chips */}
                                <div className="flex flex-wrap gap-2">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/60 text-xs font-medium text-foreground border border-border/50">
                                        <Calendar className="w-3.5 h-3.5 text-primary" />
                                        {scheme.duration_months} Months
                                    </div>
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-xs font-medium text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                        <Scale className="w-3.5 h-3.5" />
                                        {scheme.rules.gold_purity}
                                    </div>
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-500/10 text-xs font-medium text-purple-700 dark:text-purple-400 border border-purple-500/20">
                                        <Gift className="w-3.5 h-3.5" />
                                        {scheme.rules.benefit_type === 'LAST_FREE' && '1 Month Free'}
                                        {scheme.rules.benefit_type === 'BONUS_PERCENT' && `${scheme.rules.benefit_value}% Bonus`}
                                        {scheme.rules.benefit_type === 'FIXED_BONUS' && `₹${scheme.rules.benefit_value} Bonus`}
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="pt-0 relative">
                                <Link href={`/shop/${shopId}/schemes/${scheme.id}`} className="w-full">
                                    <Button
                                        className={cn(
                                            "w-full h-10 gap-2 font-medium rounded-lg",
                                            "bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground",
                                            "border border-primary/20 hover:border-transparent",
                                            "transition-colors duration-200"
                                        )}
                                        variant="ghost"
                                    >
                                        Manage Scheme
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

function EmptyState({ shopId }: { shopId: string | null | undefined }) {
    return (
        <Card className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-card border-2 border-dashed border-border rounded-xl">
            <div className="relative mb-6">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-primary" />
                </div>
            </div>

            <h3 className="text-xl font-semibold mb-2">Start Your First Gold Scheme</h3>
            <p className="text-muted-foreground max-w-sm mb-6 text-sm">
                Create a saving scheme to help customers accumulate gold with monthly payments and attractive benefits.
            </p>

            <Link href={`/shop/${shopId}/schemes/create`}>
                <Button className="gap-2 h-10 px-6 bg-primary hover:bg-primary/90 rounded-xl font-medium">
                    <Plus className="w-4 h-4" />
                    Create Your First Scheme
                </Button>
            </Link>
        </Card>
    );
}
