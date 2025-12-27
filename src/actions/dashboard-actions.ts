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
            .select('id, invoice_number, grand_total, created_at, status, customer:customers(name)')
            .eq('shop_id', shopId)
            .eq('status', 'due')
            .order('created_at', { ascending: false }),

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

// Market rates cache per shop
const marketRatesCache: Record<string, { data: any; timestamp: number }> = {};
const MARKET_RATES_TTL = 60 * 60 * 1000; // 1 hour

export async function getMarketRates(shopId: string) {
    const now = Date.now();
    const cached = marketRatesCache[shopId];

    if (cached && (now - cached.timestamp) < MARKET_RATES_TTL) {
        return cached.data;
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
            marketRatesCache[shopId] = { data: rates, timestamp: now };
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

    marketRatesCache[shopId] = { data, timestamp: now };
    return data;
}

// Use React's cache() for request-level deduplication
const fetchAdditionalStatsCached = cache(async (shopId: string) => {
    const supabase = await createClient();

    // 1. Try Consolidated RPC
    const { data: stats, error: rpcError } = await supabase.rpc('get_dashboard_stats', { p_shop_id: shopId });

    if (!rpcError && stats) {
        return mapStatsToResult(stats);
    }

    console.warn('RPC get_dashboard_stats failed, falling back to direct queries:', rpcError);

    // 2. Fallback: Run individual queries in parallel
    // This ensures the dashboard works even if the RPC or DB function is broken/missing
    try {
        const [
            { count: customerCount },
            { count: productCount },
            { count: invoiceCount },
            { count: activeLoans },
            { data: khataData },
            { count: loyaltyMembers },
            { count: schemeCount },
            activeEnrollmentsResult,
            { data: recentCustomers },
            { data: allPaidInvoices }
        ] = await Promise.all([
            supabase.from('customers').select('*', { count: 'exact', head: true }).eq('shop_id', shopId),
            supabase.from('inventory_items').select('*', { count: 'exact', head: true }).eq('shop_id', shopId),
            supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('shop_id', shopId),
            supabase.from('loans').select('*', { count: 'exact', head: true }).eq('shop_id', shopId).eq('status', 'active'),
            supabase.from('customers').select('khata_balance').eq('shop_id', shopId),
            supabase.from('customers').select('*', { count: 'exact', head: true }).eq('shop_id', shopId).gt('loyalty_points', 0),
            supabase.from('schemes').select('*', { count: 'exact', head: true }).eq('shop_id', shopId),
            supabase.from('scheme_enrollments').select('total_paid, total_gold_weight_accumulated, status').eq('shop_id', shopId),
            // New: For Sparkline & Insight
            supabase.from('customers').select('created_at').eq('shop_id', shopId).gte('created_at', subMonths(startOfMonth(new Date()), 1).toISOString()), // Fetch a bit more for safety, or just 30 days
            supabase.from('invoices').select('customer_id').eq('shop_id', shopId).eq('status', 'paid')
        ]);

        // Scheme Calculations
        const enrollments = (activeEnrollmentsResult.data as any[]) || [];
        const activeEnrollmentsCount = enrollments.filter((e: any) => e.status === 'ACTIVE').length;
        const totalSchemeCollected = enrollments.reduce((sum, e) => sum + (Number(e.total_paid) || 0), 0);
        const totalGoldAccumulated = enrollments.reduce((sum, e) => sum + (Number(e.total_gold_weight_accumulated) || 0), 0);

        const khataBalance = khataData?.reduce((sum, c) => sum + (c.khata_balance || 0), 0) || 0;

        // Fetch low stock items separately
        const { data: lowStock } = await supabase
            .from('inventory_items')
            .select('id, name, gross_weight, metal_type')
            .eq('shop_id', shopId)
            .eq('status', 'IN_STOCK')
            .lt('gross_weight', 50) // Assuming low stock threshold or weight based
            .limit(5);

        // Process Sparkline (Last 30 Days)
        const sparklineMap = new Map<string, number>();
        const sparklineData: number[] = [];
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Initialize map with 0
        for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setDate(d.getDate() - (29 - i));
            const key = d.toISOString().split('T')[0];
            sparklineMap.set(key, 0);
        }

        // Fill with data
        (recentCustomers || []).forEach((c: any) => {
            const dateKey = new Date(c.created_at).toISOString().split('T')[0];
            if (sparklineMap.has(dateKey)) {
                sparklineMap.set(dateKey, (sparklineMap.get(dateKey) || 0) + 1);
            }
        });

        // Convert to array
        for (const [key, val] of sparklineMap.entries()) {
            sparklineData.push(val);
        }
        // Ensure sorted by date (Map iteration order is insertion order usually, but let's be safe if we inserted out of order? Above loop inserted in order).
        // Actually map entries are insertion order. Check keys.
        // The initialization loop was -29 to 0. Correct.

        // Process Returning Customers
        const customerInvoiceCounts: Record<string, number> = {};
        (allPaidInvoices || []).forEach((inv: any) => {
            if (inv.customer_id) {
                customerInvoiceCounts[inv.customer_id] = (customerInvoiceCounts[inv.customer_id] || 0) + 1;
            }
        });
        const returningCount = Object.values(customerInvoiceCounts).filter(count => count > 1).length;


        return {
            customerCount: customerCount || 0,
            returningCustomerCount: returningCount,
            newCustomerCount: (recentCustomers || []).length, // Approximation or filter by startOfThisMonth? RPC uses last 30 days.
            productCount: productCount || 0,
            totalInvoices: invoiceCount || 0,
            activeLoans: activeLoans || 0,
            khataBalance: khataBalance,
            totalLoyaltyPoints: 0, // Skip expensive sum
            lowStockItems: (lowStock || []).map((item: any) => ({
                id: item.id,
                name: item.name,
                weight: Number(item.gross_weight),
                metalType: item.metal_type
            })),
            loyaltyMembers: loyaltyMembers || 0,
            customerSparkline: sparklineData,
            topLoyaltyCustomer: null,
            topCustomerAllTime: null,
            // Scheme Stats
            totalSchemes: schemeCount || 0,
            activeEnrollments: activeEnrollmentsCount || 0,
            totalSchemeCollected: totalSchemeCollected || 0,
            totalGoldAccumulated: totalGoldAccumulated || 0
        };

    } catch (fallbackError) {
        console.error('Fallback stats query failed:', fallbackError);
        // Final fail-safe
        return {
            customerCount: 0,
            productCount: 0,
            totalInvoices: 0,
            activeLoans: 0,
            khataBalance: 0,
            totalLoyaltyPoints: 0,
            lowStockItems: [],
            loyaltyMembers: 0,
            customerSparkline: [],
            topLoyaltyCustomer: null,
            topCustomerAllTime: null,
            totalSchemes: 0,
            activeEnrollments: 0,
            totalSchemeCollected: 0,
            totalGoldAccumulated: 0
        };
    }
});

function mapStatsToResult(stats: any) {
    return {
        customerCount: stats.customer_count || 0,
        returningCustomerCount: stats.returning_customer_count || 0,
        newCustomerCount: stats.new_customer_count || 0,
        productCount: stats.product_count || 0,
        totalInvoices: stats.invoice_count || 0,
        activeLoans: stats.active_loans_count || 0,
        khataBalance: stats.khata_balance || 0,
        totalLoyaltyPoints: stats.total_loyalty_points || 0,

        lowStockItems: (stats.low_stock_items || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            weight: Number(item.gross_weight),
            metalType: item.metal_type
        })),

        loyaltyMembers: stats.loyalty_members_count || 0,
        customerSparkline: stats.customer_sparkline || [],

        topLoyaltyCustomer: stats.top_loyalty_customer || null,
        topCustomerAllTime: stats.top_customer_by_spend || null,

        // Scheme Stats
        totalSchemes: stats.scheme_count || 0,
        activeEnrollments: stats.active_enrollments_count || 0,
        totalSchemeCollected: stats.total_scheme_collected || 0,
        totalGoldAccumulated: 0 // Not yet tracked
    };
}

// Export cached function
export const getAdditionalStats = fetchAdditionalStatsCached;

export async function getSchemeStats(shopId: string) {
    const supabase = await createClient();

    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    const [activeResult, liabilityResult, maturityResult, collectionResult] = await Promise.all([
        // 1. Active Enrollments
        supabase
            .from('scheme_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('shop_id', shopId)
            .eq('status', 'ACTIVE'),

        // 2. Total Gold Liability
        supabase
            .from('scheme_enrollments')
            .select('total_gold_weight_accumulated')
            .eq('shop_id', shopId)
            .eq('status', 'ACTIVE'),

        // 3. Upcoming Maturities (Next 30 days)
        supabase
            .from('scheme_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('shop_id', shopId)
            .eq('status', 'ACTIVE')
            .gte('maturity_date', today.toISOString())
            .lte('maturity_date', next30Days.toISOString()),

        // 4. Monthly Collection (Sum of fixed amounts)
        supabase
            .from('scheme_enrollments')
            .select('scheme:schemes!inner(scheme_amount)')
            .eq('shop_id', shopId)
            .eq('status', 'ACTIVE')
    ]);

    const totalGoldLiability = liabilityResult.data?.reduce((sum, row) => sum + (Number(row.total_gold_weight_accumulated) || 0), 0) || 0;

    // Calculate Monthly Collection (Total Value of active fixed schemes)
    const monthlyCollection = collectionResult.data?.reduce((sum, row: any) => {
        const scheme = Array.isArray(row.scheme) ? row.scheme[0] : row.scheme;
        // Ensure we only sum if scheme_amount is a valid number (> 0 implies fixed/defined)
        return sum + (Number(scheme?.scheme_amount) || 0);
    }, 0) || 0;

    return {
        activeEnrollments: activeResult.count || 0,
        totalGoldLiability,
        upcomingMaturities: maturityResult.count || 0,
        monthlyCollection
    };
}

export async function getReferralStats(shopId: string) {
    const supabase = await createClient();

    // Count total referrals
    const { count: totalReferrals } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId)
        .not('referred_by', 'is', null);

    // Get referrals to calculate top referrer
    const { data: referrals } = await supabase
        .from('customers')
        .select('referred_by, referrer:referred_by(name)')
        .eq('shop_id', shopId)
        .not('referred_by', 'is', null);

    // Aggregate
    const referralCounts: Record<string, { count: number, name: string }> = {};
    referrals?.forEach((r: any) => {
        const id = r.referred_by;
        if (id) {
            if (!referralCounts[id]) {
                // r.referrer might be an array if the relationship is inferred as One-to-Many, 
                // but here we are selecting the parent, so it should be an object or array of 1.
                const name = Array.isArray(r.referrer) ? r.referrer[0]?.name : r.referrer?.name || 'Unknown';
                referralCounts[id] = { count: 0, name };
            }
            referralCounts[id].count++;
        }
    });

    const sorted = Object.values(referralCounts).sort((a, b) => b.count - a.count);
    const topReferrer = sorted[0] || null;

    return {
        totalReferrals: totalReferrals || 0,
        topReferrer
    };
}
