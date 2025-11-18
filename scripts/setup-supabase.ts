#!/usr/bin/env tsx

/**
 * Supabase Schema Setup Script
 * 
 * This script creates all necessary tables and policies in your Supabase database.
 * Run with: npx tsx scripts/setup-supabase.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// For schema creation, we ideally need service role, but can attempt with anon key
const supabaseKey = SUPABASE_SERVICE_ROLE || SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, supabaseKey, {
  auth: { persistSession: false },
});

async function setupSchema() {
  try {
    console.log('🚀 Setting up Supabase schema...\n');

    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '..', 'docs', 'supabase.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }

    const sqlContent = fs.readFileSync(schemaPath, 'utf-8');

    // Split SQL into individual statements (basic split on semicolon)
    const statements = sqlContent
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements\n`);

    let executedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const lineNum = i + 1;

      // Skip comments
      if (statement.startsWith('--')) {
        skippedCount++;
        continue;
      }

      try {
        console.log(`[${lineNum}/${statements.length}] Executing statement...`);

        let result: any;
        try {
          result = await supabase.rpc('exec_sql', {
            sql: statement,
          });
        } catch {
          // If exec_sql RPC doesn't exist, inform user
          result = { data: null, error: { message: 'exec_sql RPC not available. Use Supabase SQL Editor instead.' } };
        }
        const { data, error } = result;

        if (error) {
          // Some statements may fail due to permissions or already existing; log and continue
          if (
            error.message?.includes('already exists') ||
            error.message?.includes('duplicate') ||
            error.message?.includes('exec_sql RPC not available')
          ) {
            console.log(`   ⚠️  Skipped (already exists or RPC unavailable)`);
            skippedCount++;
          } else {
            console.log(`   ❌ Error: ${error.message}`);
            console.log(`   Statement: ${statement.substring(0, 80)}...`);
          }
        } else {
          console.log(`   ✅ Success`);
          executedCount++;
        }
      } catch (err: any) {
        console.log(`   ⚠️  Skipped (${err.message})`);
        skippedCount++;
      }
    }

    console.log(`\n📊 Schema Setup Summary:`);
    console.log(`   ✅ Executed: ${executedCount}`);
    console.log(`   ⚠️  Skipped/Already Exists: ${skippedCount}`);
    console.log(`\n⚠️  Note: Client-side SQL execution has limitations.`);
    console.log(`   For best results, manually run the SQL in Supabase SQL Editor:\n`);
    console.log(`   1. Open https://app.supabase.com`);
    console.log(`   2. Select your project → SQL Editor`);
    console.log(`   3. Click "New Query" and paste contents of docs/supabase.sql`);
    console.log(`   4. Click "Run"\n`);
  } catch (error: any) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupSchema();
