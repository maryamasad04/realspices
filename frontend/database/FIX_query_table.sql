-- Migration: Fix query table to have auto-incrementing ID
-- This will recreate the query table with proper SERIAL id

-- Step 1: Backup existing data (if any)
CREATE TABLE IF NOT EXISTS query_backup AS SELECT * FROM query;

-- Step 2: Drop the old table
DROP TABLE IF EXISTS public.query CASCADE;

-- Step 3: Create new table with SERIAL id
CREATE TABLE public.query (
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

-- Step 4: Restore data (if backup table exists and has data)
INSERT INTO public.query (name, email, phone, subject, message, status, created_at, updated_at)
SELECT name, email, phone, subject, message, 
       COALESCE(status, 'new'), 
       COALESCE(created_at, NOW()), 
       COALESCE(updated_at, NOW())
FROM query_backup
WHERE EXISTS (SELECT 1 FROM query_backup);

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_query_email ON public.query(email);
CREATE INDEX IF NOT EXISTS idx_query_status ON public.query(status);
CREATE INDEX IF NOT EXISTS idx_query_created_at ON public.query(created_at);

-- Step 6: Create trigger for updated_at
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

-- Step 7: Drop backup table
DROP TABLE IF EXISTS query_backup;

-- Verify the table structure
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'query' AND table_schema = 'public'
ORDER BY ordinal_position;
