-- Fix NULL password values in user table

-- Step 1: Check how many NULL passwords exist
SELECT COUNT(*) FROM "user" WHERE password IS NULL;

-- Step 2: Option A - Delete users with NULL passwords
DELETE FROM "user" WHERE password IS NULL;

-- Step 3: Option B - OR Set default password (if you want to keep the users)
-- UPDATE "user" SET password = 'temp_password_hash' WHERE password IS NULL;
-- Note: You'd need to hash a real password first

-- Step 4: Verify the column is now NOT NULL
-- Run this query to see the constraint
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user' AND column_name = 'password';

-- If still nullable, add NOT NULL constraint:
ALTER TABLE "user" ALTER COLUMN password SET NOT NULL;
