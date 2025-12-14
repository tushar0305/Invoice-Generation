import { NextResponse } from 'next/server';
import { createClient } from '@/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    // Query information_schema to see columns the app actually sees
    const { data, error } = await supabase
      .from('information_schema.columns' as any)
      .select('table_schema, table_name, column_name, data_type')
      .eq('table_name', 'inventory_items')
      .order('ordinal_position' as any, { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ columns: data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
