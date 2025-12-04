/**
 * Khata Book (Customer Ledger) Type Definitions
 * For tracking customer credit/debit transactions
 */

export type KhataCustomer = {
    id: string;
    shop_id: string;
    user_id: string;
    name: string;
    phone?: string | null;
    address?: string | null;
    opening_balance: number;
    created_at: string;
    updated_at: string;
};

export type KhataTransaction = {
    id: string;
    shop_id: string;
    user_id: string;
    customer_id: string;
    type: 'given' | 'received'; // given = credit (you gave them goods), received = debit (you received payment)
    amount: number;
    description?: string | null;
    invoice_id?: string | null;
    transaction_date: string; // Date in ISO format
    created_at: string;
    updated_at: string;
};

export type KhataCustomerBalance = {
    id: string;
    shop_id: string;
    user_id: string;
    name: string;
    phone?: string | null;
    address?: string | null;
    opening_balance: number;
    total_given: number; // Total amount given to customer (credit)
    total_received: number; // Total amount received from customer (debit)
    current_balance: number; // Calculated: opening_balance + total_given - total_received
    created_at: string;
    updated_at: string;
};

// Form types for creating/editing
export type CreateKhataCustomerInput = Omit<KhataCustomer, 'id' | 'created_at' | 'updated_at'> & {
    opening_balance?: number; // Optional, defaults to 0
};

export type UpdateKhataCustomerInput = Partial<Omit<KhataCustomer, 'id' | 'shop_id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type CreateKhataTransactionInput = Omit<KhataTransaction, 'id' | 'created_at' | 'updated_at'> & {
    transaction_date?: string; // Optional, defaults to today
};

export type UpdateKhataTransactionInput = Partial<Omit<KhataTransaction, 'id' | 'shop_id' | 'user_id' | 'customer_id' | 'created_at' | 'updated_at'>>;

// Stats and analytics types
export type KhataStats = {
    total_customers: number;
    total_receivable: number; // Total amount we need to receive (positive balances)
    total_payable: number; // Total amount we need to pay (negative balances)
    net_balance: number; // receivable - payable
};

export type KhataDashboardData = {
    stats: KhataStats;
    recent_transactions: KhataTransaction[];
    top_debtors: KhataCustomerBalance[]; // Customers who owe us the most
    top_creditors: KhataCustomerBalance[]; // Customers we owe the most
};

// Search and filter types
export type KhataCustomerFilter = {
    search?: string;
    min_balance?: number;
    max_balance?: number;
    balance_type?: 'positive' | 'negative' | 'zero'; // receivable, payable, or settled
};

export type KhataTransactionFilter = {
    customer_id?: string;
    type?: 'given' | 'received';
    start_date?: string;
    end_date?: string;
    search?: string; // Search in description
};
