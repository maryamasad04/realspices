# Fix for Prisma User Table Mapping Error

## Problem
```
Backend error: 500 Invalid `prisma.user.findUnique()` invocation: The table `public.users` does not exist in the current database.
```

## Root Cause
- Your database table is named `user` (singular)
- Prisma was originally looking for `users` (plural)
- The schema has been updated with `@@map("user")` but Prisma Client needs to be regenerated

## Solution

### Step 1: Regenerate Prisma Client
Run this command in the backend directory:

```bash
npm run prisma:generate
```

This will:
- Read the updated `prisma/schema.prisma` 
- Generate new client code that maps to the correct table name `user`
- Update the Prisma Client in `node_modules/@prisma/client`

### Step 2: Restart the Backend Server
After regenerating, restart your backend:

```bash
npm run dev
```

### Step 3: Test the Login
Try logging in again. The error should be gone!

## Verification

Check that `prisma/schema.prisma` has these mappings:

```prisma
model User {
  id       Int    @id @default(autoincrement())
  name     String
  email    String @unique
  password String
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  addresses Address[]
  carts Cart[]
  orders Order[]
  reviews Review[]
  wishlists Wishlist[]
  contacts Contact[]

  @@map("user")  // ✅ This maps to the 'user' table
}

model Product {
  // ... fields ...
  @@map("product")  // ✅ This maps to the 'product' table
}
```

## If Problem Persists

1. **Clear Prisma cache:**
   ```bash
   rm -rf node_modules/.prisma
   rm -rf .next
   npm run prisma:generate
   ```

2. **Restart backend:**
   ```bash
   npm run dev
   ```

3. **Check database connection:**
   - Verify `DATABASE_URL` in `.env` is correct
   - Ensure Supabase database is running
   - Verify tables exist: `user`, `product`, etc.

## Common Issues

### Issue: "Table 'public.users' does not exist"
- Run `npm run prisma:generate`
- Ensure `@@map("user")` is in User model
- Restart the server

### Issue: "Column 'X' does not exist"
- Check the Supabase table has the column
- Verify the schema matches your database
- Run `npm run prisma:generate` again

