import { useMemo } from 'react';
import type { LoyaltySettings } from '@/lib/loyalty-types';

export interface InvoiceItem {
    id: string;
    description: string;
    purity: string;
    hsnCode?: string;
    metalType?: string;
    category?: string;
    grossWeight: number;
    netWeight: number;
    stoneWeight: number;
    wastagePercent: number;
    rate: number;
    makingRate: number;
    making: number;
    stoneAmount: number;
    stockId?: string;
    tagId?: string;
}

export interface CalculationResult {
    subtotal: number;
    loyaltyDiscount: number;
    totalDiscount: number;
    sgstAmount: number;
    cgstAmount: number;
    grandTotal: number;
    pointsToEarn: number;
}

interface UseInvoiceCalculationsProps {
    items: InvoiceItem[];
    discount: number;
    redeemPoints: boolean;
    pointsToRedeem: number;
    loyaltySettings: LoyaltySettings | null;
    sgstRate: number;
    cgstRate: number;
    currentRate: number;
}

export function useInvoiceCalculations({
    items,
    discount,
    redeemPoints,
    pointsToRedeem,
    loyaltySettings,
    sgstRate,
    cgstRate,
    currentRate
}: UseInvoiceCalculationsProps): CalculationResult {

    return useMemo(() => {
        const subtotal = items?.reduce((acc, item) => {
            const netWeight = Number(item.netWeight) || 0;
            // Use item rate if set, else fallback to global currentRate
            const rate = (Number(item.rate) || Number(currentRate) || 0);

            const makingRate = Number(item.makingRate) || 0;
            const makingAmount = makingRate * netWeight;
            const stoneAmount = Number(item.stoneAmount) || 0;

            // Total = (Net * Rate) + Making + Stone
            return acc + (netWeight * rate) + makingAmount + stoneAmount;
        }, 0) || 0;

        let loyaltyDiscount = 0;
        if (redeemPoints && pointsToRedeem && loyaltySettings) {
            loyaltyDiscount = pointsToRedeem * loyaltySettings.redemption_conversion_rate;
        }

        // Tax Calculation (Before Discount)
        // Taxable Amount = Subtotal
        const taxableAmount = Math.max(0, subtotal);
        const sgstAmount = taxableAmount * (sgstRate / 100);
        const cgstAmount = taxableAmount * (cgstRate / 100);
        
        // Total Before Discount
        const totalBeforeDiscount = taxableAmount + sgstAmount + cgstAmount;

        // Total Discount (Cash + Loyalty)
        const totalDiscount = (Number(discount) || 0) + loyaltyDiscount;

        // Grand Total = (Subtotal + Tax) - Discount
        const grandTotal = Math.max(0, totalBeforeDiscount - totalDiscount);

        // Points to Earn
        let pointsToEarn = 0;
        if (loyaltySettings?.earning_type === 'flat' && loyaltySettings.flat_points_ratio) {
            pointsToEarn = Math.floor(grandTotal * loyaltySettings.flat_points_ratio);
        } else if (loyaltySettings?.earning_type === 'percentage' && loyaltySettings.percentage_back) {
            pointsToEarn = Math.floor(grandTotal * (loyaltySettings.percentage_back / 100));
        }

        return {
            subtotal,
            loyaltyDiscount,
            totalDiscount,
            sgstAmount,
            cgstAmount,
            grandTotal,
            pointsToEarn
        };
    }, [items, discount, redeemPoints, pointsToRedeem, loyaltySettings, sgstRate, cgstRate, currentRate]);
}
