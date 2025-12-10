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
            .select('grand_total, created_at, customer:customers(name, phone)')
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

        // 4. Due/Pending Invoices
        supabase
            .from('invoices')
            .select('id, invoice_number, grand_total, due_date, created_at, status, customer:customers(name, phone)')
            .eq('shop_id', shopId)
            .in('status', ['due', 'pending', 'Due', 'Pending']),

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
        customer_name: inv.customer?.name || 'Walk-in',
        customer_phone: inv.customer?.phone || '',
    }));

    const normalizedMonthInvoices = currentMonthInvoices.map((inv: any) => ({
        ...inv,
        grand_total: Number(inv.grand_total) || 0,
        customer_name: inv.customer?.name || 'Walk-in',
        customer_phone: inv.customer?.phone || '',
    }));

    return {
        recentInvoices: normalizedRecent,
        currentMonthInvoices: normalizedMonthInvoices,
        totalPaidThisMonth,
        totalPaidLastMonth, // Added for accurate comparisons
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

    // Try to fetch from DB first
    try {
        const supabase = await createClient();
        const { data: dbData, error } = await supabase
            .from('market_rates')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

        if (dbData && !error) {
            const rates = {
                gold_24k: Number(dbData.gold_24k),
                gold_22k: Number(dbData.gold_22k),
                silver: Number(dbData.silver),
                updated_at: dbData.updated_at,
            };
            marketRatesCache = { data: rates, timestamp: now };
            return rates;
        }
    } catch (err) {
        console.warn('Failed to fetch market rates from DB, falling back to mock', err);
    }

    // Mock Data Fallback
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
    const [customerResult, productResult, invoiceResult, dueInvoicesResult, loyaltyResult, loansResult, lowStockResult] = await Promise.all([
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
            .eq('shop_id', shopId),

        // 4. Khata Balance (Total Due)
        supabase
            .from('invoices')
            .select('grand_total')
            .eq('shop_id', shopId)
            .in('status', ['due', 'pending', 'Due', 'Pending']),

        // 5. Total Loyalty Points
        supabase
            .from('customers')
            .select('name, loyalty_points')
            .eq('shop_id', shopId)
            .gt('loyalty_points', 0)
            .order('loyalty_points', { ascending: false }),

        // 6. Active Loans (New)
        supabase
            .from('loans')
            .select('*', { count: 'exact', head: true })
            .eq('shop_id', shopId)
            .eq('status', 'active'),

        // 7. Low Stock Items
        supabase
            .from('stock_items')
            .select('id, name, quantity, unit')
            .eq('shop_id', shopId)
            .lte('quantity', 10)
            .order('quantity', { ascending: true })
            .limit(5)
    ]);

    const khataBalance = (dueInvoicesResult.data || []).reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0);
    const totalLoyaltyPoints = (loyaltyResult.data || []).reduce((sum, customer) => sum + (Number(customer.loyalty_points) || 0), 0);

    // Calculate active loyalty members (customers with > 0 points)
    const loyaltyMembers = (loyaltyResult.data || []).length;
    const topLoyaltyCustomer = (loyaltyResult.data || [])[0] || null;

    // Map low stock items
    const lowStockItems = (lowStockResult.data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        currentQty: Number(item.quantity),
        minQty: 10, // Default threshold since not in DB
        unit: item.unit
    }));

    return {
        customerCount: customerResult.count || 0,
        productCount: productResult.count || 0,
        totalInvoices: invoiceResult.count || 0,
        activeLoans: loansResult.count || 0,
        khataBalance: khataBalance,
        totalLoyaltyPoints: totalLoyaltyPoints,
        lowStockItems: lowStockItems,
        loyaltyMembers: loyaltyMembers,
        topLoyaltyCustomer: topLoyaltyCustomer ? { name: topLoyaltyCustomer.name, points: topLoyaltyCustomer.loyalty_points } : null,
    };

});

// Export cached function
export const getAdditionalStats = fetchAdditionalStatsCached;
