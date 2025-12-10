
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatuses() {
  const { data, error } = await supabase
    .from('invoices')
    .select('status')
    .limit(100);

  if (error) {
    console.error('Error:', error);
    return;
  }

  const statuses = new Set(data.map((d: any) => d.status));
  console.log('Distinct statuses:', Array.from(statuses));
}

checkStatuses();
