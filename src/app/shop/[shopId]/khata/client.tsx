'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Plus, Search, TrendingUp, Users, Wallet, ChevronLeft, ChevronRight, Phone, ArrowUpRight, ArrowDownRight, Briefcase, Truck, Hammer, User, Loader2, BookOpen, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
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
            setIsSearching(true);
            const { data, error } = await supabase
                .from('customers')
                .select('id, name, phone, address')
                .eq('shop_id', shopId)
                .ilike('name', `%${debouncedSearch}%`)
                .limit(5);

            if (error) console.error('Search Error:', error);
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
                    p_email: null
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
        <div className="min-h-screen bg-background pb-20">
            {/* --- PREMIUM HEADER SECTION --- */}
            <div className="relative overflow-hidden bg-gradient-to-br from-amber-50/50 via-background to-background dark:from-amber-950/20 dark:via-background dark:to-background border-b border-border transition-colors duration-300 pb-24 pt-10 md:pt-14 md:pb-32">
                {/* Abstract Background Elements */}
                <div className="absolute top-0 right-0 w-[250px] h-[250px] md:w-[500px] md:h-[500px] bg-amber-500/10 rounded-full blur-[80px] md:blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[150px] h-[150px] md:w-[300px] md:h-[300px] bg-amber-500/10 rounded-full blur-[60px] md:blur-[100px] translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8">
                        {/* Brand Info */}
                        <div className="space-y-4 max-w-full md:max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-md text-xs font-medium text-amber-600 dark:text-amber-400">
                                <Crown className="h-3 w-3" />
                                <span>Business Ledger</span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-foreground to-amber-500 dark:from-amber-400 dark:via-foreground dark:to-amber-500">
                                    Khata Book
                                </span>
                            </h1>

                            <p className="text-muted-foreground max-w-lg text-sm md:text-base leading-relaxed">
                                Track receivables, manage debts, and settle accounts with your customers and suppliers.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT (Overlapping) --- */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-20 relative z-20 space-y-8">

                {/* Stats Grid - Bento Style */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <StatsCard
                        title="Net Balance"
                        value={formatCurrency(Math.abs(stats.net_balance))}
                        label={stats.net_balance >= 0 ? "To Receive" : "To Pay"}
                        icon={Wallet}
                        className={stats.net_balance >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}
                    />
                    <StatsCard
                        title="Total Receivable"
                        value={formatCurrency(stats.total_receivable)}
                        label="Incoming"
                        icon={ArrowDownRight}
                        className="bg-blue-500/10 text-blue-600"
                    />
                    <StatsCard
                        title="Total Payable"
                        value={formatCurrency(stats.total_payable)}
                        label="Outgoing"
                        icon={ArrowUpRight}
                        className="bg-red-500/10 text-red-600"
                    />
                    <StatsCard
                        title="Connections"
                        value={stats.total_customers.toString()}
                        label="Active Accounts"
                        icon={Users}
                        className="bg-amber-500/10 text-amber-600"
                    />
                </div>

                {/* Filters & Actions */}
                <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/20 -mx-4 px-4 md:-mx-8 md:px-8 py-4 mb-6 flex flex-col md:flex-row items-center gap-3 transition-all duration-200">
                    {/* Search */}
                    <div className="relative w-full md:w-72 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <Input
                            placeholder="Search contacts..."
                            className="pl-9 h-11 rounded-full bg-muted/40 border-border/50 focus:bg-background focus:ring-primary/20 focus:border-primary/50 transition-all shadow-sm"
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
                                        "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border",
                                        currentType === tab.id
                                            ? "bg-primary/10 border-primary/20 text-primary shadow-sm"
                                            : "bg-muted/30 border-transparent hover:bg-muted/50 text-muted-foreground"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Add Button */}
                    <div className="shrink-0 w-full md:w-auto">
                        {isDesktop ? (
                            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="h-11 px-6 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all gap-2 border-0">
                                        <Plus className="h-4 w-4" />
                                        <span>Add Contact</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md rounded-2xl">
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
                                    <Button className="h-11 px-6 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all gap-2 border-0 w-full">
                                        <Plus className="h-4 w-4" />
                                        <span>Add Contact</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
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
                </div>

                {/* Content Container */}
                <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl overflow-hidden shadow-xl shadow-black/5">
                    {/* Desktop View: Table */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow className="hover:bg-transparent border-border/50">
                                    <TableHead className="w-[80px]">Avatar</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.map((entity) => (
                                    <TableRow
                                        key={entity.id}
                                        className="cursor-pointer hover:bg-muted/30 border-border/50 transition-colors"
                                        onClick={() => router.push(`/shop/${shopId}/khata/${entity.id}`)}
                                    >
                                        <TableCell>
                                            <div className={cn(
                                                "h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner transition-transform hover:scale-105",
                                                entity.current_balance > 0 ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200" :
                                                    entity.current_balance < 0 ? "bg-red-100 text-red-700 ring-1 ring-red-200" :
                                                        "bg-muted text-muted-foreground"
                                            )}>
                                                {entity.name[0]?.toUpperCase()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-foreground">
                                            {entity.name}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="text-[10px] h-6 px-2.5 gap-1.5 font-medium bg-muted/50 hover:bg-muted">
                                                {getEntityIcon(entity.entity_type || 'CUSTOMER')}
                                                <span className="capitalize">{entity.entity_type?.toLowerCase() || 'Customer'}</span>
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground font-mono text-xs">
                                            {entity.phone || '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={cn(
                                                    "font-bold tabular-nums text-base",
                                                    entity.current_balance > 0 ? "text-emerald-600" :
                                                        entity.current_balance < 0 ? "text-red-600" :
                                                            "text-muted-foreground"
                                                )}>
                                                    {formatCurrency(Math.abs(entity.current_balance))}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider opacity-70">
                                                    {entity.current_balance > 0 ? 'Receivable' : entity.current_balance < 0 ? 'Payable' : 'Settled'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile View: Cards */}
                    <div className="md:hidden">
                        <div className="divide-y divide-border/50">
                            {customers.map((entity, idx) => (
                                <div
                                    key={entity.id}
                                    onClick={() => router.push(`/shop/${shopId}/khata/${entity.id}`)}
                                    className="p-4 active:bg-muted/30 transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className={cn(
                                            "h-12 w-12 rounded-full flex items-center justify-center shrink-0 font-bold text-lg shadow-sm border border-border/10",
                                            entity.current_balance > 0 ? "bg-emerald-100 text-emerald-700" :
                                                entity.current_balance < 0 ? "bg-red-100 text-red-700" :
                                                    "bg-muted text-muted-foreground"
                                        )}>
                                            {entity.name[0]?.toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <h3 className="font-semibold text-base truncate text-foreground pr-2">{entity.name}</h3>
                                                <Badge variant="outline" className={cn("text-[9px] h-5 px-1.5 uppercase font-bold tracking-wide border-0 tabular-nums",
                                                    entity.current_balance > 0 ? "bg-emerald-50 text-emerald-700" :
                                                        entity.current_balance < 0 ? "bg-red-50 text-red-700" : "bg-muted/50 text-muted-foreground")}>
                                                    {entity.current_balance > 0 ? 'Receive' : entity.current_balance < 0 ? 'Pay' : 'Settled'}
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                                    {getEntityIcon(entity.entity_type || 'CUSTOMER')}
                                                    <span className="capitalize">{entity.entity_type?.toLowerCase() || 'Customer'}</span>
                                                </p>
                                                <span className={cn(
                                                    "font-bold text-base tabular-nums",
                                                    entity.current_balance > 0 ? "text-emerald-600" :
                                                        entity.current_balance < 0 ? "text-red-600" :
                                                            "text-muted-foreground"
                                                )}>
                                                    {formatCurrency(Math.abs(entity.current_balance))}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {customers.length === 0 && (
                        <div className="py-20 text-center flex flex-col items-center justify-center">
                            <div className="bg-muted/30 h-24 w-24 rounded-full flex items-center justify-center mb-6 ring-1 ring-border/50">
                                <BookOpen className="h-10 w-10 text-muted-foreground/30" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">No contacts found</h3>
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                Add a new contact to start tracking your business ledger.
                            </p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 py-6">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full h-9 border-border/50 bg-background/50 backdrop-blur-sm"
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage <= 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                        </Button>
                        <span className="flex items-center px-4 text-sm font-medium bg-background/50 rounded-full border border-border/20 backdrop-blur-sm">
                            {pagination.currentPage} / {pagination.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full h-9 border-border/50 bg-background/50 backdrop-blur-sm"
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage >= pagination.totalPages}
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ----------------------
// HELPER COMPONENTS
// ----------------------

function StatsCard({ title, value, label, icon: Icon, className }: any) {
    return (
        <Card className="border-border/50 shadow-lg shadow-black/5 bg-card/60 backdrop-blur-xl hover:bg-card/90 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group">
            <CardContent className="p-4 md:p-6">
                <div className="flex justify-between items-start mb-3 md:mb-4">
                    <div className={cn("p-2 md:p-3 rounded-xl transition-all duration-300 group-hover:scale-110 shadow-sm", className)}>
                        <Icon className="w-4 h-4 md:w-6 md:h-6" />
                    </div>
                </div>
                <div>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight truncate">
                        {value}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground font-medium mt-1 truncate">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}
