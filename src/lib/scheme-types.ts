/**
 * Type definitions for Gold Schemes module
 */

// SchemeRules interface removed as schema is flattened

export interface Scheme {
    id: string;
    shop_id: string;
    name: string;
    description: string | null;
    scheme_type: 'FIXED_DURATION' | 'FLEXIBLE';
    
    // Next-Gen Features
    calculation_type: 'FLAT_AMOUNT' | 'WEIGHT_ACCUMULATION';
    payment_frequency: 'MONTHLY' | 'WEEKLY' | 'DAILY' | 'FLEXIBLE';
    min_amount: number;
    benefit_type: 'BONUS_MONTH' | 'INTEREST' | 'MAKING_CHARGE_DISCOUNT' | 'FIXED_AMOUNT';
    benefit_value: number;

    duration_months: number;
    scheme_amount: number; // For fixed plans (DB column: scheme_amount)
    bonus_months: number; // Legacy: mapped to benefit_type = BONUS_MONTH
    interest_rate: number; // Legacy: mapped to benefit_type = INTEREST
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export type SchemeStatus = 'ACTIVE' | 'MATURED' | 'CLOSED' | 'CANCELLED';

export interface SchemeEnrollment {
    id: string;
    shop_id: string;
    customer_id: string;
    scheme_id: string;
    account_number: string;
    start_date: string; // ISO Date
    maturity_date: string; // ISO Date
    status: SchemeStatus;
    total_paid: number;
    total_gold_weight_accumulated: number;
    
    // Next-Gen Tracking
    target_weight?: number;
    target_amount?: number;
    current_weight_balance?: number;

    created_at: string;
    updated_at: string;

    // Joined fields
    scheme?: Scheme;
    customer?: {
        name: string;
        phone: string | null;
    };
}

export type TransactionType = 'INSTALLMENT' | 'BONUS' | 'FINE' | 'ADJUSTMENT';
export type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'OTHER';

export interface SchemeTransaction {
    id: string;
    enrollment_id: string;
    shop_id: string;
    transaction_type: TransactionType;
    amount: number;
    gold_rate?: number | null;
    gold_weight?: number | null;
    payment_date: string;
    payment_mode?: PaymentMode | null;
    status: 'PAID' | 'DUE' | 'OVERDUE';
    description?: string | null;
    created_at: string;
}

export interface SchemeRedemption {
    id: string;
    enrollment_id: string;
    shop_id: string; // Added to match schema
    redeemed_date: string;
    payout_amount: number;
    payout_gold_weight?: number | null;
    bonus_applied: number;
    invoice_id?: string | null;
    created_at: string;
}

// Payloads for mutations

export interface CreateSchemePayload {
    shop_id: string;
    name: string;
    scheme_type: 'FIXED_DURATION' | 'FLEXIBLE';
    
    // Next-Gen
    calculation_type?: 'FLAT_AMOUNT' | 'WEIGHT_ACCUMULATION';
    payment_frequency?: 'MONTHLY' | 'WEEKLY' | 'DAILY' | 'FLEXIBLE';
    min_amount?: number;
    benefit_type?: 'BONUS_MONTH' | 'INTEREST' | 'MAKING_CHARGE_DISCOUNT' | 'FIXED_AMOUNT';
    benefit_value?: number;

    duration_months: number;
    scheme_amount?: number; // Mapped from installment_amount
    rules?: any;
}

export interface EnrollCustomerPayload {
    shop_id: string;
    customer_id: string;
    scheme_id: string;
    account_number?: string; // Can be auto-generated
    start_date: string;
}

export interface RecordPaymentPayload {
    enrollment_id: string;
    shop_id: string;
    amount: number;
    payment_mode: PaymentMode;
    gold_rate?: number;
    transaction_type?: TransactionType;
    description?: string;
}
