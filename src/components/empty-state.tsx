'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { BackgroundPattern } from './ui/background-pattern';
import { Button } from './ui/button';
import { Plus, FileText, Users, Package, Search } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  className?: string;
  pattern?: 'dots' | 'grid' | 'gradient';
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  pattern = 'dots',
}: EmptyStateProps) {
  return (
    <div className={cn('relative flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <BackgroundPattern variant={pattern} opacity={0.3} className="text-muted-foreground" />
      
      <div className="relative z-10 max-w-md space-y-6">
        {icon && (
          <div className="flex justify-center">
            <div className="rounded-full bg-muted/50 p-6">
              {icon}
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold text-foreground">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>

        {action && (
          <Button onClick={action.onClick} size="lg" className="gap-2">
            {action.icon}
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}

// Preset empty states for common scenarios
export function EmptyInvoices({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={<FileText className="h-12 w-12 text-muted-foreground" />}
      title="No invoices yet"
      description="Create your first invoice to get started with billing your customers"
      action={{
        label: 'Create Invoice',
        onClick: onCreate,
        icon: <Plus className="h-4 w-4" />,
      }}
      pattern="gradient"
    />
  );
}

export function EmptyCustomers({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={<Users className="h-12 w-12 text-muted-foreground" />}
      title="No customers yet"
      description="Add your first customer to start managing your client relationships"
      action={{
        label: 'Add Customer',
        onClick: onCreate,
        icon: <Plus className="h-4 w-4" />,
      }}
      pattern="dots"
    />
  );
}

export function EmptyStock({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={<Package className="h-12 w-12 text-muted-foreground" />}
      title="No stock items"
      description="Add products to your inventory to track stock levels"
      action={{
        label: 'Add Stock Item',
        onClick: onCreate,
        icon: <Plus className="h-4 w-4" />,
      }}
      pattern="grid"
    />
  );
}

export function EmptySearchResults() {
  return (
    <EmptyState
      icon={<Search className="h-12 w-12 text-muted-foreground" />}
      title="No results found"
      description="Try adjusting your search terms or filters"
      pattern="dots"
    />
  );
}
