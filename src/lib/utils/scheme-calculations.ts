import { Scheme, SchemeEnrollment } from '@/lib/scheme-types';

export interface RedemptionCalculation {
    principalAmount: number;
    principalWeight: number;
    benefitAmount: number;
    benefitDescription: string;
    totalPayoutAmount: number;
    totalPayoutWeight: number;
    isEligibleForBenefit: boolean;
}

/**
 * Calculates the redemption/maturity value for a scheme enrollment.
 * 
 * @param scheme The scheme details
 * @param enrollment The enrollment details (total paid, weight)
 * @param currentGoldRate Current market rate for gold (required for Gold SIP valuation)
 * @param isMatured Whether the scheme has completed its duration (affects benefit eligibility)
 */
export function calculateRedemptionValue(
    scheme: Scheme,
    enrollment: SchemeEnrollment,
    currentGoldRate: number = 0,
    isMatured: boolean = true
): RedemptionCalculation {
    const totalPaid = enrollment.total_paid || 0;
    const totalWeight = enrollment.total_gold_weight_accumulated || 0;
    
    let benefitAmount = 0;
    let benefitDescription = '';

    // 1. Calculate Benefit (only if matured/eligible)
    if (isMatured) {
        switch (scheme.benefit_type) {
            case 'BONUS_MONTH':
                // Usually for Fixed Duration: Benefit = Bonus Months * Monthly Installment
                const monthlyAmount = scheme.scheme_amount || 0;
                benefitAmount = (scheme.benefit_value || 0) * monthlyAmount;
                benefitDescription = `${scheme.benefit_value} Bonus Month(s)`;
                break;

            case 'INTEREST':
                // Benefit = Total Paid * Interest Rate %
                benefitAmount = (totalPaid * (scheme.benefit_value || 0)) / 100;
                benefitDescription = `${scheme.benefit_value}% Interest`;
                break;

            case 'FIXED_AMOUNT':
                benefitAmount = scheme.benefit_value || 0;
                benefitDescription = `Fixed Bonus`;
                break;

            case 'MAKING_CHARGE_DISCOUNT':
                // This is a discount on future purchase, not cash payout.
                benefitAmount = 0;
                benefitDescription = `Making Charge Discount (up to ${scheme.benefit_value}%)`;
                break;
        }
    }

    // 2. Calculate Totals based on Calculation Type
    if (scheme.calculation_type === 'WEIGHT_ACCUMULATION') {
        // Gold SIP
        // Value = (Accumulated Weight * Current Rate) + Cash Benefit
        const goldValue = totalWeight * currentGoldRate;
        
        return {
            principalAmount: totalPaid, // What they paid in cash
            principalWeight: totalWeight, // What they own in gold
            benefitAmount: benefitAmount,
            benefitDescription: benefitDescription,
            totalPayoutAmount: goldValue + benefitAmount, // Cash equivalent value
            totalPayoutWeight: totalWeight, // They get the gold (or equivalent)
            isEligibleForBenefit: isMatured
        };
    } else {
        // Flat Amount (Cash)
        return {
            principalAmount: totalPaid,
            principalWeight: 0,
            benefitAmount: benefitAmount,
            benefitDescription: benefitDescription,
            totalPayoutAmount: totalPaid + benefitAmount,
            totalPayoutWeight: 0,
            isEligibleForBenefit: isMatured
        };
    }
}

/**
 * Calculates gold weight for a given amount based on purity and rate.
 * Weight = Amount / Rate per gram
 */
export function calculateGoldWeight(amount: number, ratePerGram: number): number {
    if (ratePerGram <= 0) return 0;
    return Number((amount / ratePerGram).toFixed(3));
}

/**
 * Helper to calculate projected maturity value for display
 */
export function calculateMaturityValue(scheme: Scheme, currentTotalPaid: number): number {
    // Simple projection assuming full payment
    if (scheme.scheme_type === 'FIXED_DURATION') {
        const monthly = scheme.scheme_amount || 0;
        const duration = scheme.duration_months || 0;
        const principal = monthly * duration;
        
        // Calculate benefit on full principal
        let benefit = 0;
        if (scheme.benefit_type === 'BONUS_MONTH') {
            benefit = (scheme.benefit_value || 0) * monthly;
        } else if (scheme.benefit_type === 'INTEREST') {
            benefit = (principal * (scheme.benefit_value || 0)) / 100;
        } else if (scheme.benefit_type === 'FIXED_AMOUNT') {
            benefit = scheme.benefit_value || 0;
        }
        
        return principal + benefit;
    }
    
    // For flexible, we can only project based on current paid + interest
    let benefit = 0;
    if (scheme.benefit_type === 'INTEREST') {
        benefit = (currentTotalPaid * (scheme.benefit_value || 0)) / 100;
    }
    return currentTotalPaid + benefit;
}

/**
 * Checks if a payment is late.
 */
export function isPaymentLate(dueDate: Date, paymentDate: Date, gracePeriodDays: number): boolean {
    const deadline = new Date(dueDate);
    deadline.setDate(deadline.getDate() + gracePeriodDays);
    return paymentDate > deadline;
}
