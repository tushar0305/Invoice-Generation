'use client';

import { cn } from '@/lib/utils';

interface BackgroundPatternProps {
  variant?: 'dots' | 'grid' | 'gradient';
  className?: string;
  opacity?: number;
}

export function BackgroundPattern({ variant = 'dots', className, opacity = 0.5 }: BackgroundPatternProps) {
  if (variant === 'dots') {
    return (
      <div
        className={cn('absolute inset-0 -z-10 overflow-hidden', className)}
        style={{ opacity }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div
        className={cn('absolute inset-0 -z-10 overflow-hidden', className)}
        style={{ opacity }}
      >
        <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="grid-pattern"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 32 0 L 0 0 0 32"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>
    );
  }

  // gradient variant
  return (
    <div
      className={cn('absolute inset-0 -z-10 overflow-hidden', className)}
      style={{ opacity }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-radial from-primary/10 to-transparent blur-3xl" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-accent/10 to-transparent blur-3xl" />
    </div>
  );
}
