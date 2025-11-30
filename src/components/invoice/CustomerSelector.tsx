"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Search, UserPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

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
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter customers based on search term
    const filteredCustomers = searchTerm.trim() === ""
        ? customers // Show all customers when no search term
        : customers.filter((c) =>
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
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleCustomerSelect = (customer: Customer) => {
        onChange({
            name: customer.name,
            address: customer.address,
            phone: customer.phone,
            state: customer.state,
            pincode: customer.pincode,
        });
        setSearchTerm("");
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
                <Label htmlFor="customerName" className="text-xs uppercase text-muted-foreground font-semibold tracking-wider mb-1.5 block">
                    Customer Name / Search
                </Label>

                {/* Desktop Input with Dropdown */}
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        id="customerName"
                        value={value.customerName}
                        onChange={handleNameChange}
                        onFocus={() => setShowDropdown(true)}
                        placeholder="Search or enter new customer..."
                        disabled={disabled}
                        className="pl-9 h-12 text-base bg-background/50"
                        autoComplete="off"
                    />

                    {/* Dropdown Results */}
                    {showDropdown && customers.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto animate-in fade-in-0 zoom-in-95 duration-100">
                            {filteredCustomers.length > 0 ? (
                                <div className="p-1">
                                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                        {searchTerm.trim() ? `Found ${filteredCustomers.length} matching customers` : `${filteredCustomers.length} recent customers`}
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
                                                <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/70">{customer.phone} • {customer.address}</span>
                                            </div>
                                            <Check
                                                className={cn("h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity", value.customerPhone === customer.phone ? "opacity-100 text-primary" : "")}
                                            />
                                        </button>
                                    ))}
                                    {searchTerm && !filteredCustomers.some((c) => c.name.toLowerCase() === searchTerm.toLowerCase()) && (
                                        <>
                                            <div className="h-px bg-border my-1" />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onChange({ name: searchTerm });
                                                    setShowDropdown(false);
                                                }}
                                                className="w-full px-2 py-2 text-left hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors flex items-center gap-2 text-primary"
                                            >
                                                <UserPlus className="h-4 w-4" />
                                                <span className="font-medium text-sm">Create new: "{searchTerm}"</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="p-1">
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        <p>No existing customer found.</p>
                                    </div>
                                    {searchTerm && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onChange({ name: searchTerm });
                                                setShowDropdown(false);
                                            }}
                                            className="w-full px-2 py-2 text-left hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors flex items-center gap-2 text-primary justify-center"
                                        >
                                            <UserPlus className="h-4 w-4" />
                                            <span className="font-medium text-sm">Create new: "{searchTerm}"</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Mobile Sheet Trigger */}
                <div className="md:hidden">
                    <Sheet open={showDropdown} onOpenChange={setShowDropdown}>
                        <SheetTrigger asChild>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input value={value.customerName} readOnly placeholder="Search or select customer..." className="pl-9 h-12 text-base bg-background/50" />
                            </div>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[80vh] flex flex-col p-0 gap-0">
                            <SheetHeader className="p-4 border-b">
                                <SheetTitle>Select Customer</SheetTitle>
                                <SheetDescription>Search for an existing customer or create a new one.</SheetDescription>
                            </SheetHeader>
                            <div className="p-4 border-b">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input value={searchTerm} onChange={handleNameChange} placeholder="Search name or phone..." className="pl-9" autoFocus />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4">
                                {searchTerm ? (
                                    filteredCustomers.length > 0 ? (
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold text-muted-foreground mb-2">Found {filteredCustomers.length} customers</p>
                                            {filteredCustomers.map((customer, index) => (
                                                <button
                                                    key={index}
                                                    type="button"
                                                    onClick={() => handleCustomerSelect(customer)}
                                                    className="w-full p-3 text-left bg-muted/30 hover:bg-muted rounded-lg transition-colors flex items-center justify-between"
                                                >
                                                    <div>
                                                        <p className="font-medium">{customer.name}</p>
                                                        <p className="text-xs text-muted-foreground">{customer.phone}</p>
                                                    </div>
                                                    {value.customerPhone === customer.phone && <Check className="h-4 w-4 text-primary" />}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <UserPlus className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                                            <p className="text-muted-foreground">No customer found.</p>
                                            <div className="flex items-center justify-center gap-3 mt-4">
                                                <Button
                                                    variant="default"
                                                    onClick={() => {
                                                        onChange({ name: searchTerm });
                                                        setShowDropdown(false);
                                                    }}
                                                >
                                                    Add "{searchTerm}" and Close
                                                </Button>
                                                <Button variant="ghost" onClick={() => setShowDropdown(false)}>
                                                    Close
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Search className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                        <p>Start typing to search...</p>
                                    </div>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="customerPhone" className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                        Phone Number
                    </Label>
                    <Input id="customerPhone" value={value.customerPhone} onChange={(e) => onChange({ phone: e.target.value })} placeholder="Enter phone number" disabled={disabled} className="mt-1.5 h-12 text-base bg-background/50" />
                </div>
                <div>
                    <Label htmlFor="customerAddress" className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                        Address
                    </Label>
                    <Input id="customerAddress" value={value.customerAddress} onChange={(e) => onChange({ address: e.target.value })} placeholder="Enter address" disabled={disabled} className="mt-1.5 h-12 text-base bg-background/50" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="customerState" className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                        State
                    </Label>
                    <Input id="customerState" value={value.customerState || ""} onChange={(e) => onChange({ state: e.target.value })} placeholder="State" disabled={disabled} className="mt-1.5 h-12 text-base bg-background/50" />
                </div>
                <div>
                    <Label htmlFor="customerPincode" className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                        Pincode
                    </Label>
                    <Input id="customerPincode" value={value.customerPincode || ""} onChange={(e) => onChange({ pincode: e.target.value })} placeholder="Pincode" disabled={disabled} className="mt-1.5 h-12 text-base bg-background/50" />
                </div>
            </div>
        </div>
    );
}

