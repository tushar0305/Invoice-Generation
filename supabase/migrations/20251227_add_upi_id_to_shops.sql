-- Add upi_id to shops table
ALTER TABLE shops ADD COLUMN IF NOT EXISTS upi_id TEXT;
