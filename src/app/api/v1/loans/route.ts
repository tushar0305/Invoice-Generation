import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { withAuth, checkShopAccess, successResponse, errorResponse } from '@/lib/api/utils';
import { createAuditLogger } from '@/lib/api/audit';
import * as z from 'zod';

import { addMonths, parseISO, format } from 'date-fns';

// Validation Schema for Loan Creation
const CollateralItemSchema = z.object({
    item_type: z.enum(['gold', 'silver', 'diamond']),
    item_name: z.string().min(1),
    gross_weight: z.number().nonnegative(),
    net_weight: z.number().nonnegative(),
    purity: z.string().optional(),
    estimated_value: z.number().optional(),
    description: z.string().optional(),
});

const CreateLoanSchema = z.object({
    shopId: z.string().uuid(),
    customerId: z.string().uuid(),
    loanNumber: z.string().min(1),
    principalAmount: z.number().positive(),
    interestRate: z.number().nonnegative(), // Annual rate
    repaymentType: z.enum(['interest_only', 'emi', 'bullet']).optional().default('interest_only'),
    tenureMonths: z.number().optional(),
    emiAmount: z.number().optional(),
    startDate: z.string(), // ISO Date
    collateral: z.array(CollateralItemSchema).min(1),
    documents: z.array(z.object({
        name: z.string(),
        type: z.string(),
        url: z.string() // Allow path string, not just strict URL
    })).optional().default([])
});

/**
 * POST /api/v1/loans
 * Create a new loan with collateral items and documents.
 */
export const POST = withAuth(async (
    req: NextRequest,
    { user, supabase }
) => {
    try {
        const body = await req.json();
        const input = CreateLoanSchema.parse(body);

        // 1. Check Permissions
        const { hasAccess, role } = await checkShopAccess(
            supabase,
            user.id,
            input.shopId,
            ['owner', 'manager', 'staff']
        );

        if (!hasAccess) {
            return errorResponse('Insufficient permissions', 403);
        }

        // 2. Check for duplicate loan number
        const { data: existingLoan } = await supabase
            .from('loans')
            .select('id')
            .eq('shop_id', input.shopId)
            .eq('loan_number', input.loanNumber)
            .maybeSingle();

        if (existingLoan) {
            return errorResponse('Loan number already exists', 409);
        }

        // Calculate End Date (Due Date)
        let endDate = null;
        if (input.tenureMonths && input.startDate) {
            try {
                endDate = format(addMonths(parseISO(input.startDate), input.tenureMonths), 'yyyy-MM-dd');
            } catch (e) {
                console.error('Date calculation error', e);
            }
        }

        // 3. Insert Loan
        const { data: loan, error: loanError } = await supabase
            .from('loans')
            .insert({
                shop_id: input.shopId,
                customer_id: input.customerId,
                loan_number: input.loanNumber,
                principal_amount: input.principalAmount,
                interest_rate: input.interestRate,
                repayment_type: input.repaymentType,
                tenure_months: input.tenureMonths,
                emi_amount: input.emiAmount,
                start_date: input.startDate,
                end_date: endDate,
                status: 'active',
            })
            .select()
            .single();

        if (loanError) {
            console.error('Loan insert error:', loanError);
            throw loanError;
        }

        // 4. Insert Collateral
        const collateralItems = input.collateral.map(item => ({
            loan_id: loan.id,
            // shop_id: input.shopId, // Removed: Not in schema
            item_type: item.item_type,
            item_name: item.item_name,
            gross_weight: item.gross_weight,
            net_weight: item.net_weight,
            purity: item.purity,
            estimated_value: item.estimated_value || 0,
            description: item.description || ''
        }));

        const { error: collateralError } = await supabase
            .from('loan_collateral')
            .insert(collateralItems);

        if (collateralError) {
            console.error('Collateral insert error:', collateralError);
            // Attempt cleanup (optional, or rely on transaction if RPC was used)
            await supabase.from('loans').delete().eq('id', loan.id);
            throw collateralError;
        }

        // 5. Insert Documents (if any)
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
                // We don't rollback the loan for doc errors, but we log it.
                // Ideally notify user, but partial success is okay-ish here.
            }
        }

        // 6. Audit Log
        const auditLogger = createAuditLogger(supabase, user.id, input.shopId);
        await auditLogger.logCreate('loan', loan.id, {
            loanNumber: loan.loan_number,
            principal: loan.principal_amount,
            items: collateralItems.length,
            documents: input.documents.length
        });

        // 7. Ledger Integration (Khata)
        // Try to find the main customer ID using the phone number from the loan customer
        const { data: loanCustomer } = await supabase
            .from('loan_customers')
            .select('phone')
            .eq('id', input.customerId)
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
                // Add DEBIT (Loan Given) to Ledger
                await supabase.from('ledger_transactions').insert({
                    shop_id: input.shopId,
                    customer_id: mainCustomer.id,
                    transaction_type: 'INVOICE', // Using 'INVOICE' type for general debt, or add 'LOAN' enum if possible. But 'INVOICE' works for now as "Debt Created"
                    amount: input.principalAmount,
                    entry_type: 'DEBIT',
                    description: `Loan Disbursed #${loan.loan_number} (Principal)`,
                    created_by: user.id
                });

                // Update customer total spent/stats if needed. (Optional for loans, but good for keeping track of activity)
            }
        }

        // 7. Revalidate
        revalidatePath(`/shop/${input.shopId}/loans`);
        revalidatePath(`/shop/${input.shopId}/dashboard`);

        return successResponse({
            id: loan.id,
            message: 'Loan created successfully'
        }, 201);

    } catch (error: any) {
        console.error('Create Loan Error:', error);
        if (error instanceof z.ZodError) {
            return errorResponse('Invalid input data', 400, 'VALIDATION_ERROR');
        }
        return errorResponse(error.message || 'Failed to create loan', 500);
    }
});
