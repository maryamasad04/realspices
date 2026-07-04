# Supabase to PostgreSQL Migration - Status Report

## Completed Tasks ✅

### 1. PostgreSQL Client Library
- **Package**: `pg` - NPM package installed
- **File**: `lib/postgresClient.ts`
  - Complete query builder implementation
  - Support for `.select()`, `.insert()`, `.update()`, `.delete()`
  - Comparison operators: `.eq()`, `.neq()`, `.gt()`, `.gte()`, `.lt()`, `.lte()`, `.in()`
  - Query modifiers: `.order()`, `.limit()`, `.offset()`, `.single()`
  - Returns standardized `{ data, error }` format matching Supabase API

### 2. Supabase Client Files Refactored
- **lib/supabaseClient.ts** - ✅ Now re-exports PostgreSQL client
- **lib/supabaseClient.js** - ✅ Now re-exports PostgreSQL client

### 3. API Routes Updated

#### ✅ Completed Migrations:
- **app/api/products/route.ts** - Full migration (GET, POST, PUT)
- **app/api/auth/reset-password/route.ts** - Full migration with bcrypt password hashing
- **app/api/auth/validate-reset-token/route.ts** - Full migration
- **app/api/auth/request-password-reset/route.ts** - Partially updated (import changed)

#### ⚠️ Still Need Manual Updates:
The following files have Supabase imports but need the query code updated:
- **app/api/cart/route.ts** - Import updated, but queries still reference `supabaseAdmin`
- **app/api/orders/route.ts** - Still uses `createClient` from Supabase
- **app/api/address/route.ts** - Still uses Supabase client
- **app/api/admin/auth/route.ts** - Still uses Supabase client
- **app/api/admin/cancel-order/route.ts** - Still uses Supabase client
- **app/api/admin/delete-product/route.ts** - Still uses Supabase client
- **app/api/admin/update-order/route.ts** - Still uses Supabase client
- **app/api/admin/upload-image/route.ts** - Still uses Supabase client
- **app/api/admin/user-contact/route.ts** - Still uses Supabase client
- **app/products/page.tsx** - Client component still uses Supabase

### 4. Documentation
- ✅ **POSTGRES_MIGRATION_SETUP.md** - Complete setup and troubleshooting guide

## Migration Strategy for Remaining Files

### Key Changes to Apply:

1. **Replace imports:**
```typescript
// OLD
import { createClient } from '@supabase/supabase-js';

// NEW
import { postgres } from '@/lib/postgresClient';
```

2. **Remove client initialization:**
```typescript
// OLD - Remove these lines
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// NEW - Just use directly
// No initialization needed
```

3. **Replace all query calls:**
```typescript
// OLD - Any supabase/supabaseAdmin calls
await supabase.from('table').select()...

// NEW - Use postgres instead
await postgres.from('table').select()...
```

4. **Handle special cases:**
- Remove `.auth` operations (Supabase auth is not available)
- For password updates, use bcrypt hashing + database update
- For file uploads, may need separate storage solution

## Remaining Work - Priority Order

### Priority 1 (User-facing):
- [ ] `app/api/auth/request-password-reset/route.ts` - Complete the updates
- [ ] `app/api/orders/route.ts` - Critical for order functionality
- [ ] `app/api/address/route.ts` - Critical for checkout

### Priority 2 (Admin features):
- [ ] `app/api/admin/update-order/route.ts`
- [ ] `app/api/admin/cancel-order/route.ts`
- [ ] `app/api/admin/auth/route.ts`

### Priority 3 (Additional features):
- [ ] `app/api/cart/route.ts` - Partially done
- [ ] `app/api/admin/delete-product/route.ts`
- [ ] `app/api/admin/upload-image/route.ts` - May need storage config
- [ ] `app/api/admin/user-contact/route.ts`
- [ ] `app/products/page.tsx` - Client-side component updates

## Required Database Schema

Make sure these tables exist in your PostgreSQL database:
- `users` - For user authentication and profiles
- `product` - For products
- `orders` - For orders
- `order_items` - For individual items in orders
- `cart` - For shopping carts
- `cart_items` - For individual items in carts
- `addresses` - For shipping addresses
- `contacts` - For contact messages
- `password_reset_tokens` - For password reset functionality
- `admin` - For admin users (if separate)

See `POSTGRES_MIGRATION_SETUP.md` for schema SQL files.

## Environment Variables Required

Add to `.env.local`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=realspices
DB_USER=postgres
DB_PASSWORD=your_postgres_password
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPPORT_EMAIL=support@realspices.com
SENDGRID_API_KEY=your_sendgrid_key_if_using_email
```

## Testing Checklist

After updates, test:
- [ ] ProductsAPI (GET products list)
- [ ] Create product (POST)
- [ ] Update product (PUT)
- [ ] Password reset flow
- [ ] Create order
- [ ] Manage cart
- [ ] Admin operations
- [ ] File uploads (if supported)

## Notes for Development

1. **Connection Pooling** - The PostgreSQL client auto-manages a connection pool. No manual connection management needed.

2. **Error Handling** - All queries return `{ data, error }` format for consistency with Supabase API.

3. **Single Records** - Use `.single()` to get a single object instead of an array.

4. **Transactions** - Not yet implemented in the basic client. For complex operations, raw SQL queries can be used via the exported `rawQuery()` function.

5. **Authentication** - Moved from Supabase Auth to JWT tokens + bcrypt password hashing. The `authToken` is stored in localStorage on client.

## Next Steps

1. ✅ Setup: Complete database initialization
2. 📝 Update: Finish remaining API route migrations (see Priority Order above)
3. 🧪 Test: Verify all endpoints work correctly
4. 🚀 Deploy: Update environment variables on production
5. 📦 Cleanup: Remove Supabase package from package.json once all migrations are complete
