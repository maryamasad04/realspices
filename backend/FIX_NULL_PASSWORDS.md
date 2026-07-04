# Fix NULL Password Values in User Table

## Problem
```
ERROR: 23502: column "password" of relation "user" contains null values
```

This means:
- Your `user` table has some rows with NULL passwords
- Prisma schema says password is required (NOT NULL)
- The data conflicts with the schema

## Quick Fix (in Supabase SQL Editor)

### Option 1: Delete Users with NULL Passwords (Recommended)
```sql
DELETE FROM "user" WHERE password IS NULL;
```

Then verify:
```sql
SELECT * FROM "user" WHERE password IS NULL;
```

### Option 2: Add NOT NULL Constraint
```sql
ALTER TABLE "user" ALTER COLUMN password SET NOT NULL;
```

## Complete Solution

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project
2. Go to SQL Editor
3. Create a new query

### Step 2: Run This Query
```sql
-- Check how many users have NULL passwords
SELECT COUNT(*) as null_password_count FROM "user" WHERE password IS NULL;

-- View the users with NULL passwords
SELECT id, email, password FROM "user" WHERE password IS NULL;

-- Delete them
DELETE FROM "user" WHERE password IS NULL;

-- Verify deletion
SELECT COUNT(*) FROM "user" WHERE password IS NULL;
```

### Step 3: Restart Backend
```bash
npm run dev
```

The error should now be gone!

## Why This Happened

Possible causes:
1. ✅ **Manual database edits** - Someone inserted users without passwords
2. ✅ **Migration issues** - Old data from before password was added
3. ✅ **Test data** - Incomplete test records in the database
4. ✅ **Database export/import** - NULL values during data migration

## Prevention

Make sure in your Prisma schema:
```prisma
model User {
  id       Int    @id @default(autoincrement())
  name     String
  email    String @unique
  password String  // ✅ No ? means it's required (NOT NULL)
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  
  @@map("user")
}
```

The password field has NO `?` at the end, meaning it's required.

## If You Still Have Issues

1. **Clear data and restart:**
   ```bash
   npm run prisma:generate
   npm run dev
   ```

2. **Check the constraint:**
   ```sql
   SELECT column_name, is_nullable, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'user' AND column_name = 'password';
   ```
   Should show: `is_nullable = NO`

3. **If nullable is YES, fix it:**
   ```sql
   ALTER TABLE "user" ALTER COLUMN password SET NOT NULL;
   ```

Done! Your backend should work now. 🚀
