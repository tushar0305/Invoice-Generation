'use client';

import { LucideIcon } from 'lucide-react';
import { m, LazyMotion, domAnimation } from 'framer-motion';
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
    hint?: string; // Additional helpful hint text
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: "easeOut" as const }
    }
};

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    secondaryAction,
    className,
    illustration,
    hint,
}: EmptyStateProps) {
    return (
        <LazyMotion features={domAnimation}>
            <m.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className={cn(
                    'empty-state-premium',
                    className
                )}
            >
                {/* Decorative background elements - consistent across all screens */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Soft ambient glow - reduced intensity for consistency */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-radial from-[hsl(var(--primary))]/15 to-transparent rounded-full blur-3xl dark:from-[hsl(var(--primary))]/8" />

                    {/* Very subtle pattern - theme aware using mask */}
                    <div
                        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[hsl(var(--primary))]"
                        style={{
                            maskImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='black' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                            WebkitMaskImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='black' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                        }}
                    />
                </div>

                <div className="relative z-10 max-w-md space-y-6">
                    {/* Illustration or Icon */}
                    <m.div variants={itemVariants} className="flex justify-center">
                        {illustration ? (
                            <img
                                src={illustration}
                                alt={title}
                                className="w-40 h-40 md:w-48 md:h-48 mx-auto mb-2 opacity-90"
                            />
                        ) : (
                            <div className="empty-state-icon mx-auto flex items-center justify-center">
                                <Icon
                                    className="h-8 w-8 md:h-10 md:w-10 text-[hsl(var(--primary))]/70 dark:text-[hsl(var(--primary))]/70"
                                    strokeWidth={1.5}
                                />
                            </div>
                        )}
                    </m.div>

                    {/* Title */}
                    <m.h3
                        variants={itemVariants}
                        className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white"
                    >
                        {title}
                    </m.h3>

                    {/* Description */}
                    <m.p
                        variants={itemVariants}
                        className="text-sm md:text-base text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed"
                    >
                        {description}
                    </m.p>

                    {/* Hint text */}
                    {hint && (
                        <m.p
                            variants={itemVariants}
                            className="text-xs text-gray-400 dark:text-gray-500 italic"
                        >
                            💡 {hint}
                        </m.p>
                    )}

                    {/* Actions */}
                    {(action || secondaryAction) && (
                        <m.div
                            variants={itemVariants}
                            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3"
                        >
                            {action && (
                                <Button
                                    onClick={action.onClick}
                                    size="lg"
                                    className={cn(
                                        "gap-2 min-w-[160px]",
                                        "bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))]",
                                        "hover:from-[hsl(var(--primary))]/90 hover:to-[hsl(var(--primary))]",
                                        "text-[hsl(var(--primary-foreground))] font-semibold",
                                        "shadow-md shadow-[hsl(var(--primary))]/20",
                                        "hover:shadow-lg hover:shadow-[hsl(var(--primary))]/25",
                                        "transition-all duration-200",
                                        "rounded-[14px]",
                                        "hover:scale-[1.02]",
                                        "active:scale-[0.98]"
                                    )}
                                >
                                    {action.icon && <action.icon className="h-4 w-4" />}
                                    {action.label}
                                </Button>
                            )}
                            {secondaryAction && (
                                <Button
                                    variant="outline"
                                    onClick={secondaryAction.onClick}
                                    size="lg"
                                    className={cn(
                                        "min-w-[140px]",
                                        "border-[hsl(var(--primary))]/20 dark:border-[hsl(var(--primary))]/40",
                                        "text-gray-600 dark:text-gray-300",
                                        "hover:bg-[hsl(var(--primary))]/5 dark:hover:bg-[hsl(var(--primary))]/10",
                                        "hover:border-[hsl(var(--primary))]/30 dark:hover:border-[hsl(var(--primary))]/60",
                                        "transition-all duration-300"
                                    )}
                                >
                                    {secondaryAction.label}
                                </Button>
                            )}
                        </m.div>
                    )}
                </div>
            </m.div>
        </LazyMotion>
    );
}
