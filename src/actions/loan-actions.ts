'use server';

import { createClient } from '@/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { addMonths, parseISO, format } from 'date-fns';

// Validation Schemas (matching the ones in schemas.ts but adapted for server action)
const CollateralItemSchema = z.object({
    item_type: z.enum(['gold', 'silver', 'diamond', 'other']),
    item_name: z.string().min(1),
    gross_weight: z.number().nonnegative(),
    net_weight: z.number().nonnegative(),
    purity: z.string().optional(),
    estimated_value: z.number().optional(),
    description: z.string().optional(),
    photo_urls: z.array(z.string()).default([]),
});

const CreateLoanSchema = z.object({
    shopId: z.string().uuid(),
    customerId: z.string().uuid().optional(), // Existing customer ID
    customer: z.object({ // New customer details if ID not provided or updating
        name: z.string().min(1),
        phone: z.string().min(10),
        address: z.string().optional(),
        photo_url: z.string().optional(),
    }).optional(),
    loanNumber: z.string().min(1),
    principalAmount: z.number().positive(),
    interestRate: z.number().positive(), // Changed to positive as per requirement
    repaymentType: z.enum(['interest_only', 'emi', 'bullet']).default('interest_only'),
    tenureMonths: z.number().int().min(1).default(12), // Changed to min 1 as per requirement
    emiAmount: z.number().optional(),
    startDate: z.string(), // ISO Date
    collateral: z.array(CollateralItemSchema).min(1),
    documents: z.array(z.object({
        name: z.string(),
        type: z.string(),
        url: z.string()
    })).default([])
});

export type CreateLoanState = {
    success?: boolean;
    error?: string;
    loanId?: string;
    validationErrors?: Record<string, string[]>;
};

export async function createLoanAction(prevState: CreateLoanState, formData: FormData): Promise<CreateLoanState> {
    const supabase = await createClient();
    
    // 1. Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { error: 'Unauthorized' };
    }

    try {
        // Parse JSON data from FormData
        const rawData = JSON.parse(formData.get('data') as string);
        const input = CreateLoanSchema.parse(rawData);

        // 2. Check Shop Access
        const { data: userRole } = await supabase
            .from('user_shop_roles')
            .select('role')
            .eq('shop_id', input.shopId)
            .eq('user_id', user.id)
            .single();

        if (!userRole) {
            return { error: 'Insufficient permissions' };
        }

        // 3. Handle Customer (Get or Create)
        let customerId = input.customerId;

        if (!customerId && input.customer) {
            // Check if customer exists by phone
            const { data: existingCust } = await supabase
                .from('loan_customers')
                .select('id')
                .eq('shop_id', input.shopId)
                .eq('phone', input.customer.phone)
                .maybeSingle();

            if (existingCust) {
                customerId = existingCust.id;
            } else {
                // Create new customer
                const { data: newCust, error: createError } = await supabase
                    .from('loan_customers')
                    .insert({
                        shop_id: input.shopId,
                        name: input.customer.name,
                        phone: input.customer.phone,
                        address: input.customer.address,
                        photo_url: input.customer.photo_url,
                    })
                    .select('id')
                    .single();

                if (createError) throw new Error(`Failed to create customer: ${createError.message}`);
                customerId = newCust.id;
            }
        }

        if (!customerId) {
            return { error: 'Customer information is missing' };
        }

        // 4. Check for duplicate loan number
        const { data: existingLoan } = await supabase
            .from('loans')
            .select('id')
            .eq('shop_id', input.shopId)
            .eq('loan_number', input.loanNumber)
            .maybeSingle();

        if (existingLoan) {
            return { error: 'Loan number already exists' };
        }

        // 5. Calculate End Date
        let endDate = null;
        if (input.tenureMonths && input.startDate) {
            try {
                endDate = format(addMonths(parseISO(input.startDate), input.tenureMonths), 'yyyy-MM-dd');
            } catch (e) {
                console.error('Date calculation error', e);
            }
        }

        // 6. Insert Loan
        const { data: loan, error: loanError } = await supabase
            .from('loans')
            .insert({
                shop_id: input.shopId,
                customer_id: customerId,
                loan_number: input.loanNumber,
                principal_amount: input.principalAmount,
                interest_rate: input.interestRate,
                repayment_type: input.repaymentType,
                tenure_months: input.tenureMonths,
                emi_amount: input.emiAmount,
                start_date: input.startDate,
                end_date: endDate,
                status: 'active',
                created_by: user.id // Assuming column exists or trigger handles it
            })
            .select()
            .single();

        if (loanError) throw new Error(`Failed to create loan: ${loanError.message}`);

        // 7. Insert Collateral
        const collateralItems = input.collateral.map(item => ({
            loan_id: loan.id,
            item_type: item.item_type,
            item_name: item.item_name,
            gross_weight: item.gross_weight,
            net_weight: item.net_weight,
            purity: item.purity,
            estimated_value: item.estimated_value || 0,
            description: item.description || '',
            photo_urls: item.photo_urls
        }));

        const { error: collateralError } = await supabase
            .from('loan_collateral')
            .insert(collateralItems);

        if (collateralError) {
            // Cleanup
            await supabase.from('loans').delete().eq('id', loan.id);
            throw new Error(`Failed to add collateral: ${collateralError.message}`);
        }

        // 8. Insert Documents
        if (input.documents && input.documents.length > 0) {
            const docItems = input.documents.map(doc => ({
                loan_id: loan.id,
                shop_id: input.shopId,
                name: doc.name,
                type: doc.type,
                url: doc.url
            }));

            const { error: docError } = await supabase
                .from('loan_documents')
                .insert(docItems);
            
            if (docError) {
                console.error('Document insert error:', docError);
                // Continue despite document error
            }
        }

        // 9. Ledger Integration (Khata)
        // Find main customer by phone
        const { data: loanCustomer } = await supabase
            .from('loan_customers')
            .select('phone')
            .eq('id', customerId)
            .single();

        if (loanCustomer?.phone) {
            const { data: mainCustomer } = await supabase
                .from('customers')
                .select('id')
                .eq('shop_id', input.shopId)
                .eq('phone', loanCustomer.phone)
                .limit(1)
                .maybeSingle();

            if (mainCustomer) {
                await supabase.from('ledger_transactions').insert({
                    shop_id: input.shopId,
                    customer_id: mainCustomer.id,
                    transaction_type: 'INVOICE',
                    amount: input.principalAmount,
                    entry_type: 'DEBIT',
                    description: `Loan Disbursed #${loan.loan_number} (Principal)`,
                    created_by: user.id
                });
            }
        }

        revalidatePath(`/shop/${input.shopId}/loans`);
        revalidatePath(`/shop/${input.shopId}/dashboard`);

        return { success: true, loanId: loan.id };

    } catch (error: any) {
        console.error('Create Loan Action Error:', error);
        if (error instanceof z.ZodError) {
            return { 
                error: 'Validation failed', 
                validationErrors: error.flatten().fieldErrors as Record<string, string[]>
            };
        }
        return { error: error.message || 'Failed to create loan' };
    }
}
