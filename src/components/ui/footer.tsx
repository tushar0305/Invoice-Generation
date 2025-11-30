import { cn } from '@/lib/utils';
import pkg from '../../../package.json';

interface FooterProps {
  className?: string;
  variant?: 'default' | 'minimal';
}

export function Footer({ className, variant = 'default' }: FooterProps) {
  const currentYear = new Date().getFullYear();

  if (variant === 'minimal') {
    return (
      <footer className={cn('py-3 px-4 border-t border-border/40 bg-background/60 backdrop-blur-sm', className)}>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>v{pkg.version}</span>
          <span className="opacity-50">•</span>
          <span>© {currentYear}</span>
        </div>
      </footer>
    );
  }

  return (
    <footer className={cn('py-4 px-6 border-t border-border/40 bg-background/60 backdrop-blur-sm', className)}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-medium">Swarnavyapar</span>
          <span className="opacity-50">•</span>
          <span>v{pkg.version}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>© {currentYear} All rights reserved</span>
        </div>
      </div>
    </footer>
  );
}
