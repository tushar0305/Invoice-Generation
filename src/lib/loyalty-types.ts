// =====================================================
// LOYALTY PROGRAM TYPE DEFINITIONS
// =====================================================
// Centralized TypeScript types for loyalty program
// Author: Tushar Kasaudhan
// Date: 2024-11-30
// =====================================================

/**
 * Shop Loyalty Settings Configuration
 * Stored in: shop_loyalty_settings table
 */
export interface LoyaltySettings {
    shop_id: string;
    is_enabled: boolean;

    // Earning Configuration
    earning_type: 'flat' | 'percentage';
    flat_points_ratio?: number | null;        // Points per currency unit (e.g. 0.01 = 1 point per 100)
    percentage_back?: number | null;          // Percentage of invoice amount (e.g. 1 = 1%)

    // Redemption Configuration
    redemption_enabled: boolean;
    redemption_conversion_rate: number;       // Value of 1 point in currency
    max_redemption_percentage?: number | null; // Max % of invoice value (e.g. 50 = 50%)
    min_points_required?: number | null;      // Minimum points needed to redeem (e.g. 100)
    allowed_categories?: string[] | null;     // Product categories eligible for redemption

    // Expiry Configuration
    points_validity_days?: number | null;     // NULL = never expire

    // Earning Conditions
    earn_on_discounted_items: boolean;
    earn_on_full_payment_only: boolean;
    excluded_categories?: string[] | null;

    // Metadata
    updated_at: string;
}

/**
 * Loyalty Transaction Log Entry
 * Stored in: customer_loyalty_logs table
 */
export interface LoyaltyLog {
    id: string;
    customer_id: string;
    shop_id: string;
    invoice_id?: string | null;
    points_change: number;                    // Positive for earning, negative for redemption
    reason: string;                           // Human-readable description
    created_at: string;
}

/**
 * Customer with Loyalty Information
 * Extended from base Customer type
 */
export interface CustomerWithLoyalty {
    id: string;
    user_id: string;
    shop_id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    gst_number?: string | null;
    loyalty_points: number;
    total_spent: number;
    last_visit_at?: string | null;
    notes?: string | null;
    tags?: string[] | null;
    created_at: string;
    updated_at: string;
}

/**
 * Form values for loyalty settings
 * Used in: loyalty-settings-form.tsx
 */
export interface LoyaltySettingsFormValues {
    isEnabled: boolean;
    earningType: 'flat' | 'percentage';
    flatPointsRatio?: number;
    percentageBack?: number;
    redemptionEnabled: boolean;
    redemptionConversionRate: number;
    maxRedemptionPercentage?: number;
    minPointsRequired?: number;
    pointsValidityDays?: number;
    earnOnDiscountedItems: boolean;
    earnOnFullPaymentOnly: boolean;
}

/**
 * Loyalty calculation result
 * Used for real-time calculations in invoice form
 */
export interface LoyaltyCalculation {
    pointsToEarn: number;
    maxRedeemablePoints: number;
    maxRedeemableValue: number;
    actualDiscount: number;
    newBalance: number;
}

/**
 * Loyalty redemption request
 * Client -> Server payload
 */
export interface LoyaltyRedemptionRequest {
    customerId: string;
    shopId: string;
    invoiceSubtotal: number;
    pointsToRedeem: number;
    settings: LoyaltySettings;
    currentBalance: number;
}

/**
 * Loyalty redemption validation result
 * Server response
 */
export interface LoyaltyValidationResult {
    valid: boolean;
    error?: string;
    discountAmount?: number;
    pointsAfterRedemption?: number;
}

/**
 * Dashboard Statistics
 * Aggregated loyalty metrics
 */
export interface LoyaltyDashboardStats {
    totalIssued: number;
    totalRedeemed: number;
    outstandingPoints: number;
    liability: number;                   // Outstanding points * conversion rate
    totalCustomers: number;
    averageBalance: number;
}
