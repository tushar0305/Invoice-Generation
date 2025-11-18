#!/usr/bin/env node

/**
 * Supabase Schema Setup Helper
 * 
 * This script helps verify your Supabase setup and provides instructions
 * to create the required schema.
 * 
 * Run with: node scripts/verify-supabase.js
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n🔍 Supabase Setup Verification\n');
console.log('='.repeat(60));

if (!SUPABASE_URL) {
  console.error('\n❌ NEXT_PUBLIC_SUPABASE_URL not set in .env.local');
  console.log('\nTo fix:');
  console.log('1. Open .env.local');
  console.log('2. Add: NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.log('3. Save and restart the server\n');
  process.exit(1);
}

if (!SUPABASE_ANON_KEY) {
  console.error('\n❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not set in .env.local');
  console.log('\nTo fix:');
  console.log('1. Open .env.local');
  console.log('2. Add: NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
  console.log('3. Save and restart the server\n');
  process.exit(1);
}

console.log('✅ Environment variables configured');
console.log(`   URL: ${SUPABASE_URL}`);
console.log(`   Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);

const schemaPath = path.join(__dirname, '..', 'docs', 'supabase.sql');
if (!fs.existsSync(schemaPath)) {
  console.error(`\n❌ Schema file not found: ${schemaPath}`);
  process.exit(1);
}

const sqlContent = fs.readFileSync(schemaPath, 'utf-8');
console.log(`✅ Schema file found: docs/supabase.sql (${sqlContent.length} bytes)`);

console.log('\n' + '='.repeat(60));
console.log('\n📋 MANUAL SETUP INSTRUCTIONS:\n');

console.log('1. Open your Supabase project dashboard:');
console.log(`   👉 ${SUPABASE_URL}\n`);

console.log('2. In the left sidebar, click "SQL Editor"\n');

console.log('3. Click "New Query" (or use the "+" button)\n');

console.log('4. Copy and paste the entire contents of docs/supabase.sql\n');

console.log('5. Click the "Run" button (or press Ctrl+Enter)\n');

console.log('6. Verify all tables were created:\n');
console.log('   Expected tables:');
console.log('   - public.stock_items');
console.log('   - public.invoices');
console.log('   - public.invoice_items');
console.log('   - public.user_settings\n');

console.log('7. Check "Table Editor" to confirm rows are accessible\n');

console.log('='.repeat(60));
console.log('\n✅ Once schema is created, start the dev server:\n');
console.log('   npm run dev\n');
console.log('='.repeat(60) + '\n');
