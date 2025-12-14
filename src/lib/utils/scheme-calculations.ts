import { Scheme, SchemeEnrollment, SchemeTransaction } from '@/lib/scheme-types';

/**
 * Calculates the maturity benefit based on scheme rules and total paid.
 */
/**
 * Calculates the maturity benefit based on scheme rules.
 */
export function calculateMaturityBenefit(
    scheme: Scheme,
    totalPaid: number,
): number {
    if (scheme.scheme_type === 'FIXED_DURATION') {
        // Benefit = Monthly Installment * Bonus Months
        return (scheme.installment_amount || 0) * (scheme.bonus_months || 0);
    }

    if (scheme.scheme_type === 'FLEXIBLE') {
        // Benefit = Total Paid * Interest Rate / 100
        return (totalPaid * (scheme.interest_rate || 0)) / 100;
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
 * Calculates the projected maturity value.
 * For fixed schemes, returns full projected value.
 * For flexible schemes, returns current value + interest.
 */
export function calculateMaturityValue(scheme: Scheme, currentTotalPaid: number): number {
    if (scheme.scheme_type === 'FIXED_DURATION') {
        // Projected Principal = Monthly * Duration
        const principal = (scheme.installment_amount || 0) * scheme.duration_months;
        const benefit = calculateMaturityBenefit(scheme, projectedPrincipal(scheme, currentTotalPaid));
        // Wait, benefit for fixed is fixed.
        return principal + ((scheme.installment_amount || 0) * (scheme.bonus_months || 0));
    }

    // Flexible
    const benefit = calculateMaturityBenefit(scheme, currentTotalPaid);
    return currentTotalPaid + benefit;
}

function projectedPrincipal(scheme: Scheme, current: number): number {
    if (scheme.scheme_type === 'FIXED_DURATION') {
        return (scheme.installment_amount || 0) * scheme.duration_months;
    }
    return current;
}

/**
 * Checks if a payment is late.
 */
export function isPaymentLate(dueDate: Date, paymentDate: Date, gracePeriodDays: number): boolean {
    const deadline = new Date(dueDate);
    deadline.setDate(deadline.getDate() + gracePeriodDays);
    return paymentDate > deadline;
}
