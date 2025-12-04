'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, UserPlus, Check, MapPin, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface Customer {
    id?: string;
    name: string;
    phone?: string;
    address?: string;
    state?: string;
    pincode?: string;
    email?: string;
}

interface PremiumCustomerAutocompleteProps {
    customers: Customer[];
    value: Customer;
    onChange: (customer: Partial<Customer>) => void;
    onSearch?: (query: string) => Promise<void>;
    disabled?: boolean;
}

export function PremiumCustomerAutocomplete({
    customers,
    value,
    onChange,
    onSearch,
    disabled = false,
}: PremiumCustomerAutocompleteProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Debounced search effect
    useEffect(() => {
        if (!onSearch || !search.trim()) return;

        const timer = setTimeout(() => {
            onSearch(search);
        }, 300);

        return () => clearTimeout(timer);
    }, [search, onSearch]);

    // Filter customers (client-side fallback or server results)
    const filteredCustomers = onSearch
        ? customers // If server search, assume customers list is already filtered/updated
        : search.trim() === ''
            ? customers.slice(0, 8)
            : customers
                .filter(
                    (c) =>
                        c.name.toLowerCase().includes(search.toLowerCase()) ||
                        c.phone?.includes(search) ||
                        c.email?.toLowerCase().includes(search.toLowerCase())
                )
                .slice(0, 8);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectCustomer = (customer: Customer) => {
        onChange({
            name: customer.name,
            phone: customer.phone,
            address: customer.address,
            state: customer.state,
            pincode: customer.pincode,
            email: customer.email,
        });
        setSearch('');
        setIsOpen(false);
    };

    const handleCreateNew = () => {
        onChange({ name: search });
        setSearch('');
        setIsOpen(false);
    };

    const handleClearSelection = () => {
        onChange({ name: '', phone: '', address: '', state: '', pincode: '', email: '' });
        setSearch('');
        // Small timeout to allow state update before focusing
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    return (
        <div className="space-y-3" ref={dropdownRef}>
            <Label className="text-sm font-semibold text-foreground">Customer</Label>

            {/* Selected Customer Card */}
            {value.name ? (
                <div className="relative group">
                    <div className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5 transition-all hover:border-primary/40 hover:bg-primary/10">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                        {value.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-base text-foreground">{value.name}</p>
                                        {value.phone && (
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <Phone className="h-3 w-3" />
                                                <span>{value.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {value.address && (
                                    <div className="flex items-start gap-1 text-sm text-muted-foreground pl-12">
                                        <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                        <span>{value.address}</span>
                                    </div>
                                )}
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleClearSelection}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                Change
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                /* Search Input */
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                    <Input
                        ref={inputRef}
                        type="text"
                        placeholder="Search customer by name, phone, or email..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setIsOpen(true);
                        }}
                        onFocus={() => setIsOpen(true)}
                        onBlur={() => {
                            // Small timeout to allow click events on dropdown items to fire first
                            setTimeout(() => {
                                if (search.trim() && !value.name) {
                                    onChange({ name: search.trim() });
                                    setIsOpen(false);
                                }
                            }, 200);
                        }}
                        disabled={disabled}
                        className="pl-10 h-12 text-base bg-background border-2 focus:border-primary transition-colors"
                        autoComplete="off"
                    />

                    {/* Dropdown */}
                    {isOpen && (
                        <div className="absolute z-50 w-[calc(100%+20px)] -left-[10px] mt-1 bg-popover border-2 border-border rounded-xl shadow-2xl max-h-[400px] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
                            {/* Results */}
                            <div className="overflow-y-auto max-h-[360px] custom-scrollbar">
                                {filteredCustomers.length > 0 ? (
                                    <>
                                        <div className="sticky top-0 px-4 py-2 bg-muted/50 backdrop-blur-sm border-b text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                            {search.trim() ? `${filteredCustomers.length} matching` : `Recent customers (${customers.length} total)`}
                                        </div>
                                        <div className="p-2">
                                            {filteredCustomers.map((customer, index) => (
                                                <button
                                                    key={customer.id || index}
                                                    type="button"
                                                    onClick={() => handleSelectCustomer(customer)}
                                                    className={cn(
                                                        'w-full px-3 py-3 rounded-lg text-left transition-all',
                                                        'hover:bg-accent hover:scale-[1.02] active:scale-[0.98]',
                                                        'flex items-center justify-between group'
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">
                                                            {customer.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm text-foreground truncate">
                                                                {customer.name}
                                                            </p>
                                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                                {customer.phone && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Phone className="h-3 w-3" />
                                                                        {customer.phone}
                                                                    </span>
                                                                )}
                                                                {customer.address && (
                                                                    <span className="truncate flex items-center gap-1">
                                                                        <MapPin className="h-3 w-3" />
                                                                        {customer.address.split(',')[0]}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Check className="h-4 w-4 opacity-0 group-hover:opacity-100 text-primary transition-opacity flex-shrink-0" />
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="p-8 text-center text-muted-foreground">
                                        <p className="text-sm mb-2">No customers found</p>
                                        {search.trim() && (
                                            <p className="text-xs">Try a different search term</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Create New Option */}
                            {search.trim() && !filteredCustomers.some((c) => c.name.toLowerCase() === search.toLowerCase()) && (
                                <>
                                    <div className="h-px bg-border" />
                                    <button
                                        type="button"
                                        onClick={handleCreateNew}
                                        className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-2 text-primary font-medium"
                                    >
                                        <UserPlus className="h-4 w-4" />
                                        <span className="text-sm">Create new customer: "{search}"</span>
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Additional Fields Drawer (when customer selected or creating new) */}
            {value.name && (
                <div className="space-y-3 pt-2 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Phone Number</Label>
                            <Input
                                type="tel"
                                value={value.phone || ''}
                                onChange={(e) => onChange({ phone: e.target.value })}
                                placeholder="+91 98765 43210"
                                className="h-10"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Email (Optional)</Label>
                            <Input
                                type="email"
                                value={value.email || ''}
                                onChange={(e) => onChange({ email: e.target.value })}
                                placeholder="customer@example.com"
                                className="h-10"
                            />
                        </div>
                    </div>

                    <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Address</Label>
                        <Input
                            type="text"
                            value={value.address || ''}
                            onChange={(e) => onChange({ address: e.target.value })}
                            placeholder="Street, Area, Landmark"
                            className="h-10"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">State</Label>
                            <Input
                                type="text"
                                value={value.state || ''}
                                onChange={(e) => onChange({ state: e.target.value })}
                                placeholder="Maharashtra"
                                className="h-10"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Pincode</Label>
                            <Input
                                type="text"
                                value={value.pincode || ''}
                                onChange={(e) => onChange({ pincode: e.target.value })}
                                placeholder="400001"
                                className="h-10"
                            />
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.5);
        }
      `}</style>
        </div>
    );
}
