import { createClient } from '@/supabase/server';
import { getCurrentTimestamp } from './date-utils';

/**
 * Customer Utility Functions
 * Shared logic for customer creation and updates
 */

export type CustomerData = {
    shopId: string;
    userId: string;
    name: string;
    phone: string;
    address?: string;
    state?: string;
    pincode?: string;
    gstNumber?: string;
    email?: string;
};

export type CustomerResult = {
    id: string;
    loyaltyPoints: number;
};

/**
 * Get or create customer by phone number
 * This is the single source of truth for customer upsert logic
 * 
 * @param data - Customer data
 * @returns Customer ID and loyalty points
 */
export async function upsertCustomer(data: CustomerData): Promise<CustomerResult> {
    const supabase = await createClient();

    // Try to find existing customer by phone and shop
    const { data: existingCustomer, error: fetchError } = await supabase
        .from('customers')
        .select('id, loyalty_points')
        .eq('shop_id', data.shopId)
        .eq('phone', data.phone)
        .maybeSingle();

    if (fetchError) {
        console.error('Error fetching customer:', fetchError);
        throw new Error('Failed to fetch customer: ' + fetchError.message);
    }

    if (existingCustomer) {
        // Update existing customer details
        const { error: updateError } = await supabase
            .from('customers')
            .update({
                name: data.name,
                address: data.address,
                state: data.state,
                pincode: data.pincode,
                gst_number: data.gstNumber,
                email: data.email,
                updated_at: getCurrentTimestamp()
            })
            .eq('id', existingCustomer.id);

        if (updateError) {
            console.error('Error updating customer:', updateError);
            throw new Error('Failed to update customer: ' + updateError.message);
        }

        return {
            id: existingCustomer.id,
            loyaltyPoints: existingCustomer.loyalty_points || 0
        };
    } else {
        // Create new customer
        const { data: newCustomer, error: createError } = await supabase
            .from('customers')
            .insert({
                user_id: data.userId,
                shop_id: data.shopId,
                name: data.name,
                phone: data.phone,
                address: data.address,
                state: data.state,
                pincode: data.pincode,
                gst_number: data.gstNumber,
                email: data.email,
                loyalty_points: 0,
                total_spent: 0,
                created_at: getCurrentTimestamp()
            })
            .select('id, loyalty_points')
            .single();

        if (createError) {
            console.error('Error creating customer:', createError);
            throw new Error('Failed to create customer: ' + createError.message);
        }

        if (!newCustomer) {
            throw new Error('Customer creation failed - no data returned');
        }

        return {
            id: newCustomer.id,
            loyaltyPoints: newCustomer.loyalty_points || 0
        };
    }
}

/**
 * Update customer analytics (total spent, last visit)
 * 
 * @param customerId - Customer ID
 * @param grandTotal - Invoice grand total to add to total_spent
 */
export async function updateCustomerAnalytics(
    customerId: string,
    grandTotal: number
): Promise<void> {
    const supabase = await createClient();

    try {
        // Fetch current customer data to increment total_spent
        const { data: currentCustomer, error: fetchError } = await supabase
            .from('customers')
            .select('total_spent')
            .eq('id', customerId)
            .single();

        if (fetchError) {
            console.error('Error fetching customer data:', fetchError);
            // Continue without updating analytics
            return;
        }

        const { error: updateError } = await supabase
            .from('customers')
            .update({
                last_visit_at: getCurrentTimestamp(),
                total_spent: (currentCustomer?.total_spent || 0) + grandTotal,
            })
            .eq('id', customerId);

        if (updateError) {
            console.error('Error updating customer analytics:', updateError);
            // Continue without throwing - analytics update is not critical
        }
    } catch (err) {
        console.error('Unexpected error updating customer:', err);
        // Continue without throwing - analytics update is not critical
    }
}
