-- Create lucky_draws table
CREATE TABLE IF NOT EXISTS lucky_draws (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    draw_period DATE NOT NULL, -- Stored as first day of the month (e.g., '2025-12-01')
    winner_enrollment_id UUID NOT NULL REFERENCES scheme_enrollments(id) ON DELETE CASCADE,
    prize_details TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Ensure only one draw per month per shop
    UNIQUE(shop_id, draw_period)
);

-- Add indexes
CREATE INDEX idx_lucky_draws_shop_period ON lucky_draws(shop_id, draw_period);
CREATE INDEX idx_lucky_draws_winner ON lucky_draws(winner_enrollment_id);

-- RLS Policies
ALTER TABLE lucky_draws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lucky draws for their shop"
    ON lucky_draws FOR SELECT
    USING (shop_id IN (
        SELECT shop_id FROM user_shop_roles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Admins can create lucky draws"
    ON lucky_draws FOR INSERT
    WITH CHECK (shop_id IN (
        SELECT shop_id FROM user_shop_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('owner', 'manager')
    ));
