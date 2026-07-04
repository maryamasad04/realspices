-- Drop and recreate order tables with correct schema
-- Run this in pgAdmin Query Tool

-- Drop dependent tables first
DROP TABLE IF EXISTS public.orderitem CASCADE;
DROP TABLE IF EXISTS public.order CASCADE;

-- Create order table with UUID user_id
CREATE TABLE public.order (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    order_details JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_address JSONB,
    billing_address JSONB,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending',
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT order_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create orderitem table
CREATE TABLE public.orderitem (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid NOT NULL,
    product_id BIGINT NOT NULL,
    product_name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    weight TEXT,
    grade TEXT,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT orderitem_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.order(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_order_user_id ON public.order(user_id);
CREATE INDEX idx_order_order_id ON public.order(order_id);
CREATE INDEX idx_orderitem_order_id ON public.orderitem(order_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_order_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_order_updated_at ON public.order;
CREATE TRIGGER update_order_updated_at
BEFORE UPDATE ON public.order
FOR EACH ROW EXECUTE FUNCTION update_order_updated_at();
