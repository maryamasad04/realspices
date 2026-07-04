-- Fix products with missing or invalid created_at timestamps
-- Run this in pgAdmin to update existing products

-- Update products where created_at is NULL or set to epoch time
UPDATE public.product
SET created_at = NOW(), updated_at = NOW()
WHERE created_at IS NULL 
   OR created_at = '1970-01-01 00:00:00'::timestamp
   OR created_at < '2000-01-01'::timestamp;

-- Verify the table has proper defaults for future inserts
ALTER TABLE public.product 
ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE public.product 
ALTER COLUMN updated_at SET DEFAULT NOW();

-- Check results
SELECT id, name, created_at, updated_at 
FROM public.product 
ORDER BY id;
