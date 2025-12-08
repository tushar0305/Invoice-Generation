-- Add name column to staff_profiles
ALTER TABLE public.staff_profiles 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Update existing profiles to have a default name if needed (optional)
-- UPDATE public.staff_profiles SET name = 'Staff Member' WHERE name IS NULL;
