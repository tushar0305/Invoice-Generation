
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use Service Role Key for testing
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAnalytics() {
  console.log('Testing analytics insert...');

  // 1. Get a shop ID from catalogue_settings (publicly accessible)
  const { data: settings, error: shopError } = await supabase
    .from('catalogue_settings')
    .select('shop_id')
    .limit(1);

  if (shopError || !settings || settings.length === 0) {
    console.error('Failed to get a shop ID from catalogue_settings:', shopError);
    return;
  }

  const shopId = settings[0].shop_id;
  console.log('Using shop ID:', shopId);

  // 2. Get a product ID
  const { data: products } = await supabase
    .from('catalogue_products')
    .select('id')
    .eq('shop_id', shopId)
    .limit(1);
    
  const productId = products && products.length > 0 ? products[0].id : null;

  // 3. Try to insert a product view
  const { data, error } = await supabase
    .from('catalogue_analytics')
    .insert({
      shop_id: shopId,
      view_type: 'product_view',
      product_id: productId
    })
    .select();

  if (error) {
    console.error('Insert failed:', error);
    console.log('This likely means RLS policies are preventing public inserts.');
  } else {
    console.log('Insert successful:', data);
  }
}

testAnalytics();
