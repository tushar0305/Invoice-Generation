import { Scheme, SchemeEnrollment, SchemeTransaction } from '@/lib/scheme-types';

/**
 * Calculates the maturity benefit based on scheme rules and total paid.
 */
export function calculateMaturityBenefit(
    scheme: Scheme,
    totalPaid: number,
    installmentsPaid: number
): number {
    const { rules } = scheme;

    if (rules.benefit_type === 'LAST_FREE') {
        // Assuming equal monthly installments for fixed amount
        // If variable, this logic might need adjustment (e.g. average of last X months)
        // For fixed: Benefit is 1 installment amount. 
        // But if totalPaid is < expected, we need to be careful. 
        // Simply: return 1 installment value if condition met.
        return scheme.scheme_amount || (totalPaid / installmentsPaid);
    }

    if (rules.benefit_type === 'BONUS_PERCENT') {
        return (totalPaid * rules.benefit_value) / 100;
    }

    if (rules.benefit_type === 'FIXED_BONUS') {
        return rules.benefit_value;
    }

    return 0;
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
 * Calculates the potential maturity value (Principal + Benefit).
 */
export function calculateMaturityValue(scheme: Scheme, totalPaid: number): number {
    // This is an estimation for display
    const installments = Math.floor(totalPaid / (scheme.scheme_amount || 1)); // Rough estimate
    const benefit = calculateMaturityBenefit(scheme, totalPaid, installments || 1);
    return totalPaid + benefit;
}

/**
 * Checks if a payment is late.
 */
export function isPaymentLate(dueDate: Date, paymentDate: Date, gracePeriodDays: number): boolean {
    const deadline = new Date(dueDate);
    deadline.setDate(deadline.getDate() + gracePeriodDays);
    return paymentDate > deadline;
}
