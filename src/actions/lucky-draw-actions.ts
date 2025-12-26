'use server';

import { createClient } from '@/supabase/server';
import { revalidatePath } from 'next/cache';

export type EligibleParticipant = {
    enrollmentId: string;
    customerName: string;
    schemeName: string;
    accountNumber: string;
    totalPaidInMonth: number;
    paymentCount: number;
};

export async function getEligibleParticipants(shopId: string, month: number, year: number) {
    const supabase = await createClient();
    
    // Calculate start and end of the month
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

    // Get payments in this range
    const { data: payments, error } = await supabase
        .from('scheme_payments')
        .select(`
            amount,
            enrollment_id,
            enrollment:scheme_enrollments (
                id,
                account_number,
                customer:customers (name),
                scheme:schemes (name)
            )
        `)
        .eq('shop_id', shopId)
        .gte('payment_date', startDate)
        .lte('payment_date', endDate);

    if (error) {
        console.error('Error fetching eligible participants:', error);
        throw new Error('Failed to fetch eligible participants');
    }

    // Aggregate by enrollment
    const participantsMap = new Map<string, EligibleParticipant>();

    payments?.forEach((payment: any) => {
        if (!payment.enrollment) return;

        const existing = participantsMap.get(payment.enrollment_id);
        if (existing) {
            existing.totalPaidInMonth += payment.amount;
            existing.paymentCount += 1;
        } else {
            participantsMap.set(payment.enrollment_id, {
                enrollmentId: payment.enrollment.id,
                customerName: payment.enrollment.customer?.name || 'Unknown',
                schemeName: payment.enrollment.scheme?.name || 'Unknown',
                accountNumber: payment.enrollment.account_number,
                totalPaidInMonth: payment.amount,
                paymentCount: 1
            });
        }
    });

    return Array.from(participantsMap.values());
}

export async function saveLuckyDrawWinner(
    shopId: string, 
    month: number, 
    year: number, 
    winnerEnrollmentId: string, 
    prize: string
) {
    const supabase = await createClient();
    const drawPeriod = new Date(year, month - 1, 1).toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('lucky_draws')
        .insert({
            shop_id: shopId,
            draw_period: drawPeriod,
            winner_enrollment_id: winnerEnrollmentId,
            prize_details: prize
        })
        .select()
        .single();

    if (error) {
        if (error.code === '23505') { // Unique violation
            throw new Error('A lucky draw has already been conducted for this month.');
        }
        console.error('Error saving lucky draw:', error);
        throw new Error('Failed to save lucky draw winner');
    }

    revalidatePath(`/shop/${shopId}/marketing/lucky-draw`);
    return data;
}

export async function getDrawHistory(shopId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('lucky_draws')
        .select(`
            *,
            enrollment:scheme_enrollments (
                account_number,
                customer:customers (name, phone),
                scheme:schemes (name)
            )
        `)
        .eq('shop_id', shopId)
        .order('draw_period', { ascending: false });

    if (error) {
        console.error('Error fetching draw history:', error);
        throw new Error('Failed to fetch draw history');
    }

    return data;
}
