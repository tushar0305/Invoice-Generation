'use server';

import { createClient } from '@/supabase/server';
import { format } from 'date-fns';

export interface GstReportData {
    invoices: any[];
    hsnSummary: any[];
}

export async function getGstReportData(shopId: string, dateRange?: { from: Date; to?: Date }): Promise<GstReportData> {
    const supabase = await createClient();

    let query = supabase
        .from('invoices')
        .select(`
            *,
            customer:customers(name, phone, gst_number, state),
            items:invoice_items(
                hsn_code,
                gross_weight,
                net_weight,
                amount,
                rate,
                making
            )
        `)
        .eq('shop_id', shopId)
        .eq('status', 'paid') // GST usually reports paid/finalized invoices
        .is('deleted_at', null)
        .order('invoice_date', { ascending: true });

    if (dateRange?.from) {
        query = query.gte('invoice_date', format(dateRange.from, 'yyyy-MM-dd'));
        if (dateRange.to) {
            query = query.lte('invoice_date', format(dateRange.to, 'yyyy-MM-dd'));
        } else {
            query = query.lte('invoice_date', format(dateRange.from, 'yyyy-MM-dd'));
        }
    }

    const { data: invoices, error } = await query;

    if (error) {
        console.error('Error fetching GST report data:', error);
        throw new Error('Failed to fetch GST data');
    }

    // Process HSN Summary
    const hsnMap = new Map<string, {
        hsn_code: string;
        description: string; // We might not have this easily without joining inventory, using generic
        uqc: string; // Unit Quantity Code - usually GMS for gold
        total_quantity: number;
        total_value: number;
        taxable_value: number;
        integrated_tax_amount: number;
        central_tax_amount: number;
        state_tax_amount: number;
        cess_amount: number;
    }>();

    // Get shop tax rates for calculation (assuming flat rate for now or per item if stored)
    // In a real app, tax rate should be stored per invoice item. 
    // For now, we'll infer from invoice level or shop settings.
    // Let's fetch shop settings to get default rates if needed.
    const { data: shop } = await supabase.from('shops').select('cgst_rate, sgst_rate').eq('id', shopId).single();
    const cgstRate = Number(shop?.cgst_rate) || 1.5;
    const sgstRate = Number(shop?.sgst_rate) || 1.5;
    const igstRate = cgstRate + sgstRate;

    invoices?.forEach(inv => {
        const isInterState = false; // Logic to check state vs shop state could go here
        const invCgstRate = Number(inv.cgst_amount) > 0 ? (Number(inv.cgst_amount) / Number(inv.subtotal)) * 100 : cgstRate;
        const invSgstRate = Number(inv.sgst_amount) > 0 ? (Number(inv.sgst_amount) / Number(inv.subtotal)) * 100 : sgstRate;

        inv.items?.forEach((item: any) => {
            const hsn = item.hsn_code || '7113'; // Default HSN for Jewellery
            const weight = Number(item.net_weight) || 0;
            // Item amount is (weight * rate) + (weight * making) usually
            // But we have 'amount' generated column in schema? 
            // Schema says: amount NUMERIC GENERATED ALWAYS AS ((net_weight * rate) + (net_weight * making)) STORED
            const taxableValue = Number(item.amount) || 0;

            if (!hsnMap.has(hsn)) {
                hsnMap.set(hsn, {
                    hsn_code: hsn,
                    description: 'Gold Jewellery',
                    uqc: 'GMS',
                    total_quantity: 0,
                    total_value: 0,
                    taxable_value: 0,
                    integrated_tax_amount: 0,
                    central_tax_amount: 0,
                    state_tax_amount: 0,
                    cess_amount: 0
                });
            }

            const entry = hsnMap.get(hsn)!;
            entry.total_quantity += weight;
            entry.taxable_value += taxableValue;

            // Tax calc
            if (isInterState) {
                entry.integrated_tax_amount += taxableValue * (igstRate / 100);
            } else {
                entry.central_tax_amount += taxableValue * (invCgstRate / 100);
                entry.state_tax_amount += taxableValue * (invSgstRate / 100);
            }

            entry.total_value += taxableValue + (isInterState ? (taxableValue * igstRate / 100) : (taxableValue * (invCgstRate + invSgstRate) / 100));
        });
    });

    return {
        invoices: invoices || [],
        hsnSummary: Array.from(hsnMap.values())
    };
}
