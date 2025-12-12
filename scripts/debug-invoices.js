const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing env vars');
  process.exit(1);
}

console.log(`Using key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON'}`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debugInvoices() {
  console.log('Fetching last 20 invoices...');
  
  const { data, error } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, shop_id, due_date, customer:customers(name)')
    .eq('status', 'due')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching invoices:', error);
    return;
  }

  console.log(`Found ${data.length} DUE invoices.`);
  console.table(data);
}

debugInvoices();
