
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('Has Service Role Key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
