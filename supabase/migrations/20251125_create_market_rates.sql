-- Create market_rates table
CREATE TABLE IF NOT EXISTS market_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gold_24k NUMERIC NOT NULL,
    gold_22k NUMERIC NOT NULL,
    silver NUMERIC NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE market_rates ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (authenticated and anon)
CREATE POLICY "Allow public read access" ON market_rates
    FOR SELECT USING (true);

-- Allow write access only to service role (for edge functions) or authenticated users (for manual refresh if needed)
CREATE POLICY "Allow authenticated insert" ON market_rates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Allow authenticated update" ON market_rates
    FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
