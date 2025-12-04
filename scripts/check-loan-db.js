
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Using anon key, might need service role if RLS blocks

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLoan() {
    const loanId = '4cc23fe3-000b-406d-9156-d21c58068e6a';

    console.log(`Checking loan ${loanId}...`);

    const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('id', loanId)
        .single();

    if (error) {
        console.error('Error fetching loan:', error);
    } else {
        console.log('Loan found:', data);
    }
}

checkLoan();
