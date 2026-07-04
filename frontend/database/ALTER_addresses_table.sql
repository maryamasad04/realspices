-- Migration script to update existing address table
-- This will remove name, email, phone, and country columns
-- WARNING: This will permanently delete data in those columns and change id to UUID!

-- Step 1: Drop existing primary key constraint
ALTER TABLE public.address DROP CONSTRAINT IF EXISTS address_pkey;

-- Step 2: Drop the old id column and recreate as UUID
ALTER TABLE public.address DROP COLUMN IF EXISTS id;
ALTER TABLE public.address ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;

-- Step 2b: Convert user_id from integer to UUID (allow null for now)
ALTER TABLE public.address ALTER COLUMN user_id TYPE UUID USING NULL;

-- Step 3: Remove unwanted columns from existing address table
ALTER TABLE public.address 
DROP COLUMN IF EXISTS name,
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS phone,
DROP COLUMN IF EXISTS country;

-- Step 4: Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_address_user_id ON public.address(user_id);
CREATE INDEX IF NOT EXISTS idx_address_pincode ON public.address(pincode);
CREATE INDEX IF NOT EXISTS idx_address_created_at ON public.address(created_at);

-- Migration completed!
