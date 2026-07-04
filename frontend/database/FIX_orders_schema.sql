-- Fix orders and order_items tables for local PostgreSQL
-- Run this SQL in pgAdmin Query Tool

-- Drop existing tables with cascade
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.orderitem CASCADE;
DROP TABLE IF EXISTS public.order CASCADE;

-- Create orders table with correct structure
CREATE TABLE public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    order_details JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_address JSONB,
    billing_address JSONB,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create order_items table
CREATE TABLE public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL,
    product_id BIGINT NOT NULL,
    product_name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    weight TEXT,
    grade TEXT,
    image TEXT,
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS (price * quantity) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_items_order_id FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_order_id ON public.orders(order_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_orders_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at 
BEFORE UPDATE ON public.orders 
FOR EACH ROW 
EXECUTE FUNCTION update_orders_updated_at_column();

-- Grant permissions if needed (adjust as necessary for your setup)
-- GRANT ALL ON public.orders TO your_user;
-- GRANT ALL ON public.order_items TO your_user;
