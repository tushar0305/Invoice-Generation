'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Search, UserPlus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Customer {
    name: string;
    address: string;
    phone: string;
    state?: string;
    pincode?: string;
}

interface CustomerSelectorProps {
    value: {
        customerName: string;
        customerAddress: string;
        customerPhone: string;
        customerState?: string;
        customerPincode?: string;
    };
    onChange: (customer: Partial<Customer>) => void;
    customers: Customer[];
    disabled?: boolean;
}

export function CustomerSelector({ value, onChange, customers, disabled }: CustomerSelectorProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter customers based on search term
    const filteredCustomers = customers.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    // Handle clicking outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCustomerSelect = (customer: Customer) => {
        onChange({
            name: customer.name,
            address: customer.address,
            phone: customer.phone,
            state: customer.state,
            pincode: customer.pincode,
        });
        setSearchTerm('');
        setShowDropdown(false);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setSearchTerm(newName);
        onChange({ name: newName }); // Only update name, keep other fields
        setShowDropdown(true);
    };

    return (
        <div className="space-y-4" ref={dropdownRef}>
            <div className="relative">
                <Label htmlFor="customerName" className="text-sm font-medium mb-1.5 block">Customer Name / Search</Label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        id="customerName"
                        value={value.customerName}
                        onChange={handleNameChange}
                        onFocus={() => setShowDropdown(true)}
                        placeholder="Search or enter new customer..."
                        disabled={disabled}
                        className="pl-9"
                        autoComplete="off"
                    />
                </div>

                {/* Dropdown Results */}
                {showDropdown && searchTerm && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto animate-in fade-in-0 zoom-in-95 duration-100">
                        {filteredCustomers.length > 0 ? (
                            <div className="p-1">
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                    Found {filteredCustomers.length} existing customers
                                </div>
                                {filteredCustomers.map((customer, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleCustomerSelect(customer)}
                                        className="w-full px-2 py-2 text-left hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors flex items-center justify-between group"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{customer.name}</span>
                                            <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/70">
                                                {customer.phone} • {customer.address}
                                            </span>
                                        </div>
                                        <Check className={cn("h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity",
                                            value.customerPhone === customer.phone ? "opacity-100 text-primary" : "")}
                                        />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                <p>No existing customer found.</p>
                                <p className="text-xs mt-1">Continue typing to create new.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="customerPhone">Phone Number</Label>
                    <Input
                        id="customerPhone"
                        value={value.customerPhone}
                        onChange={(e) => onChange({ phone: e.target.value })}
                        placeholder="Enter phone number"
                        disabled={disabled}
                        className="mt-1"
                    />
                </div>
                <div>
                    <Label htmlFor="customerAddress">Address</Label>
                    <Input
                        id="customerAddress"
                        value={value.customerAddress}
                        onChange={(e) => onChange({ address: e.target.value })}
                        placeholder="Enter address"
                        disabled={disabled}
                        className="mt-1"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="customerState">State</Label>
                    <Input
                        id="customerState"
                        value={value.customerState || ''}
                        onChange={(e) => onChange({ state: e.target.value })}
                        placeholder="State"
                        disabled={disabled}
                        className="mt-1"
                    />
                </div>
                <div>
                    <Label htmlFor="customerPincode">Pincode</Label>
                    <Input
                        id="customerPincode"
                        value={value.customerPincode || ''}
                        onChange={(e) => onChange({ pincode: e.target.value })}
                        placeholder="Pincode"
                        disabled={disabled}
                        className="mt-1"
                    />
                </div>
            </div>
        </div>
    );
}

