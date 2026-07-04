-- Create order_items table for storing individual items in each order
-- Run this SQL in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL,
    product_name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    weight TEXT,
    grade TEXT,
    image TEXT,
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS (price * quantity) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Users can view items for their own orders
CREATE POLICY "Users can view their order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- Comment on table
COMMENT ON TABLE public.order_items IS 'Table to store individual items within each order';
