'use client';

import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
        icon?: LucideIcon;
    };
    secondaryAction?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
    illustration?: string; // Path to illustration image
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    secondaryAction,
    className,
    illustration,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center text-center p-8 md:p-12',
                className
            )}
        >
            {/* Illustration or Icon */}
            {illustration ? (
                <img
                    src={illustration}
                    alt={title}
                    className="w-48 h-48 md:w-64 md:h-64 mb-6 opacity-80"
                />
            ) : (
                <div className="rounded-full bg-muted p-6 mb-6">
                    <Icon className="h-12 w-12 text-muted-foreground" strokeWidth={1.5} />
                </div>
            )}

            {/* Title */}
            <h3 className="text-2xl font-semibold mb-2">{title}</h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground max-w-md mb-6">
                {description}
            </p>

            {/* Actions */}
            {(action || secondaryAction) && (
                <div className="flex flex-col sm:flex-row gap-3">
                    {action && (
                        <Button onClick={action.onClick} className="gap-2">
                            {action.icon && <action.icon className="h-4 w-4" />}
                            {action.label}
                        </Button>
                    )}
                    {secondaryAction && (
                        <Button variant="outline" onClick={secondaryAction.onClick}>
                            {secondaryAction.label}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
