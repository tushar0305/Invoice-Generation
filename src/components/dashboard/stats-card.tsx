import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: LucideIcon;
    trend?: {
        value: number;
        label: string;
    };
    loading?: boolean;
    className?: string;
}

export function StatsCard({ title, value, description, icon: Icon, trend, loading, className }: StatsCardProps) {
    return (
        <Card className={cn("glass-card overflow-hidden relative group hover:-translate-y-1 transition-transform duration-300", className)}>
            <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className="p-2 rounded-full bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>

            <CardContent className="relative z-10">
                {loading ? (
                    <div className="h-8 w-24 bg-muted animate-pulse rounded" />
                ) : (
                    <>
                        <div className="text-2xl font-bold font-heading tracking-tight">{value}</div>
                        {(description || trend) && (
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                {trend && (
                                    <span className={cn(
                                        "font-medium",
                                        trend.value > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                    )}>
                                        {trend.value > 0 ? "+" : ""}{trend.value}%
                                    </span>
                                )}
                                <span>{description}</span>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
