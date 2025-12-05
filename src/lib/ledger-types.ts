/**
 * Ledger (formerly Khata) Type Definitions
 * For tracking customer credit/debit transactions
 */

export type LedgerTransaction = {
    id: string;
    shop_id: string;
    customer_id: string;
    invoice_id?: string | null;
    transaction_type: 'INVOICE' | 'PAYMENT' | 'ADJUSTMENT';
    amount: number;
    entry_type: 'DEBIT' | 'CREDIT'; // DEBIT: Customer owes more, CREDIT: Customer pays
    description?: string | null;
    transaction_date: string; // Date in ISO format (YYYY-MM-DD)
    created_at: string;
    created_by?: string | null;

    // Joined fields
    customer?: {
        name: string;
        phone?: string | null;
    };
};

export type CustomerBalance = {
    id: string;
    shop_id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    total_spent: number; // Total invoiced amount
    total_paid: number; // Total payments received
    current_balance: number; // total_spent - total_paid (Positive means they owe us)
    last_transaction_date?: string | null;
};

export type LedgerStats = {
    total_customers: number;
    total_receivable: number; // Total amount we need to receive (positive balances)
    total_payable: number; // Total amount we need to pay (negative balances - rare in this context but possible)
    net_balance: number; // receivable - payable
};

export type CreateLedgerTransactionInput = {
    shop_id: string;
    customer_id: string;
    transaction_type: 'PAYMENT' | 'ADJUSTMENT';
    amount: number;
    entry_type: 'DEBIT' | 'CREDIT';
    description?: string;
    transaction_date: Date;
};
