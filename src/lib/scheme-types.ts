/**
 * Type definitions for Gold Schemes module
 */

export interface SchemeRules {
    grace_period_days: number;
    max_missed_payments: number;
    benefit_type: 'LAST_FREE' | 'BONUS_PERCENT' | 'FIXED_BONUS';
    benefit_value: number; // Percentage or Amount based on type
    making_charge_discount?: number; // Percentage
    gold_conversion: 'MONTHLY' | 'MATURITY';
    gold_purity: '22K' | '24K';
    allow_partial_payment?: boolean;
}

export interface Scheme {
    id: string;
    shop_id: string;
    name: string;
    type: 'FIXED_AMOUNT' | 'VARIABLE_AMOUNT';
    duration_months: number;
    scheme_amount?: number | null; // For fixed amount schemes
    rules: SchemeRules;
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
    type: 'FIXED_AMOUNT' | 'VARIABLE_AMOUNT';
    duration_months: number;
    scheme_amount?: number;
    rules: SchemeRules;
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
