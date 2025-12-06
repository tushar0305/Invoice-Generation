'use server';

import { createClient } from '@/supabase/server';
import { startOfMonth, subMonths, startOfDay, endOfDay, startOfWeek } from 'date-fns';
import { getCatalogueStats } from '@/actions/catalogue-actions';

export async function getDashboardData(shopId: string) {
    const supabase = await createClient();
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const startOfLastMonth = startOfMonth(subMonths(now, 1));

    // Fetch Recent Invoices (last 30)
    const { data: recentInvoices } = await supabase
        .from('invoices')
        .select('*, customer:customers(name, phone)')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })
        .limit(30);

    // Fetch Monthly Revenue
    const { data: currentMonthInvoices } = await supabase
        .from('invoices')
        .select('grand_total')
        .eq('shop_id', shopId)
        .eq('status', 'paid')
        .gte('created_at', startOfCurrentMonth.toISOString());

    const totalPaidThisMonth = currentMonthInvoices?.reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0) || 0;
    const totalOrdersThisMonth = currentMonthInvoices?.length || 0; // Exact count for health widget

    // Fetch Last Month Revenue for MoM
    const { data: lastMonthInvoices } = await supabase
        .from('invoices')
        .select('grand_total')
        .eq('shop_id', shopId)
        .eq('status', 'paid')
        .gte('created_at', startOfLastMonth.toISOString())
        .lt('created_at', startOfCurrentMonth.toISOString());

    const totalPaidLastMonth = lastMonthInvoices?.reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0) || 0;

    let revenueMoM = 0;
    if (totalPaidLastMonth > 0) {
        revenueMoM = ((totalPaidThisMonth - totalPaidLastMonth) / totalPaidLastMonth) * 100;
    } else if (totalPaidThisMonth > 0) {
        revenueMoM = 100;
    }

    // Fetch Due Invoices
    const { data: dueInvoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('shop_id', shopId)
        .eq('status', 'due');

    // Calculate Today and Week Revenue (simple filter from recent)
    const today = new Date();
    const startOfTodayDate = startOfDay(today);
    const startOfWeekDate = startOfWeek(today);

    // Ideally we should query these separately for accuracy if recentInvoices is limited to 30
    // But for now let's do a quick separate query for accuracy
    const { data: todayInvoices } = await supabase
        .from('invoices')
        .select('grand_total')
        .eq('shop_id', shopId)
        .eq('status', 'paid')
        .gte('created_at', startOfTodayDate.toISOString());

    const totalPaidToday = todayInvoices?.reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0) || 0;

    const { data: weekInvoices } = await supabase
        .from('invoices')
        .select('grand_total')
        .eq('shop_id', shopId)
        .eq('status', 'paid')
        .gte('created_at', startOfWeekDate.toISOString());

    const totalPaidThisWeek = weekInvoices?.reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0) || 0;

    // Fetch Catalogue Stats
    const catalogueStats = await getCatalogueStats(shopId);

    // normalize invoices for the UI
    const normalizedRecent = (recentInvoices || []).map((inv: any) => ({
        ...inv,
        customer_name: inv.customer?.name || 'Walk-in',
        customer_phone: inv.customer?.phone || '',
        grand_total: Number(inv.grand_total) || 0,
    }));

    const normalizedDue = (dueInvoices || []).map((inv: any) => ({
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
}

export async function getMarketRates() {
    // Mock Data for now
    return {
        gold: { rate_24k: 7250, rate_22k: 6800, trend: 'up' },
        silver: { rate_1kg: 78000, trend: 'down' },
        updated_at: new Date().toISOString(),
    };
}

export async function getAdditionalStats(shopId: string) {
    const supabase = await createClient();

    // Example: Total Customers
    const { count: customerCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId);

    // Example: Total Products/Stock
    const { count: productCount } = await supabase
        .from('stock_items')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId);

    const { count: totalInvoices } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', shopId);

    return {
        customerCount: customerCount || 0,
        productCount: productCount || 0,
        totalInvoices: totalInvoices || 0,
        activeLoans: 0, // Mock
        khataBalance: 0, // Mock
        totalLoyaltyPoints: 0, // Mock
        lowStockItems: [], // Mock array
        loyaltyMembers: 0, // Mock
    };
}
