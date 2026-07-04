-- Create contacts table for contact form submissions
-- Run this SQL in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON public.contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON public.contacts(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contacts_updated_at 
    BEFORE UPDATE ON public.contacts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_contacts_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Allow anonymous users to insert contact forms (public submissions)
CREATE POLICY "public_contact_insert" ON public.contacts
    FOR INSERT 
    TO public
    WITH CHECK (true);

-- Allow service role to do everything (for API routes)
CREATE POLICY "service_role_all" ON public.contacts
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users (admin/staff) to select contacts
CREATE POLICY "authenticated_select" ON public.contacts
    FOR SELECT 
    TO authenticated
    USING (true);

-- Allow authenticated users (admin/staff) to update contact status
CREATE POLICY "authenticated_update" ON public.contacts
    FOR UPDATE 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON public.contacts TO service_role;
GRANT SELECT, INSERT ON public.contacts TO anon;
GRANT ALL ON public.contacts TO authenticated;

-- Comment on table and columns for documentation
COMMENT ON TABLE public.contacts IS 'Table to store contact form submissions from website visitors';
COMMENT ON COLUMN public.contacts.name IS 'Full name of the person contacting us';
COMMENT ON COLUMN public.contacts.email IS 'Email address for response';
COMMENT ON COLUMN public.contacts.phone IS 'Optional phone number';
COMMENT ON COLUMN public.contacts.subject IS 'Subject/topic of the inquiry';
COMMENT ON COLUMN public.contacts.message IS 'Detailed message content';
COMMENT ON COLUMN public.contacts.status IS 'Current status of the inquiry (new, in_progress, resolved, closed)';