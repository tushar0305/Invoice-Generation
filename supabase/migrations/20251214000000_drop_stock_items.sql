-- Migration: Remove deprecated stock_items table
-- Date: 2025-12-13
-- Reason: Replaced by inventory_items with unique product tagging

-- Drop the old quantity-based stock table
DROP TABLE IF EXISTS public.stock_items CASCADE;

-- Also clean up any orphaned data if exists
-- (Indexes and policies are automatically removed with CASCADE)
