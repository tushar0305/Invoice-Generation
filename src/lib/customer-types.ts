/**
 * Customer type definitions for the application
 */

// Full customer record from database
export interface Customer {
    id: string;
    shop_id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    state: string | null;
    pincode: string | null;
    loyalty_points: number;
    created_at: string;
    updated_at: string;
}

// Customer with FTS highlights for search results
export interface CustomerSearchResult extends Pick<Customer, 'id' | 'name' | 'email' | 'phone'> {
    rank?: number;
    name_highlight?: string | null;
    email_highlight?: string | null;
    phone_highlight?: string | null;
}

// Customer creation payload
export interface CreateCustomerPayload {
    shopId: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    state?: string;
    pincode?: string;
}

// Customer update payload
export interface UpdateCustomerPayload {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    state?: string;
    pincode?: string;
}
