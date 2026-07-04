-- Create users table for user authentication and profiles
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'USER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_users_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (id::text = current_user_id());

-- Allow anyone to insert (signup)  
CREATE POLICY "Anyone can sign up" ON public.users
    FOR INSERT WITH CHECK (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (id::text = current_user_id());
