import { createClient } from '@/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_foreign_key_info');

    // Since we can't easily create an RPC, let's try a direct raw query if possible?
    // Supabase-js doesn't allow raw SQL usually.

    // Plan B: Use the `pg_catalog` or `information_schema` via `.from()` if allowed?
    // Usually REST API doesn't allow querying system tables directly.

    // Plan C: Check if we can insert into 'loans' with a fake ID and see the detailed error message?
    // The error message "violates foreign key constraint..." is already known.

    // Let's try to infer from `loan_customers` existence.
    // If I can select from 'loan_customers', it exists.

    const { data: loanCust } = await supabase.from('loan_customers').select('id').limit(1);
    const { data: mainCust } = await supabase.from('customers').select('id').limit(1);

    return NextResponse.json({
        hasLoanCustomers: !!loanCust,
        loanCustCount: loanCust?.length,
        hasMainCustomers: !!mainCust,
        mainCustCount: mainCust?.length
    });
}
