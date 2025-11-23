'use client';

import { useEffect, useState } from 'react';
import type { StockItem } from '@/lib/definitions';
import { supabase } from '@/supabase/client';

/**
 * Hook to fetch stock items for the current user (Supabase)
 */
export function useStockItems(shopId: string | null | undefined) {
  const [items, setItems] = useState<StockItem[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let aborted = false;
    async function run() {
      if (!shopId) {
        setItems([]);
        setIsLoading(false);
        setError(null);
        return;
      }
      setIsLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (aborted) return;
      if (error) {
        setError(new Error(error.message));
        setItems([]);
      } else {
        setItems((data as any) ?? []);
      }
      setIsLoading(false);
    }
    run();
    return () => { aborted = true; };
  }, [shopId]);

  return { items: items ?? [], allItems: items ?? [], isLoading, error };
}
