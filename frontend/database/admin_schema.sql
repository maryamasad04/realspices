-- Create admin table for admin user management
-- Run this SQL in your Supabase SQL editor

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
-- Allow authenticated users to view admin records (for verification during login)
CREATE POLICY "Admin records are viewable by authenticated users" ON public.admin
    FOR SELECT USING (auth.role() = 'authenticated_user' OR auth.role() = 'service_role');

-- Allow service role to insert/update admin records
CREATE POLICY "Admin records can be inserted by service role" ON public.admin
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admin records can be updated by service role" ON public.admin
    FOR UPDATE USING (auth.role() = 'service_role');
