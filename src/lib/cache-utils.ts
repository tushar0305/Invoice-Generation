'use server';

import { revalidatePath } from 'next/cache';

/**
 * Revalidate all dashboard-related caches for a shop
 */
export async function revalidateDashboard(shopId: string) {
    revalidatePath(`/shop/${shopId}/dashboard`);
    revalidatePath(`/shop/${shopId}/insights`);
}

/**
 * Revalidate invoice-related caches for a shop
 */
export async function revalidateInvoices(shopId: string) {
    revalidatePath(`/shop/${shopId}/invoices`);
    revalidatePath(`/shop/${shopId}/dashboard`);
}

/**
 * Revalidate customer-related caches for a shop
 */
export async function revalidateCustomers(shopId: string) {
    revalidatePath(`/shop/${shopId}/customers`);
    revalidatePath(`/shop/${shopId}/dashboard`);
}

/**
 * Revalidate stock-related caches for a shop
 */
export async function revalidateStock(shopId: string) {
    revalidatePath(`/shop/${shopId}/stock`);
    revalidatePath(`/shop/${shopId}/dashboard`);
}

/**
 * Revalidate catalogue-related caches for a shop
 */
export async function revalidateCatalogue(shopId: string) {
    revalidatePath(`/shop/${shopId}/catalogue`);
    revalidatePath(`/store/${shopId}`);
}

/**
 * Revalidate all caches for a shop (use sparingly)
 */
export async function revalidateAllShopData(shopId: string) {
    revalidatePath(`/shop/${shopId}`, 'layout');
}
