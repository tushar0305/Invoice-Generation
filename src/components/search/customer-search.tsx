"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

type CustomerRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  rank?: number | null;
  name_highlight?: string | null;
  email_highlight?: string | null;
  phone_highlight?: string | null;
};

type CustomerSearchProps = {
  shopId: string;
  pageSize?: number;
  placeholder?: string;
  className?: string;
  onSelect?: (customer: CustomerRow) => void;
  onCreate?: (name: string) => void;
};

export function CustomerSearch({
  shopId,
  pageSize = 10,
  placeholder = "Search customers by name, phone, email...",
  className,
  onSelect,
  onCreate,
}: CustomerSearchProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CustomerRow[]>([]);
  const [count, setCount] = useState(0);
  const debounced = useDebounce(query, 250);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(count / pageSize)),
    [count, pageSize]
  );

  useEffect(() => {
    setPage(1); // reset to first page on new query
  }, [debounced]);

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          shopId,
          q: debounced,
          page: String(page),
          pageSize: String(pageSize),
        });
        const res = await fetch(`/api/search/customers?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        setData(json.data || []);
        setCount(json.count || 0);
      } catch (e) {
        if ((e as any).name !== "AbortError") {
          console.error("CustomerSearch fetch error:", e);
        }
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => controller.abort();
  }, [shopId, debounced, page, pageSize]);

  const highlightFallback = (text: string | null, q: string) => {
    if (!text) return "";
    if (!q) return text;
    try {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escaped})`, "ig");
      return text.replace(regex, "<mark>$1</mark>");
    } catch {
      return text;
    }
  };

  return (
    <div className={cn("w-full space-y-3", className)}>
      <div className="flex items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
        />
        {query && (
          <Button variant="outline" onClick={() => setQuery("")}>Clear</Button>
        )}
      </div>

      {/* Results */}
      <div className="border rounded-lg">
        {loading ? (
          <div className="p-3 space-y-3">
            {Array.from({ length: Math.min(5, pageSize) }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground flex items-center justify-between">
            <span>No results</span>
            {onCreate && (
              <Button size="sm" onClick={() => onCreate(debounced || "")}>Create new customer</Button>
            )}
          </div>
        ) : (
          <ul className="divide-y">
            {data.map((row) => {
              const nameHTML = row.name_highlight ?? highlightFallback(row.name, debounced);
              const emailHTML = row.email_highlight ?? highlightFallback(row.email, debounced);
              const phoneHTML = row.phone_highlight ?? highlightFallback(row.phone, debounced);
              return (
                <li key={row.id} className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div
                      className="font-medium truncate"
                      dangerouslySetInnerHTML={{ __html: nameHTML || row.name || "(No name)" }}
                    />
                    <div className="text-xs text-muted-foreground flex gap-2">
                      <span dangerouslySetInnerHTML={{ __html: emailHTML || row.email || "" }} />
                      {row.email && row.phone ? <span>•</span> : null}
                      <span dangerouslySetInnerHTML={{ __html: phoneHTML || row.phone || "" }} />
                    </div>
                  </div>
                  {onSelect && (
                    <Button size="sm" onClick={() => onSelect(row)}>
                      Select
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground">
          {count > 0 ? (
            <span>
              Showing {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, count)} of {count}
            </span>
          ) : (
            <span>0 results</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={loading || page <= 1}
          >
            Prev
          </Button>
          <span className="tabular-nums">{page} / {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
            disabled={loading || page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CustomerSearch;
