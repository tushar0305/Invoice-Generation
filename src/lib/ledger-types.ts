/**
 * Ledger (Khata V2) Type Definitions
 * Universal ledger supporting Customers, Suppliers, Karigars, and Partners
 */

// Basic Contact Entity (Non-Customer)
export type KhatabookContact = {
    id: string;
    shop_id: string;
    name: string;
    phone: string | null;
    email?: string | null;
    address?: string | null;
    type: 'CUSTOMER' | 'SUPPLIER' | 'KARIGAR' | 'PARTNER' | 'OTHER';
    notes?: string | null;
    is_active: boolean; // mapped to is_deleted in view (is_active=false -> is_deleted=true)
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
};

// Start using KhatabookContact as the primary type
export type UnifiedParty = {
    id: string;
    shop_id: string;
    name: string;
    phone: string | null;
    email?: string | null;
    address?: string | null;
    entity_type: 'CUSTOMER' | 'SUPPLIER' | 'KARIGAR' | 'PARTNER' | 'OTHER';
    source_table: 'khatabook_contact'; // Always this for Khata V2

    // Aggregates
    total_debit: number;
    total_credit: number;
    current_balance: number;
    transaction_count: number;
    last_transaction_date?: string | null;

    // Legacy aliases
    total_spent?: number;
    total_paid?: number;

    is_deleted: boolean;
};

// Aliases for backward compatibility
export type CustomerBalance = UnifiedParty;

export type TransactionType =
    | 'INVOICE' | 'PAYMENT' | 'ADJUSTMENT'          // Legacy/Customer
    | 'SALE' | 'SALE_RETURN'                        // Customer V2
    | 'PURCHASE' | 'PURCHASE_RETURN'                // Supplier
    | 'WORK_ORDER' | 'MAKING_CHARGES'               // Karigar
    | 'JAMA' | 'ODHARA'                             // Generic
    | 'LOAN_GIVEN' | 'LOAN_RECEIVED' | 'SETTLEMENT'; // Loans

export type TransactionDocument = {
    id: string;
    transaction_id: string;
    file_name: string;
    file_type: string; // mime type
    storage_path: string;
    description?: string | null;
    uploaded_at: string;
};

export type LedgerTransaction = {
    id: string;
    shop_id: string;
    transaction_type: TransactionType;
    amount: number;
    entry_type: 'DEBIT' | 'CREDIT';
    description?: string | null;
    transaction_date: string;
    created_at: string;
    created_by?: string | null;

    // Joined fields
    customer?: {
        name: string;
        phone?: string | null;
    };
    documents?: TransactionDocument[];

    // Computed client-side
    balance_after?: number;
};

export type LedgerStats = {
    total_customers: number; // Total active entities
    total_receivable: number;
    total_payable: number;
    net_balance: number;
};

export type CreateLedgerEntryInput = {
    shop_id: string;
    entity_id: string;
    entity_type: 'customer' | 'contact';
    transaction_type: TransactionType;
    amount: number;
    entry_type: 'DEBIT' | 'CREDIT';
    description?: string;
    transaction_date: Date;
    // Optional Doc
    doc_path?: string;
    doc_type?: string;
    doc_name?: string;
};
