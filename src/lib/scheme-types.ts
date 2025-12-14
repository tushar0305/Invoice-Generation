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
    duration_months: number;
    installment_amount: number; // For fixed plans
    bonus_months: number; // e.g. 1 month bonus
    interest_rate: number; // For flexible plans
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
    description?: string;
    scheme_type: 'FIXED_DURATION' | 'FLEXIBLE';
    duration_months: number;
    installment_amount?: number;
    bonus_months?: number;
    interest_rate?: number;
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
