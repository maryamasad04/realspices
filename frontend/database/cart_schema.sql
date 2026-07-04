-- Create cart and cart_items tables for storing user cart
-- This follows a proper relational structure: one cart has many cart items

-- Drop existing tables if they exist (to ensure clean setup)
DROP TABLE IF EXISTS public.cart_items CASCADE;
DROP TABLE IF EXISTS public.cart CASCADE;

-- Create main cart table (one cart per user)
CREATE TABLE public.cart (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create cart_items table (many items per cart)
CREATE TABLE public.cart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cart_id UUID NOT NULL,
    product_id BIGINT NOT NULL,
    product_name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    original_price DECIMAL(10, 2),
    image TEXT,
    grade TEXT,
    weight TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cart_items_quantity_positive CHECK (quantity > 0),
    CONSTRAINT cart_items_price_positive CHECK (price >= 0),
    CONSTRAINT fk_cart FOREIGN KEY (cart_id) REFERENCES public.cart(id) ON DELETE CASCADE,
    CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES public.product(id) ON DELETE CASCADE,
    CONSTRAINT unique_cart_product UNIQUE(cart_id, product_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON public.cart(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);

-- Create trigger to update cart updated_at timestamp
CREATE OR REPLACE FUNCTION update_cart_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cart_updated_at 
    BEFORE UPDATE ON public.cart 
    FOR EACH ROW 
    EXECUTE FUNCTION update_cart_updated_at_column();

-- Create trigger to update cart_items updated_at timestamp
CREATE OR REPLACE FUNCTION update_cart_items_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    -- Also update parent cart's updated_at
    UPDATE public.cart SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.cart_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cart_items_updated_at 
    BEFORE UPDATE ON public.cart_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_cart_items_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.cart IS 'Stores user shopping carts - one cart per user';
COMMENT ON TABLE public.cart_items IS 'Stores items in each cart with quantities and prices';
COMMENT ON COLUMN public.cart.user_id IS 'ID of the user who owns this cart';
COMMENT ON COLUMN public.cart_items.cart_id IS 'Foreign key to cart table';
COMMENT ON COLUMN public.cart_items.product_id IS 'ID of the product in the cart';
COMMENT ON COLUMN public.cart_items.quantity IS 'Quantity of the product in cart';
