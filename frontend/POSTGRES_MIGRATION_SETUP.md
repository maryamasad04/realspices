# PostgreSQL Migration Setup Guide

This document guides you through migrating from Supabase to a local PostgreSQL database called "realspices".

## Prerequisites

- PostgreSQL installed locally (version 12+)
- Node.js and npm installed
- Your Next.js application setup

## Step 1: Create the Local PostgreSQL Database

1. Open a terminal/command prompt and connect to PostgreSQL:
```bash
psql -U postgres
```

2. Create the database:
```sql
CREATE DATABASE realspices;
```

3. Connect to the new database:
```sql
\c realspices
```

## Step 2: Set Up Environment Variables

Create or update your `.env.local` file with the following PostgreSQL connection variables:

```env
# PostgreSQL Connection Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=realspices
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPPORT_EMAIL=support@realspices.com

# Email Configuration (Optional, for password reset emails)
SENDGRID_API_KEY=your_sendgrid_api_key
```

## Step 3: Initialize Database Schema

Run the SQL schema files from the `database/` folder in the following order to set up your tables:

```bash
psql -U postgres -d realspices -f database/products_schema.sql
psql -U postgres -d realspices -f database/orders_schema.sql
psql -U postgres -d realspices -f database/order_items_schema.sql
psql -U postgres -d realspices -f database/cart_schema.sql
psql -U postgres -d realspices -f database/addresses_schema.sql
psql -U postgres -d realspices -f database/contacts_schema.sql
psql -U postgres -d realspices -f database/admin_schema.sql
psql -U postgres -d realspices -f database/CREATE_password_reset_tokens_table.sql
```

### Important: Create the Users Table

You'll need to create a `users` table if it doesn't exist. Run this SQL:

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

## Step 4: API Route Updates

All API routes have been updated to use the PostgreSQL client (`postgresClient.ts`). The migration includes:

- Removed all Supabase imports (`@supabase/supabase-js`)
- Replaced with local PostgreSQL client using the `pg` npm package
- Updated all database queries to use the new `postgres` client

### Key Changes:

**Before (Supabase):**
```typescript
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const { data, error } = await supabase.from('users').select('*');
```

**After (PostgreSQL):**
```typescript
import { postgres } from '@/lib/postgresClient';
const { data, error } = await postgres.from('users').select('*');
```

## Step 5: Authentication & Password Hashing

The application now uses `bcryptjs` for password hashing. When users sign up or reset passwords:

1. Passwords are hashed using bcrypt (10 rounds)
2. Password reset tokens are stored with an expiration time
3. Token hashing uses SHA-256 for security

Make sure your `users` table has a `password` field to store the hashed passwords.

## Step 6: Remove Supabase Dependencies

Remove the Supabase npm package if it's no longer needed:

```bash
npm uninstall @supabase/supabase-js
```

## Step 7: Test Your Setup

Start your development server:

```bash
npm run dev
```

Test the following endpoints:
- `GET /api/products` - Should fetch all products
- `POST /api/auth/signup` - Create a new user
- `POST /api/auth/login` - Authenticate user
- `POST /api/orders` - Create an order (requires valid user)

## Troubleshooting

### Database Connection Issues

**Error: "ECONNREFUSED"**
- Ensure PostgreSQL is running locally
- Check that `DB_HOST` and `DB_PORT` are correct
- Verify credentials in `.env.local`

**Error: "Database "realspices" does not exist"**
- Run the CREATE DATABASE command from Step 1
- Make sure you're using the correct database name

### Query Errors

**Error: "Relation "product" does not exist"**
- Run the schema initialization scripts from Step 3
- Check that table names match your schema

**Error: "Column not found"**
- Verify that the column exists in your schema
- Check for typos in column names (case-sensitive)

## Schema Migration from Supabase

If you're migrating existing data from Supabase:

1. **Export data from Supabase:**
   - Use Supabase's export features or pg_dump
   - Save as SQL files

2. **Import into local PostgreSQL:**
```bash
psql -U postgres -d realspices -f exported_data.sql
```

3. **Verify data integrity:**
   - Check record counts match
   - Verify foreign key relationships

## Query Builder API

The PostgreSQL client (`postgresClient.ts`) provides a Supabase-like query builder:

```typescript
// SELECT queries
const { data, error } = await postgres
  .from('users')
  .select('id, email, name')
  .eq('status', 'active')
  .order('created_at', { ascending: false })
  .limit(10);

// INSERT
const { data, error } = await postgres
  .from('users')
  .insert([{ email, name, password }]);

// UPDATE
const { data, error } = await postgres
  .from('users')
  .update({ name: 'New Name' })
  .eq('id', userId);

// DELETE
const { data, error } = await postgres
  .from('users')
  .delete()
  .eq('id', userId);

// Single record
const { data, error } = await postgres
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();  // Returns single object instead of array
```

## Environment Variable Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL server host | `localhost` |
| `DB_PORT` | PostgreSQL server port | `5432` |
| `DB_NAME` | Database name | `realspices` |
| `DB_USER` | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `your_password` |
| `NEXT_PUBLIC_APP_URL` | Application URL for links | `http://localhost:3000` |
| `SUPPORT_EMAIL` | Email for password reset sender | `support@realspices.com` |
| `SENDGRID_API_KEY` | Optional: SendGrid API key for emails | (optional) |

## Next Steps

1. Complete the database setup
2. Test key API endpoints
3. Update any client-side authentication logic if needed
4. Migrate any historical data from Supabase
5. Update deployment configurations for production

## Support

For issues or questions about the migration:
- Check database logs: `psql -U postgres -c "SELECT * FROM ..."`
- Review Next.js server logs in the terminal
- Verify all `.env.local` variables are set correctly
