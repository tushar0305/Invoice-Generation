'use server';

import { createClient } from '@/supabase/server';

export type MaturityForecastItem = {
    enrollmentId: string;
    customerName: string;
    customerPhone: string;
    schemeName: string;
    maturityDate: string;
    type: 'WEIGHT_ACCUMULATION' | 'FLAT_AMOUNT' | 'FIXED_DURATION';
    accumulatedWeight: number;
    totalPaid: number;
    expectedPayoutValue: number; // Estimated value in INR
    status: string;
};

export type MaturitySummary = {
    totalCount: number;
    totalGoldWeight: number;
    totalCashLiability: number;
    monthlyBreakdown: Record<string, number>; // "Jan 2026": 50000
};

export async function getMaturityForecast(shopId: string, months: number = 6) {
    const supabase = await createClient();
    
    const startDate = new Date().toISOString();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);
    
    // Fetch enrollments maturing in the range
    const { data: enrollments, error } = await supabase
        .from('scheme_enrollments')
        .select(`
            id,
            maturity_date,
            total_paid,
            total_gold_weight_accumulated,
            status,
            customer:customers (name, phone),
            scheme:schemes (name, calculation_type, scheme_type)
        `)
        .eq('shop_id', shopId)
        .eq('status', 'ACTIVE')
        .gte('maturity_date', startDate)
        .lte('maturity_date', endDate.toISOString())
        .order('maturity_date', { ascending: true });

    if (error) {
        console.error('Error fetching maturity forecast:', error);
        throw new Error('Failed to fetch maturity forecast');
    }

    // Get current gold rate for estimation
    // In a real app, we'd fetch this from a DB or API. Using a fallback for now.
    const estimatedGoldRate = 7200; // per gram

    const forecast: MaturityForecastItem[] = enrollments.map((e: any) => {
        let expectedValue = 0;
        
        if (e.scheme.calculation_type === 'WEIGHT_ACCUMULATION') {
            expectedValue = e.total_gold_weight_accumulated * estimatedGoldRate;
        } else {
            expectedValue = e.total_paid; // Simplified: Add bonus logic if needed
        }

        return {
            enrollmentId: e.id,
            customerName: e.customer?.name || 'Unknown',
            customerPhone: e.customer?.phone || '',
            schemeName: e.scheme?.name || 'Unknown',
            maturityDate: e.maturity_date,
            type: e.scheme.calculation_type,
            accumulatedWeight: e.total_gold_weight_accumulated,
            totalPaid: e.total_paid,
            expectedPayoutValue: expectedValue,
            status: e.status
        };
    });

    // Calculate Summary
    const summary: MaturitySummary = {
        totalCount: forecast.length,
        totalGoldWeight: 0,
        totalCashLiability: 0,
        monthlyBreakdown: {}
    };

    forecast.forEach(item => {
        if (item.type === 'WEIGHT_ACCUMULATION') {
            summary.totalGoldWeight += item.accumulatedWeight;
        } else {
            summary.totalCashLiability += item.expectedPayoutValue;
        }

        // Monthly Breakdown
        const date = new Date(item.maturityDate);
        const key = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        summary.monthlyBreakdown[key] = (summary.monthlyBreakdown[key] || 0) + item.expectedPayoutValue;
    });

    return { forecast, summary };
}
