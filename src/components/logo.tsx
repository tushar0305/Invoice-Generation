import { useEffect, useState } from 'react';
import { useUser } from '@/supabase/provider';
import { supabase } from '@/supabase/client';
import { useActiveShop } from '@/hooks/use-active-shop';

import { cn } from '@/lib/utils';

type LogoProps = {
  generic?: boolean; // when true shows generic brand regardless of user settings
  className?: string;
};

export function Logo({ generic, className }: LogoProps) {
  const { activeShop } = useActiveShop();
  const shopName = activeShop?.shopName;

  const brand = generic ? 'Invoice Maker' : (shopName || 'Jewellers Store');

  return (
    <div className={cn("flex items-center", className)}>
      <span className="font-headline text-xl font-bold text-primary truncate max-w-[180px]" title={brand}>
        {brand}
      </span>
    </div>
  );
}
