-- Create address table for storing customer shipping addresses
-- Run this SQL in your local PostgreSQL database

CREATE TABLE IF NOT EXISTS public.address (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    street TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    phone VARCHAR(32),
    email VARCHAR(255),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_address_user_id ON public.address(user_id);
CREATE INDEX IF NOT EXISTS idx_address_pincode ON public.address(pincode);
CREATE INDEX IF NOT EXISTS idx_address_created_at ON public.address(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_address_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_address_updated_at 
    BEFORE UPDATE ON public.address 
    FOR EACH ROW 
    EXECUTE FUNCTION update_address_updated_at_column();
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own addresses
CREATE POLICY "Users can delete their own addresses" ON public.address
    FOR DELETE USING (auth.uid() = user_id);