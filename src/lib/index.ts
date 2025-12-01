/**
 * Barrel export for lib utilities
 * Provides cleaner imports across the application
 * 
 * Usage:
 * import { formatInvoiceDate, upsertCustomer } from '@/lib';
 * 
 * Instead of:
 * import { formatInvoiceDate } from '@/lib/date-utils';
 * import { upsertCustomer } from '@/lib/customer-utils';
 */

// Date utilities
export * from './date-utils';

// Customer utilities
export * from './customer-utils';

// Other utilities
export * from './utils';
export * from './definitions';
export * from './validation';
