'use server';

import { createClient } from '@/supabase/server';
import { startOfMonth, subMonths, startOfDay, startOfWeek } from 'date-fns';
import { getCatalogueStats } from '@/actions/catalogue-actions';
import { cache } from 'react';

// Use React's cache() for request-level deduplication
// This prevents duplicate DB calls within the same request
const fetchDashboardDataCached = cache(async (shopId: string) => {
    const supabase = await createClient();
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const startOfLastMonth = startOfMonth(subMonths(now, 1));
    const today = new Date();
    const startOfTodayDate = startOfDay(today);
    const startOfWeekDate = startOfWeek(today);

    // Execute all independent queries in parallel
    const [
        recentInvoicesResult,
        currentMonthInvoicesResult,
        lastMonthInvoicesResult,
        dueInvoicesResult,
        todayInvoicesResult,
        weekInvoicesResult,
        catalogueStats
    ] = await Promise.all([
        // 1. Recent Invoices
        supabase
            .from('invoices')
            .select('*, customer:customers(name, phone)')
            .eq('shop_id', shopId)
            .order('created_at', { ascending: false })
            .limit(30),
        
        // 2. Monthly Revenue
        supabase
            .from('invoices')
            .select('grand_total')
            .eq('shop_id', shopId)
            .eq('status', 'paid')
            .gte('created_at', startOfCurrentMonth.toISOString()),

        // 3. Last Month Revenue
        supabase
            .from('invoices')
            .select('grand_total')
            .eq('shop_id', shopId)
            .eq('status', 'paid')
            .gte('created_at', startOfLastMonth.toISOString())
            .lt('created_at', startOfCurrentMonth.toISOString()),

        // 4. Due Invoices
        supabase
            .from('invoices')
            .select('*')
            .eq('shop_id', shopId)
            .eq('status', 'due'),

        // 5. Today Revenue
        supabase
            .from('invoices')
            .select('grand_total')
            .eq('shop_id', shopId)
            .eq('status', 'paid')
            .gte('created_at', startOfTodayDate.toISOString()),

        // 6. Week Revenue
        supabase
            .from('invoices')
            .select('grand_total')
            .eq('shop_id', shopId)
            .eq('status', 'paid')
            .gte('created_at', startOfWeekDate.toISOString()),

        // 7. Catalogue Stats
        getCatalogueStats(shopId)
    ]);

    // Process Results
    const recentInvoices = recentInvoicesResult.data || [];
    const currentMonthInvoices = currentMonthInvoicesResult.data || [];
    const lastMonthInvoices = lastMonthInvoicesResult.data || [];
    const dueInvoices = dueInvoicesResult.data || [];
    const todayInvoices = todayInvoicesResult.data || [];
    const weekInvoices = weekInvoicesResult.data || [];

    const totalPaidThisMonth = currentMonthInvoices.reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0);
    const totalOrdersThisMonth = currentMonthInvoices.length;

    const totalPaidLastMonth = lastMonthInvoices.reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0);

    let revenueMoM = 0;
    if (totalPaidLastMonth > 0) {
        revenueMoM = ((totalPaidThisMonth - totalPaidLastMonth) / totalPaidLastMonth) * 100;
    } else if (totalPaidThisMonth > 0) {
        revenueMoM = 100;
    }

    const totalPaidToday = todayInvoices.reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0);
    const totalPaidThisWeek = weekInvoices.reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0);

    // normalize invoices for the UI
    const normalizedRecent = recentInvoices.map((inv: any) => ({
        ...inv,
        customer_name: inv.customer?.name || 'Walk-in',
        customer_phone: inv.customer?.phone || '',
        grand_total: Number(inv.grand_total) || 0,
    }));

    const normalizedDue = dueInvoices.map((inv: any) => ({
        ...inv,
        grand_total: Number(inv.grand_total) || 0,
    }));

    return {
        recentInvoices: normalizedRecent,
        totalPaidThisMonth,
        totalOrdersThisMonth,
        revenueMoM,
        dueInvoices: normalizedDue,
        catalogueStats,
        totalPaidToday,
        totalPaidThisWeek,
    };
});

// Export cached function - React's cache() deduplicates within same request
export const getDashboardData = fetchDashboardDataCached;

// Market rates don't need cookies - can use simple caching
// Using a simple in-memory cache with timestamp
let marketRatesCache: { data: any; timestamp: number } | null = null;
const MARKET_RATES_TTL = 5 * 60 * 1000; // 5 minutes

export async function getMarketRates() {
    const now = Date.now();
    if (marketRatesCache && (now - marketRatesCache.timestamp) < MARKET_RATES_TTL) {
        return marketRatesCache.data;
    }
    
    // Mock Data for now - in production, this would fetch from an API
    const data = {
        gold_24k: 7250,
        gold_22k: 6800,
        silver: 78000,
        updated_at: new Date().toISOString(),
    };
    
    marketRatesCache = { data, timestamp: now };
    return data;
}

// Use React's cache() for request-level deduplication
const fetchAdditionalStatsCached = cache(async (shopId: string) => {
    const supabase = await createClient();

    // Execute all queries in parallel
    const [customerResult, productResult, invoiceResult] = await Promise.all([
        // 1. Total Customers
        supabase
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .eq('shop_id', shopId),

        // 2. Total Products/Stock
        supabase
            .from('stock_items')
            .select('*', { count: 'exact', head: true })
            .eq('shop_id', shopId),

        // 3. Total Invoices
        supabase
            .from('invoices')
            .select('*', { count: 'exact', head: true })
            .eq('shop_id', shopId)
    ]);

    return {
        customerCount: customerResult.count || 0,
        productCount: productResult.count || 0,
        totalInvoices: invoiceResult.count || 0,
        activeLoans: 0, // Mock
        khataBalance: 0, // Mock
        totalLoyaltyPoints: 0, // Mock
        lowStockItems: [], // Mock array
        loyaltyMembers: 0, // Mock
    };
});

// Export cached function
export const getAdditionalStats = fetchAdditionalStatsCached;
