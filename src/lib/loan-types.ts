/**
 * Jewellery Loan Management Type Definitions
 */

export type LoanCustomer = {
    id: string;
    shop_id: string;
    name: string;
    phone: string;
    email?: string | null;
    address?: string | null;
    pan?: string | null;
    aadhaar?: string | null;
    kyc_document_url?: string | null;
    photo_url?: string | null;
    created_at: string;
    updated_at: string;
};

export type LoanStatus = 'active' | 'closed' | 'overdue' | 'rejected';

export type Loan = {
    id: string;
    shop_id: string;
    customer_id: string;
    loan_number: string;
    status: LoanStatus;
    repayment_type?: 'interest_only' | 'emi' | 'bullet';
    principal_amount: number;
    interest_rate: number; // Annual rate in %
    tenure_months?: number;
    emi_amount?: number;
    start_date: string;
    end_date?: string | null;
    total_interest_accrued: number;
    total_amount_paid: number;
    settlement_amount?: number | null;
    settlement_notes?: string | null;
    created_at: string;
    updated_at: string;

    // Joined fields
    customer?: LoanCustomer;
    collateral?: LoanCollateral[];
    payments?: LoanPayment[];
};

export type LoanCollateralType = 'gold' | 'silver' | 'diamond' | 'other';

export type LoanCollateral = {
    id: string;
    loan_id: string;
    item_name: string;
    item_type: LoanCollateralType;
    gross_weight: number;
    net_weight: number;
    purity?: string | null;
    estimated_value?: number | null;
    description?: string | null;
    photo_urls?: string[] | null;
    created_at: string;
};

export type LoanPaymentType = 'principal' | 'interest' | 'full_settlement';
export type LoanPaymentMethod = 'cash' | 'upi' | 'bank_transfer';

export type LoanPayment = {
    id: string;
    loan_id: string;
    payment_date: string;
    amount: number;
    payment_type: LoanPaymentType;
    payment_method: LoanPaymentMethod;
    notes?: string | null;
    created_at: string;
};

// Form Input Types
export type CreateLoanCustomerInput = Omit<LoanCustomer, 'id' | 'shop_id' | 'created_at' | 'updated_at'>;

export type CreateLoanCollateralInput = Omit<LoanCollateral, 'id' | 'loan_id' | 'created_at'>;

export type CreateLoanInput = {
    customer_id: string;
    principal_amount: number;
    interest_rate: number;
    start_date: string;
    collateral: CreateLoanCollateralInput[];
};

export type CreateLoanPaymentInput = Omit<LoanPayment, 'id' | 'created_at'>;

// Dashboard Stats
export type LoanDashboardStats = {
    total_active_loans: number;
    total_principal_disbursed: number; // Sum of principal of active loans
    total_interest_earned: number; // Sum of interest payments
    total_overdue_loans: number;
};
