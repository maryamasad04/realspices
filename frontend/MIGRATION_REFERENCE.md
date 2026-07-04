# Supabase to PostgreSQL - Complete Migration Reference

## Quick Migration Pattern Guide

This file shows the exact patterns to use when updating the remaining API routes.

---

## Pattern 1: Basic SELECT Query

### Before (Supabase):
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

### After (PostgreSQL):
```typescript
import { postgres } from '@/lib/postgresClient';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { data, error } = await postgres
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}
```

**Key Changes:**
- Remove Supabase import and client initialization
- Import `postgres` from `@/lib/postgresClient`
- Keep query syntax the same - it's designed to be compatible!

---

## Pattern 2: INSERT with Return Value

### Before (Supabase):
```typescript
const { data, error } = await supabase
  .from('products')
  .insert([{
    name: 'Product Name',
    price: 100,
    stock: 50
  }])
  .select()
  .single();

if (error) throw error;
return NextResponse.json(data);
```

### After (PostgreSQL):
```typescript
const { data, error } = await postgres
  .from('products')
  .insert([{
    name: 'Product Name',
    price: 100,
    stock: 50
  }]);

if (error) throw error;
// data is an array, get first record
return NextResponse.json(data && data.length > 0 ? data[0] : null);
```

**Key Changes:**
- Remove `.select().single()` chaining
- PostgreSQL insert returns an array
- Access first element with `data[0]` instead of using `.single()`

---

## Pattern 3: UPDATE with WHERE Clause

### Before (Supabase):
```typescript
const { data, error } = await supabase
  .from('products')
  .update({ stock: 25 })
  .eq('id', productId)
  .select()
  .single();

if (error) throw error;
return NextResponse.json(data);
```

### After (PostgreSQL):
```typescript
const { data, error } = await postgres
  .from('products')
  .update({ stock: 25 })
  .eq('id', productId);

if (error) throw error;
// data is an array, get first record
return NextResponse.json(data && data.length > 0 ? data[0] : null);
```

**Key Changes:**
- Remove `.select().single()` 
- Handle array return value

---

## Pattern 4: Multiple Conditions (AND logic)

### Before (Supabase):
```typescript
const { data, error } = await supabase
  .from('cart_items')
  .select('*')
  .eq('cart_id', cartId)
  .eq('product_id', productId)
  .single();
```

### After (PostgreSQL):
```typescript
const { data, error } = await postgres
  .from('cart_items')
  .select('*')
  .eq('cart_id', cartId)
  .eq('product_id', productId)
  .single();  // Returns single object instead of array
```

**Key Changes:**
- Chain multiple `.eq()` calls (they build AND conditions automatically)
- Use `.single()` to get single object instead of array

---

## Pattern 5: Comparison Operators

### Before (Supabase):
```typescript
const { data, error } = await supabase
  .from('password_reset_tokens')
  .select('*')
  .eq('token_hash', tokenHash)
  .gt('expires_at', new Date().toISOString())
  .limit(1);
```

### After (PostgreSQL):
```typescript
const { data, error } = await postgres
  .from('password_reset_tokens')
  .select('*')
  .eq('token_hash', tokenHash)
  .gt('expires_at', new Date().toISOString())
  .limit(1);
```

**Supported Operators:**
- `.eq(field, value)` - equals
- `.neq(field, value)` - not equals
- `.gt(field, value)` - greater than
- `.gte(field, value)` - greater than or equal
- `.lt(field, value)` - less than
- `.lte(field, value)` - less than or equal
- `.in(field, [values])` - in array

---

## Pattern 6: DELETE Operation

### Before (Supabase):
```typescript
const { error } = await supabase
  .from('password_reset_tokens')
  .delete()
  .eq('id', tokenId);
```

### After (PostgreSQL):
```typescript
const { error } = await postgres
  .from('password_reset_tokens')
  .delete()
  .eq('id', tokenId);
```

**Key Changes:**
- Syntax is identical!
- Returns `{ data, error }` with data being array of deleted records

---

## Pattern 7: Admin/Service Role Operations

### Before (Supabase):
```typescript
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data, error } = await supabaseAdmin
  .from('users')
  .select('*');
```

### After (PostgreSQL):
```typescript
import { postgres } from '@/lib/postgresClient';

// No special "admin" client needed - postgres client works for all
const { data, error } = await postgres
  .from('users')
  .select('*');
```

**Key Changes:**
- No need for separate admin client
- PostgreSQL client is direct database connection
- No Row Level Security (RLS) enforcement - implement at application level if needed

---

## Pattern 8: Password Reset with Bcrypt

### Before (Supabase):
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(...);

// Update password using Supabase auth
const { error } = await supabase.auth.admin.updateUserById(userId, {
  password: newPassword
});
```

### After (PostgreSQL):
```typescript
import { postgres } from '@/lib/postgresClient';
import bcrypt from 'bcryptjs';

// Hash password with bcrypt
const hashedPassword = await bcrypt.hash(newPassword, 10);

// Update password in database
const { error } = await postgres
  .from('users')
  .update({ password: hashedPassword })
  .eq('id', userId);
```

**Key Changes:**
- Use `bcryptjs` for password hashing
- Store hashed password directly in `users` table
- Hash before storing (10 rounds recommended)

---

## Pattern 9: Raw SQL Queries (if needed)

```typescript
import { rawQuery } from '@/lib/postgresClient';

// For complex queries, use rawQuery
const { data, error } = await rawQuery(
  `SELECT * FROM products 
   WHERE status = $1 
   ORDER BY created_at DESC
   LIMIT 10`,
  ['active']
);
```

---

## Files That Need Updates - Quick Reference

```bash
# Run these find commands to locate remaining Supabase imports
grep -r "createClient.*supabase" app/
grep -r "supabaseAdmin\|supabaseServer" app/
grep -r "auth.admin" app/
grep -r "@supabase/supabase-js" app/
```

### Files to Update:
| File | Type | Priority |
|------|------|----------|
| `app/api/cart/route.ts` | API | High |
| `app/api/orders/route.ts` | API | High |  
| `app/api/address/route.ts` | API | High |
| `app/api/admin/auth/route.ts` | API | Medium |
| `app/api/admin/update-order/route.ts` | API | Medium |
| `app/api/admin/cancel-order/route.ts` | API | Medium |
| `app/api/admin/delete-product/route.ts` | API | Medium |
| `app/api/admin/upload-image/route.ts` | API | Medium |
| `app/api/admin/user-contact/route.ts` | API | Low |
| `app/products/page.tsx` | Component | Medium |

---

## Testing Each Migration

After updating each file, test with:

```bash
# Start dev server
npm run dev

# Test endpoints with curl
curl http://localhost:3000/api/products

# Check logs for any errors related to database
```

---

## Common Issues & Solutions

### Issue: "relation "x" does not exist"
**Solution:** Run the schema SQL files from the `database/` folder to create missing tables.

### Issue: "connection refused"
**Solution:** Ensure PostgreSQL is running and `.env.local` has correct credentials.

### Issue: ".single() returns undefined"
**Solution:** Check if record exists. `.single()` returns the object directly, or nothing if no match.

### Issue: "insert returns empty array"
**Solution:** Verify table exists and INSERT statement is correct. Check for constraint violations.

---

## Summary Checklist

- [ ] Install `pg` package
- [ ] Create `postgresClient.ts` 
- [ ] Update `supabaseClient.ts` and `.js`
- [ ] Update each API route:
  - [ ] Replace imports
  - [ ] Remove client initialization
  - [ ] Update all queries
  - [ ] Test endpoint
- [ ] Setup `.env.local` with DB credentials
- [ ] Initialize database schema
- [ ] Test complete user flow

---

## Need Help?

Refer to these files for more information:
- `POSTGRES_MIGRATION_SETUP.md` - Complete setup guide
- `MIGRATION_STATUS.md` - Current migration status
- `lib/postgresClient.ts` - Query builder implementation
