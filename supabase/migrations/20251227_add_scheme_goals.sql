-- Add goal_name to scheme_enrollments for "Wedding Goal" feature
ALTER TABLE scheme_enrollments 
ADD COLUMN IF NOT EXISTS goal_name TEXT;

-- Ensure target columns exist (just in case)
ALTER TABLE scheme_enrollments 
ADD COLUMN IF NOT EXISTS target_weight NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS target_amount NUMERIC DEFAULT 0;
