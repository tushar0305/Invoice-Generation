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
        positiveIsGood?: boolean; // Default true
    };
    context?: string; // e.g. "₹5,000 ahead of last month"
    action?: {
        label: string;
        onClick: () => void;
    };
    loading?: boolean;
    className?: string;
}

export function StatsCard({ title, value, description, icon: Icon, trend, context, action, loading, className }: StatsCardProps) {
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
                        <div className="flex items-end gap-2">
                            <div className="text-2xl font-bold font-heading tracking-tight">{value}</div>
                            {trend && (
                                <div className={cn(
                                    "text-xs font-medium mb-1.5 px-1.5 py-0.5 rounded-full bg-opacity-10",
                                    (trend.positiveIsGood !== false ? trend.value >= 0 : trend.value < 0)
                                        ? "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30"
                                        : "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30"
                                )}>
                                    {trend.value > 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
                                </div>
                            )}
                        </div>

                        {(context || description) && (
                            <div className="mt-2 space-y-1">
                                {context && (
                                    <div className="text-xs font-medium text-foreground/80">
                                        {context}
                                    </div>
                                )}
                                {description && (
                                    <div className="text-xs text-muted-foreground">
                                        {description}
                                    </div>
                                )}
                            </div>
                        )}

                        {action && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                                <button
                                    onClick={action.onClick}
                                    className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                                >
                                    {action.label} →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
