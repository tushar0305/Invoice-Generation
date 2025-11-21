import { useEffect, useState } from 'react';
import { useUser } from '@/supabase/provider';
import { supabase } from '@/supabase/client';

import { cn } from '@/lib/utils';

type LogoProps = {
  generic?: boolean; // when true shows generic brand regardless of user settings
  className?: string;
};

export function Logo({ generic, className }: LogoProps) {
  const { user } = useUser();
  const [shopName, setShopName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user || generic) { setShopName(null); return; }
      const { data, error } = await supabase
        .from('user_settings')
        .select('shop_name')
        .eq('user_id', user.uid)
        .single();
      if (cancelled) return;
      if (!error && data) {
        setShopName(data.shop_name || null);
      } else {
        setShopName(null);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user?.uid, generic]);

  const brand = generic ? 'Invoice Maker' : (shopName || 'Jewellers Store');

  return (
    <div className={cn("flex items-center", className)}>
      <span className="font-headline text-xl font-bold text-primary truncate max-w-[180px]" title={brand}>
        {brand}
      </span>
    </div>
  );
}
