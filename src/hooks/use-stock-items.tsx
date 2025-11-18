'use client';

import { useEffect, useState } from 'react';
import type { StockItem } from '@/lib/definitions';
import { supabase } from '@/supabase/client';

/**
 * Hook to fetch stock items for the current user (Supabase)
 */
export function useStockItems(userId: string | null | undefined) {
  const [items, setItems] = useState<StockItem[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let aborted = false;
    async function run() {
      if (!userId) {
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
        .eq('user_id', userId)
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
  }, [userId]);

  return { items: items ?? [], allItems: items ?? [], isLoading, error };
}
