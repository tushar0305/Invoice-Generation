/**
 * Schema Validation Hook
 * Checks if required Supabase tables exist
 * 
 * Note: This hook is optional and mainly used during setup.
 * If schema tables don't exist, users will see errors when trying to use the app.
 */

'use client';

import { useEffect, useState } from 'react';

interface SchemaStatus {
  stockItems: boolean;
  invoices: boolean;
  invoiceItems: boolean;
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
        // Use a relative import to avoid path resolution issues
        const { supabase } = await import('../supabase/client');

        // Check each table
        const checkTable = async (tableName: string) => {
          try {
            await supabase.from(tableName).select('id').limit(1);
            return true;
          } catch {
            return false;
          }
        };

        const [stockResult, invoicesResult, itemsResult, settingsResult] = await Promise.all([
          checkTable('stock_items'),
          checkTable('invoices'),
          checkTable('invoice_items'),
          checkTable('invoice_items'),
        ]);
        const allReady = stockResult && invoicesResult && itemsResult;
        setStatus({
          stockItems: stockResult,
          invoices: invoicesResult,
          invoiceItems: itemsResult,
          invoiceItems: itemsResult,
          allReady,
        });
      } catch (error) {
        console.error('Schema check error:', error);
        setStatus({
          stockItems: false,
          invoices: false,
          invoiceItems: false,
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
