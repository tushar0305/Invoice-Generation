"use client";

import { useEffect, useState } from 'react';
import { useTheme } from '@/components/theme-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const palettes = [
  { value: 'gold', label: 'Gold' },
  { value: 'emerald', label: 'Emerald' },
  { value: 'maroon', label: 'Maroon' },
  { value: 'ivory', label: 'Ivory' },
  { value: 'blue', label: 'Blue' },
  { value: 'rose', label: 'Rose' },
] as const;

export function PaletteSwitcher({ shopId }: { shopId: string }) {
  const { palette, setPalette } = useTheme();
  const [value, setValue] = useState(palette);

  useEffect(() => {
    setValue(palette);
  }, [palette]);

  const save = async () => {
    setPalette(value as any);
    localStorage.setItem(`shop_palette_${shopId}`, value);
    // Optionally persist to Supabase: activeShop.brandPalette
    try {
      const { supabase } = await import('@/supabase/client');
      await supabase
        .from('shops')
        .update({ brandPalette: value })
        .eq('id', shopId);
    } catch (e) {
      // no-op; fallback to localStorage
    }
  };

  return (
    <div className="space-y-3">
      <Label>Brand Color Palette</Label>
      <Select value={value} onValueChange={(v) => setValue(v as typeof value)}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Select palette" />
        </SelectTrigger>
        <SelectContent>
          {palettes.map((p) => (
            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex gap-2">
        <Button onClick={save}>Save</Button>
        <Button variant="outline" onClick={() => setValue('gold')}>Reset</Button>
      </div>
    </div>
  );
}
