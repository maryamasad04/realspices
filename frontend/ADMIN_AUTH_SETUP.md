# Admin Table Setup & Authentication Guide

## Database Setup

### 1. Create Admin Table in Supabase

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create admin table for admin user management
CREATE TABLE IF NOT EXISTS public.admin (
    admin_id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_email ON public.admin(email);
CREATE INDEX IF NOT EXISTS idx_admin_created_at ON public.admin(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_updated_at 
    BEFORE UPDATE ON public.admin 
    FOR EACH ROW 
    EXECUTE FUNCTION update_admin_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin table
CREATE POLICY "Admin records are viewable by authenticated users" ON public.admin
    FOR SELECT USING (auth.role() = 'authenticated_user' OR auth.role() = 'service_role');

CREATE POLICY "Admin records can be inserted by service role" ON public.admin
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admin records can be updated by service role" ON public.admin
    FOR UPDATE USING (auth.role() = 'service_role');
```

### 2. Install Dependencies

Run the following command in your project:

```bash
npm install
```

This will install `bcryptjs` which is now added to package.json for password hashing.

## API Endpoint: `/api/admin/auth`

### POST Request - Login/Register

**Endpoint:** `POST /api/admin/auth`

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123",
  "action": "login"  // or "register"
}
```

**Response (Success - Login):**
```json
{
  "success": true,
  "message": "Admin login successful",
  "admin": {
    "admin_id": 1,
    "email": "admin@example.com",
    "created_at": "2025-01-13T10:30:00Z"
  }
}
```

**Response (Success - First Time Login/Account Creation):**
```json
{
  "success": true,
  "message": "Admin account created and logged in successfully",
  "admin": {
    "admin_id": 1,
    "email": "admin@example.com",
    "created_at": "2025-01-13T10:30:00Z"
  }
}
```

**Response (Error):**
```json
{
  "error": "Invalid email or password"
}
```

### GET Request - Fetch Admin Details

**Endpoint:** `GET /api/admin/auth?email=admin@example.com`

**Response:**
```json
{
  "admin_id": 1,
  "email": "admin@example.com",
  "created_at": "2025-01-13T10:30:00Z"
}
```

## How Admin Login Works

1. **First Time Admin Login:**
   - Admin enters email and password
   - System checks if admin exists in database
   - If not, it automatically creates an admin account with the provided credentials
   - Password is hashed using bcryptjs (salted with 10 rounds)
   - Admin is logged in and redirected to `/admin/dashboard`

2. **Subsequent Admin Logins:**
   - Admin enters email and password
   - System checks if admin exists
   - If exists, password is compared with stored hashed password
   - If valid, admin is logged in and data is stored in localStorage

3. **Data Stored in localStorage:**
   - `isAdmin: true` - Flag indicating admin is logged in
   - `adminId: {admin_id}` - Admin's unique ID from database
   - `adminEmail: {email}` - Admin's email address

## Login Form Location

**File:** `/app/login/page.tsx`

The admin login form:
- Calls `/api/admin/auth` with email, password, and action='login'
- Stores admin info in localStorage on successful login
- Redirects to `/admin/dashboard`

## Security Notes

- Passwords are hashed using bcryptjs before storage
- The API uses Supabase service role for secure database operations
- Row Level Security (RLS) policies restrict access to admin table
- Only service role can insert/update admin records
- Passwords are never returned in API responses
