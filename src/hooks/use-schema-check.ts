/**
 * Schema Validation Hook
 * Checks if required Supabase tables exist
 */

'use client';

import { useEffect, useState } from 'react';
import React from 'react';
import { supabase } from '@/supabase/client';

interface SchemaStatus {
  inventoryItems: boolean;
  invoices: boolean;
  invoiceItems: boolean;
  allReady: boolean;
}

export function useSchemaCheck() {
  const [status, setStatus] = useState<SchemaStatus | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkSchema() {
      setIsChecking(true);
      try {
        // Try to query each table with limit 1 to check if it exists
        const checks = await Promise.all([
          checkTable(supabase, 'inventory_items'),
          checkTable(supabase, 'invoices'),
          checkTable(supabase, 'invoice_items'),
        ]);

        const [inventoryItems, invoices, invoiceItems] = checks;
        const allReady = inventoryItems && invoices && invoiceItems;

        setStatus({
          inventoryItems,
          invoices,
          invoiceItems,
          allReady,
        });
      } catch (error) {
        console.error('Schema check error:', error);
        setStatus({
          inventoryItems: false,
          invoices: false,
          invoiceItems: false,
          allReady: false,
        });
      } finally {
        setIsChecking(false);
      }
    }

    checkSchema();
  }, []);

  return { status, isChecking };
}

// Ensure proper JSX parsing and fix syntax issues
const checkTable = async (supabase: any, tableName: string) => {
  try {
    await supabase.from(tableName).select('id').limit(1);
    return true;
  } catch {
    return false;
  }
};

export function SchemaStatusBanner() {
  const { status, isChecking } = useSchemaCheck();

  if (isChecking || !status || status.allReady) {
    return null;
  }

  const missingTables = [];
  if (!status.inventoryItems) missingTables.push('inventory_items');
  if (!status.invoices) missingTables.push('invoices');
  if (!status.invoiceItems) missingTables.push('invoice_items');

  return React.createElement(
    'div',
    { className: 'fixed bottom-4 right-4 max-w-md p-4 bg-red-50 border border-red-200 rounded-lg shadow-lg z-50' },
    React.createElement(
      'div',
      { className: 'flex items-start gap-3' },
      React.createElement('div', { className: 'text-red-600 font-bold text-lg' }, 'Warning'),
      React.createElement(
        'div',
        null,
        React.createElement('h3', { className: 'font-semibold text-red-900' }, 'Supabase Schema Not Set Up'),
        React.createElement(
          'p',
          { className: 'text-sm text-red-800 mt-1' },
          `Missing tables: ${missingTables.join(', ')}`
        ),
        React.createElement(
          'p',
          { className: 'text-sm text-red-800 mt-2' },
          'Run ',
          React.createElement(
            'code',
            { className: 'bg-red-100 px-1 rounded' },
            'node scripts/verify-supabase.js'
          ),
          ' for setup instructions.'
        ),
        React.createElement(
          'a',
          {
            href: 'https://app.supabase.com',
            target: '_blank',
            rel: 'noopener noreferrer',
            className: 'text-sm text-blue-600 hover:underline mt-2 inline-block',
          },
          'Open Supabase Dashboard →'
        )
      )
    )
  );
}
