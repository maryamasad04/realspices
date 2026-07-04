-- Fix order table to use UUID user_id and match the users table
-- Run this in pgAdmin Query Tool

-- First, check current schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'order' 
ORDER BY ordinal_position;

-- Back up existing data if needed
CREATE TABLE order_backup AS SELECT * FROM public.order;

-- Drop constraints
ALTER TABLE public.order DROP CONSTRAINT IF EXISTS order_user_id_fkey;

-- Convert user_id from integer to UUID
-- First try direct conversion if data allows it
BEGIN;

ALTER TABLE public.order
ALTER COLUMN user_id SET DATA TYPE uuid USING 
  CASE 
    WHEN user_id IS NULL THEN NULL
    ELSE gen_random_uuid()  -- Generate new UUIDs or map to existing users
  END;

-- Add foreign key constraint
ALTER TABLE public.order
ADD CONSTRAINT order_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;

-- If the above fails, run this instead (manual mapping):
-- You'll need to update the INSERT logic in the API to store the correct mapping
