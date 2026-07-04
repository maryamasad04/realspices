-- Create orders table for dynamic order management
-- Run this SQL in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    order_details JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_address JSONB,
    billing_address JSONB,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON public.orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON public.orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Users can only see their own orders
CREATE POLICY "Users can view their own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own orders
CREATE POLICY "Users can create their own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own orders (limited fields)
CREATE POLICY "Users can update their own orders" ON public.orders
    FOR UPDATE USING (auth.uid() = user_id);

-- Comment on table and columns for documentation
COMMENT ON TABLE public.orders IS 'Table to store customer orders with complete order details';
COMMENT ON COLUMN public.orders.order_details IS 'JSON object containing cart items, quantities, prices, etc.';
COMMENT ON COLUMN public.orders.shipping_address IS 'JSON object containing shipping address details';
COMMENT ON COLUMN public.orders.billing_address IS 'JSON object containing billing address details';