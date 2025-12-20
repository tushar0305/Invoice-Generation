'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Plus, Search, TrendingUp, TrendingDown, Users, Wallet, Eye, Trash2, ChevronLeft, ChevronRight, X, Phone, ArrowUpRight, ArrowDownRight, Briefcase, Truck, Hammer, User, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { CustomerBalance, LedgerStats, LedgerTransaction } from '@/lib/ledger-types';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

type KhataClientProps = {
    customers: CustomerBalance[];
    stats: LedgerStats;
    recentTransactions: LedgerTransaction[];
    shopId: string;
    userId: string;
    initialSearch?: string;
    initialBalanceType?: 'positive' | 'negative' | 'zero';
    initialType?: string;
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
    }
};

type NewEntityState = {
    name: string;
    phone: string;
    address: string;
    type: string;
    email?: string;
};

// Reusable Form Component
function AddContactForm({
    onSubmit,
    onCancel,
    isPending,
    shopId
}: {
    onSubmit: (data: NewEntityState) => Promise<void>;
    onCancel: () => void;
    isPending: boolean;
    shopId: string;
}) {
    const [newEntity, setNewEntity] = useState<NewEntityState>({
        name: '',
        phone: '',
        address: '',
        type: 'CUSTOMER',
        email: ''
    });

    // Customer Search for "Link Existing"
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const debouncedSearch = useDebounce(searchQuery, 300);

    // Search Effect
    useEffect(() => {
        async function searchCustomers() {
            if (!debouncedSearch || debouncedSearch.length < 2) {
                setSearchResults([]);
                return;
            }
            console.log('Searching customers for:', debouncedSearch, 'in shop:', shopId);
            setIsSearching(true);
            const { data, error } = await supabase
                .from('customers')
                .select('id, name, phone, address')
                .eq('shop_id', shopId)
                .ilike('name', `%${debouncedSearch}%`)
                .limit(5);

            if (error) console.error('Search Error:', error);
            console.log('Search Results:', data);

            setSearchResults(data || []);
            setIsSearching(false);
        }
        if (newEntity.type === 'CUSTOMER') {
            searchCustomers();
        } else {
            setSearchResults([]); // Don't search if not adding customer
        }
    }, [debouncedSearch, shopId, newEntity.type]);

    const handleSelectExisting = (customer: any) => {
        setNewEntity({
            ...newEntity,
            name: customer.name,
            phone: customer.phone || '',
            address: customer.address || '',
            type: 'CUSTOMER'
        });
        setSearchQuery('');
        setSearchResults([]);
    };

    return (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>Account Type</Label>
                <Select
                    value={newEntity.type}
                    onValueChange={(val) => setNewEntity({ ...newEntity, type: val })}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="CUSTOMER">Customer</SelectItem>
                        <SelectItem value="SUPPLIER">Supplier</SelectItem>
                        <SelectItem value="KARIGAR">Karigar</SelectItem>
                        <SelectItem value="PARTNER">Partner</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Search Box only for Customers */}
            {newEntity.type === 'CUSTOMER' && (
                <div className="space-y-2 relative">
                    <Label className="text-xs text-muted-foreground uppercase">Import Existing Customer (Optional)</Label>
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search name to autofill..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {searchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md max-h-40 overflow-auto">
                            {searchResults.map(c => (
                                <button
                                    key={c.id}
                                    className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                                    onClick={() => handleSelectExisting(c)}
                                >
                                    <div className="font-medium">{c.name}</div>
                                    <div className="text-xs text-muted-foreground">{c.phone}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={newEntity.name} onChange={(e) => setNewEntity({ ...newEntity, name: e.target.value })} />
            </div>
            <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={newEntity.phone} onChange={(e) => setNewEntity({ ...newEntity, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
                <Label>Address</Label>
                <Input value={newEntity.address} onChange={(e) => setNewEntity({ ...newEntity, address: e.target.value })} />
            </div>

            <div className="flex gap-2 justify-end pt-4">
                <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button onClick={() => onSubmit(newEntity)} disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create {newEntity.type}
                </Button>
            </div>
        </div>
    );
}

export function KhataClient({
    customers,
    stats,
    recentTransactions,
    shopId,
    userId,
    initialSearch = '',
    initialType = 'all',
    pagination
}: KhataClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const debouncedSearch = useDebounce(searchTerm, 500);

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    // URL Sync
    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        if (debouncedSearch !== (params.get('search') || '')) {
            if (debouncedSearch) params.set('search', debouncedSearch);
            else params.delete('search');
            params.set('page', '1');
            router.push(`${pathname}?${params.toString()}`);
        }
    }, [debouncedSearch]);

    const handleTypeFilterChange = (type: string) => {
        const params = new URLSearchParams(searchParams);
        if (type !== 'all') params.set('type', type);
        else params.delete('type');
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
    };

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', newPage.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleCreateEntity = async (entityData: NewEntityState) => {
        if (!entityData.name.trim()) {
            toast({ variant: 'destructive', title: 'Name Required' });
            return;
        }

        startTransition(async () => {
            try {
                // Unified Create RPC (No GST/PAN support as requested)
                const res = await supabase.rpc('create_khatabook_contact', {
                    p_shop_id: shopId,
                    p_name: entityData.name.trim(),
                    p_phone: entityData.phone.trim() || null,
                    p_address: entityData.address.trim() || null,
                    p_type: entityData.type,
                    p_email: null // Add email field to UI if needed, currently skipped
                });

                if (res.error) throw res.error;

                toast({ title: 'Added Successfully', description: `${entityData.name} has been added.` });
                setIsAddDialogOpen(false);
                router.refresh();
            } catch (err: any) {
                toast({ variant: 'destructive', title: 'Error', description: err.message });
            }
        });
    };

    const currentType = searchParams.get('type') || 'all';

    const typeTabs = [
        { id: 'all', label: 'All', icon: Users },
        { id: 'customer', label: 'Customers', icon: User },
        { id: 'supplier', label: 'Suppliers', icon: Truck },
        { id: 'karigar', label: 'Karigars', icon: Hammer },
        { id: 'partner', label: 'Partners', icon: Briefcase },
    ];

    const getEntityIcon = (type: string) => {
        switch (type) {
            case 'SUPPLIER': return <Truck className="h-4 w-4" />;
            case 'KARIGAR': return <Hammer className="h-4 w-4" />;
            case 'PARTNER': return <Briefcase className="h-4 w-4" />;
            default: return <User className="h-4 w-4" />;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-24 md:pb-8">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/40 md:hidden px-4 py-3">
                <h1 className="text-xl font-bold">Khata Book</h1>
                <p className="text-xs text-muted-foreground">Manage your business connections</p>
            </div>

            {/* Content Container */}
            <div className="px-4 py-4 max-w-7xl mx-auto space-y-6">

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className={cn(
                        "col-span-2 lg:col-span-1 border-0 shadow-lg text-white",
                        stats.net_balance >= 0 ? "bg-gradient-to-br from-emerald-500 to-emerald-600" : "bg-gradient-to-br from-red-500 to-red-600"
                    )}>
                        <CardContent className="p-5">
                            <p className="text-sm opacity-90 mb-1">Net Balance</p>
                            <h2 className="text-3xl font-bold">{formatCurrency(Math.abs(stats.net_balance))}</h2>
                            <Badge className="mt-2 bg-white/20 text-white hover:bg-white/30 border-0">
                                {stats.net_balance >= 0 ? 'To Receive' : 'To Pay'}
                            </Badge>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-5">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-medium text-muted-foreground uppercase">Receivable</span>
                                <ArrowDownRight className="h-4 w-4 text-emerald-500" />
                            </div>
                            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.total_receivable)}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-5">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-medium text-muted-foreground uppercase">Payable</span>
                                <ArrowUpRight className="h-4 w-4 text-red-500" />
                            </div>
                            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.total_payable)}</div>
                        </CardContent>
                    </Card>

                    <Card className="hidden md:block bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-5">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-medium text-muted-foreground uppercase">Connections</span>
                                <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div className="text-2xl font-bold">{stats.total_customers}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters & Actions */}
                <div className="sticky top-[68px] md:top-0 z-20 bg-background/95 backdrop-blur-xl border border-border/40 rounded-xl shadow-sm p-3 gap-3 flex flex-col md:flex-row items-center">

                    {/* Search */}
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search..."
                            className="pl-9 bg-muted/50 border-0"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Type Tabs */}
                    <div className="flex-1 w-full overflow-x-auto scrollbar-hide flex gap-2">
                        {typeTabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTypeFilterChange(tab.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                                        currentType === tab.id
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "hover:bg-muted text-muted-foreground"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Add Button - Responsive Dialog/Sheet */}
                    {isDesktop ? (
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="shrink-0 gap-2 rounded-lg">
                                    <Plus className="h-4 w-4" />
                                    <span>Add Contact</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Contact</DialogTitle>
                                    <DialogDescription>Create a new ledger account</DialogDescription>
                                </DialogHeader>
                                <AddContactForm
                                    onSubmit={handleCreateEntity}
                                    onCancel={() => setIsAddDialogOpen(false)}
                                    isPending={isPending}
                                    shopId={shopId}
                                />
                            </DialogContent>
                        </Dialog>
                    ) : (
                        <Sheet open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <SheetTrigger asChild>
                                <Button className="shrink-0 gap-2 rounded-lg">
                                    <Plus className="h-4 w-4" />
                                    <span>Add Contact</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="bottom" className="h-[80vh]">
                                <SheetHeader className="text-left">
                                    <SheetTitle>Add New Contact</SheetTitle>
                                    <SheetDescription>Create a new ledger account</SheetDescription>
                                </SheetHeader>
                                <AddContactForm
                                    onSubmit={handleCreateEntity}
                                    onCancel={() => setIsAddDialogOpen(false)}
                                    isPending={isPending}
                                    shopId={shopId}
                                />
                            </SheetContent>
                        </Sheet>
                    )}
                </div>

                {/* List View */}
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {customers.map((entity) => (
                        <Card
                            key={entity.id}
                            onClick={() => router.push(`/shop/${shopId}/khata/${entity.id}`)}
                            className="text-left cursor-pointer hover:border-primary/50 transition-all active:scale-[0.99]"
                        >
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className={cn(
                                    "h-12 w-12 rounded-full flex items-center justify-center shrink-0 font-bold text-lg",
                                    entity.current_balance > 0 ? "bg-emerald-100 text-emerald-600" :
                                        entity.current_balance < 0 ? "bg-red-100 text-red-600" :
                                            "bg-muted text-muted-foreground"
                                )}>
                                    {entity.name[0]?.toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold truncate">{entity.name}</h3>
                                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 flex gap-1">
                                            {getEntityIcon(entity.entity_type || 'CUSTOMER')}
                                            {entity.entity_type || 'CUSTOMER'}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">{entity.phone || 'No phone'}</p>
                                </div>
                                <div className="text-right">
                                    <p className={cn(
                                        "font-bold text-lg",
                                        entity.current_balance > 0 ? "text-emerald-600" :
                                            entity.current_balance < 0 ? "text-red-600" :
                                                "text-muted-foreground"
                                    )}>
                                        {formatCurrency(Math.abs(entity.current_balance))}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground uppercase font-medium">
                                        {entity.current_balance > 0 ? 'Receivable' : entity.current_balance < 0 ? 'Payable' : 'Settled'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {customers.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground">
                            <div className="bg-muted/50 h-20 w-20 rounded-full mx-auto flex items-center justify-center mb-4">
                                <Search className="h-8 w-8 opacity-50" />
                            </div>
                            <p>No contacts found matching your filters.</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 py-4">
                        <Button
                            variant="outline"
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage <= 1}
                        >
                            Previous
                        </Button>
                        <span className="flex items-center px-4 text-sm font-medium">
                            {pagination.currentPage} / {pagination.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage >= pagination.totalPages}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

