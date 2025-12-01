import { format, parseISO } from 'date-fns';

/**
 * Date Utility Library
 * Provides consistent date handling across the application
 */

/**
 * Get current timestamp in ISO format (UTC)
 * Use this for database timestamps
 */
export function getCurrentTimestamp(): string {
    return new Date().toISOString();
}

/**
 * Format date for invoice display (e.g., "Dec 1, 2025")
 */
export function formatInvoiceDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'PP');
}

/**
 * Format date for UI display with time (e.g., "Dec 1, 2025 at 2:30 PM")
 */
export function formatDateTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'PPp');
}

/**
 * Format date for input fields (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date | string): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'yyyy-MM-dd');
}

/**
 * Convert date to UTC ISO string
 * Use for consistent timezone handling
 */
export function toUTC(date: Date): string {
    return date.toISOString();
}

/**
 * Get today's date at midnight (local timezone)
 */
export function getToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

/**
 * Parse ISO string to Date object safely
 */
export function parseDate(isoString: string): Date {
    return parseISO(isoString);
}

/**
 * Check if a date is valid
 */
export function isValidDate(date: any): boolean {
    return date instanceof Date && !isNaN(date.getTime());
}
