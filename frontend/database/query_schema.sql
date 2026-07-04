-- Create query table for contact form submissions and customer queries
-- Run this SQL in your PostgreSQL database

-- Drop existing table if needed (backup data first!)
-- DROP TABLE IF EXISTS public.query CASCADE;

CREATE TABLE IF NOT EXISTS public.query (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_query_email ON public.query(email);
CREATE INDEX IF NOT EXISTS idx_query_status ON public.query(status);
CREATE INDEX IF NOT EXISTS idx_query_created_at ON public.query(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_query_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_query_updated_at ON public.query;
CREATE TRIGGER update_query_updated_at 
    BEFORE UPDATE ON public.query 
    FOR EACH ROW 
    EXECUTE FUNCTION update_query_updated_at();

-- Note: RLS (Row Level Security) policies can be added based on your security requirements
-- For now, allowing public inserts for contact form submissions
