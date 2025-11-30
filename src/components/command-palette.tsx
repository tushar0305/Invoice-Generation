'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Users,
  Settings,
  Home,
  Search,
  Package,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords?: string[];
  category: string;
}

interface CommandPaletteProps {
  shopId?: string;
}

export function CommandPalette({ shopId }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const commands: Command[] = shopId
    ? [
        {
          id: 'new-invoice',
          label: 'Create New Invoice',
          description: 'Start creating a new invoice',
          icon: FileText,
          action: () => {
            router.push(`/shop/${shopId}/invoices/new`);
            setOpen(false);
          },
          keywords: ['create', 'new', 'invoice', 'bill'],
          category: 'Actions',
        },
        {
          id: 'invoices',
          label: 'View Invoices',
          description: 'Browse all invoices',
          icon: FileText,
          action: () => {
            router.push(`/shop/${shopId}/invoices`);
            setOpen(false);
          },
          keywords: ['invoices', 'list', 'bills'],
          category: 'Navigation',
        },
        {
          id: 'customers',
          label: 'View Customers',
          description: 'Browse all customers',
          icon: Users,
          action: () => {
            router.push(`/shop/${shopId}/customers`);
            setOpen(false);
          },
          keywords: ['customers', 'clients', 'contacts'],
          category: 'Navigation',
        },
        {
          id: 'stock',
          label: 'Manage Stock',
          description: 'View and manage inventory',
          icon: Package,
          action: () => {
            router.push(`/shop/${shopId}/stock`);
            setOpen(false);
          },
          keywords: ['stock', 'inventory', 'products'],
          category: 'Navigation',
        },
        {
          id: 'dashboard',
          label: 'Go to Dashboard',
          description: 'Return to dashboard',
          icon: Home,
          action: () => {
            router.push(`/shop/${shopId}/dashboard`);
            setOpen(false);
          },
          keywords: ['dashboard', 'home', 'overview'],
          category: 'Navigation',
        },
        {
          id: 'settings',
          label: 'Shop Settings',
          description: 'Configure shop settings',
          icon: Settings,
          action: () => {
            router.push(`/shop/${shopId}/settings`);
            setOpen(false);
          },
          keywords: ['settings', 'preferences', 'config'],
          category: 'Navigation',
        },
      ]
    : [
        {
          id: 'dashboard',
          label: 'Go to Dashboard',
          icon: Home,
          action: () => {
            router.push('/dashboard');
            setOpen(false);
          },
          keywords: ['dashboard', 'home'],
          category: 'Navigation',
        },
      ];

  const filteredCommands = commands.filter((command) => {
    const searchLower = search.toLowerCase();
    return (
      command.label.toLowerCase().includes(searchLower) ||
      command.description?.toLowerCase().includes(searchLower) ||
      command.keywords?.some((keyword) => keyword.includes(searchLower))
    );
  });

  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, Command[]>);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-2">
          <DialogTitle className="text-xl">Quick Actions</DialogTitle>
          <DialogDescription>
            Search for actions and navigate quickly
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Type a command or search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12"
              autoFocus
            />
          </div>
        </div>

        <ScrollArea className="max-h-96 overflow-y-auto">
          <div className="px-6 pb-6 space-y-4">
            {Object.entries(groupedCommands).length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No results found
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, commands]) => (
                <div key={category}>
                  <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {category}
                  </div>
                  <div className="space-y-1">
                    {commands.map((command) => (
                      <button
                        key={command.id}
                        onClick={command.action}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors',
                          'hover:bg-accent focus:bg-accent focus:outline-none group'
                        )}
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <command.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{command.label}</div>
                          {command.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {command.description}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="px-6 py-3 border-t bg-muted/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Press</span>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="px-2 py-0.5 text-xs font-mono">
                ⌘K
              </Badge>
              <span>to open</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
