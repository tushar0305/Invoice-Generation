"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import type { CustomerSearchResult } from "@/lib/customer-types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type CustomerFTSComboboxProps = {
  shopId: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onSelect: (customer: CustomerSearchResult) => void;
};

export function CustomerFTSCombobox({
  shopId,
  placeholder = "Type customer name/phone/email...",
  disabled,
  className,
  onSelect,
}: CustomerFTSComboboxProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CustomerSearchResult[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    state: "",
    pincode: "",
  });
  const debounced = useDebounce(query, 250);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const el = containerRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!shopId || !open) return;
    const controller = new AbortController();

    const run = async () => {
      if (!debounced) {
        setData([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams({ shopId, q: debounced, page: "1", pageSize: "8" });
        const res = await fetch(`/api/search/customers?${params.toString()}`, { signal: controller.signal });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        setData(json.data || []);
        setShowCreate((json.data || []).length === 0);
      } catch (e) {
        if ((e as any).name !== "AbortError") {
          console.error("CustomerFTSCombobox fetch error:", e);
        }
      } finally {
        setLoading(false);
      }
    };

    run();
    return () => controller.abort();
  }, [shopId, debounced, open]);

  const highlightHTML = (text: string | null, fallback: string | null) => {
    const html = text || fallback || "";
    // Sanitize HTML to prevent XSS attacks from database-returned highlights
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['mark'],
      ALLOWED_ATTR: []
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div ref={containerRef} className={cn("relative", className)}>
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
          />
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="p-0 w-[var(--radix-popover-trigger-width)]"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()} // Prevent focus stealing from input
      >
        <div className="max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="p-3 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : data.length === 0 && debounced ? (
            <div className="p-3 space-y-3">
              <div className="text-sm text-muted-foreground">No results for "{debounced}"</div>
              {error ? (
                <div className="text-xs text-destructive">{error}</div>
              ) : null}
              <div className="grid grid-cols-1 gap-2">
                <Input
                  placeholder="Full name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Phone"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  />
                  <Input
                    placeholder="Email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  />
                </div>
                <Input
                  placeholder="Address"
                  value={createForm.address}
                  onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="State"
                    value={createForm.state}
                    onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                  />
                  <Input
                    placeholder="Pincode"
                    value={createForm.pincode}
                    onChange={(e) => setCreateForm({ ...createForm, pincode: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button
                    size="sm"
                    onClick={async () => {
                      if (!shopId) return;
                      setCreating(true);
                      try {
                        setError(null);
                        const name = (createForm.name || debounced || '').trim();
                        const email = (createForm.email || '').trim();
                        const phoneDigits = (createForm.phone || '').replace(/\D/g, '');
                        const address = (createForm.address || '').trim();
                        const state = (createForm.state || '').trim();
                        const pincode = (createForm.pincode || '').trim();

                        if (!name) throw new Error('Name is required');
                        if (phoneDigits && phoneDigits.length < 10) throw new Error('Phone must be 10+ digits');

                        const res = await fetch('/api/v1/customers', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ shopId, name, phone: phoneDigits || undefined, email: email || undefined, address: address || undefined, state: state || undefined, pincode: pincode || undefined }),
                        });
                        const json = await res.json();
                        if (!res.ok) throw new Error(json.error || 'Failed to create customer');
                        const created: CustomerSearchResult = { ...json, id: json.id };
                        onSelect(created);
                        setOpen(false);
                        setQuery(created.name || '');
                      } catch (e: any) {
                        setError(e.message || 'Failed');
                      } finally {
                        setCreating(false);
                      }
                    }}
                    disabled={creating}
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <ul className="divide-y">
              {data.map((row) => (
                <li
                  key={row.id}
                  className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(row);
                    setOpen(false);
                    setQuery(row.name || row.phone || row.email || "");
                  }}
                >
                  <div className="font-medium truncate" dangerouslySetInnerHTML={{ __html: highlightHTML(row.name_highlight || null, row.name) }} />
                  <div className="text-xs text-muted-foreground flex gap-2">
                    <span dangerouslySetInnerHTML={{ __html: highlightHTML(row.email_highlight || null, row.email) }} />
                    {row.email && row.phone ? <span>•</span> : null}
                    <span dangerouslySetInnerHTML={{ __html: highlightHTML(row.phone_highlight || null, row.phone) }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default CustomerFTSCombobox;
