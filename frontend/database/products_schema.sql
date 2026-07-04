-- Create products table for product management
-- Run this SQL in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.product (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    grade VARCHAR(100),
    weight VARCHAR(50),
    price DECIMAL(10,2) NOT NULL,
    originalPrice DECIMAL(10,2),
    rating DECIMAL(3,2) DEFAULT 0,
    reviews INTEGER DEFAULT 0,
    image VARCHAR(500),
    badge VARCHAR(100),
    description TEXT,
    features JSONB,
    stock INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued', 'out_of_stock')),
    sku VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_name ON public.product(name);
CREATE INDEX IF NOT EXISTS idx_product_status ON public.product(status);
CREATE INDEX IF NOT EXISTS idx_product_sku ON public.product(sku);
CREATE INDEX IF NOT EXISTS idx_product_price ON public.product(price);
CREATE INDEX IF NOT EXISTS idx_product_stock ON public.product(stock);
CREATE INDEX IF NOT EXISTS idx_product_created_at ON public.product(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_updated_at 
    BEFORE UPDATE ON public.product 
    FOR EACH ROW 
    EXECUTE FUNCTION update_product_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.product ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Allow anonymous users to read products (public access)
CREATE POLICY "public_product_read" ON public.product
    FOR SELECT 
    TO public
    USING (true);

-- Allow service role to do everything (for API routes)
CREATE POLICY "service_role_all_products" ON public.product
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to view products
CREATE POLICY "authenticated_product_read" ON public.product
    FOR SELECT
    TO authenticated
    USING (true);

-- Only allow admin users to modify products (you'll need to add admin user management)
-- For now, allowing authenticated users to insert/update for testing
CREATE POLICY "authenticated_product_write" ON public.product
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Add sample data
INSERT INTO public.product (name, grade, weight, price, originalPrice, rating, reviews, image, badge, description, features, stock, sku) 
VALUES 
    ('Premium Kashmir Saffron', 'Grade A+', '1g', 399, 499, 4.9, 156, '/p-1.jpg', 'Best Seller', 'Authentic Kashmiri saffron with rich aroma and deep red color. Perfect for biryanis and desserts.', '["100% Pure", "Premium Quality", "Rich Aroma"]', 50, 'SAF-001'),
    ('Organic Saffron Threads', 'Organic', '2g', 649, 799, 4.8, 89, '/p-2.jpg', 'Organic', 'Certified organic saffron grown without pesticides. Perfect for health-conscious cooking.', '["Organic Certified", "Chemical Free", "Lab Tested"]', 30, 'SAF-002'),
    ('Saffron Gift Set', 'Premium', '5g', 1299, 1599, 4.9, 42, '/saffron-gift-set.jpg', 'Limited Edition', 'Exclusive gift set with premium saffron, recipe book, and elegant wooden box.', '["Wooden Gift Box", "Recipe Book", "Limited Edition"]', 8, 'SAF-003'),
    ('Spanish Saffron La Mancha', 'Grade I', '1g', 299, 399, 4.7, 78, '/spanish-saffron.jpg', 'Import', 'High-quality Spanish saffron from La Mancha region. Great for paellas and Mediterranean cuisine.', '["Spanish Origin", "La Mancha", "Authentic"]', 25, 'SAF-004'),
    ('Saffron Powder', 'Grade A', '2g', 199, 249, 4.6, 123, '/saffron-powder.jpg', 'Value Pack', 'Finely ground saffron powder for easy mixing in milk, desserts, and beverages.', '["Easy to Use", "Quick Dissolving", "Value for Money"]', 40, 'SAF-005'),
    ('Bulk Saffron Pack', 'Commercial', '10g', 2499, 2999, 4.8, 34, '/p-6.jpg', 'Wholesale', 'Bulk pack for restaurants and commercial use. Best value for professional kitchens.', '["Bulk Quantity", "Commercial Grade", "Best Value"]', 15, 'SAF-006')
ON CONFLICT (sku) DO NOTHING;

-- Comment on table and columns for documentation
COMMENT ON TABLE public.product IS 'Table to store product information for the saffron e-commerce store';
COMMENT ON COLUMN public.product.features IS 'JSON array containing product features and highlights';
COMMENT ON COLUMN public.product.status IS 'Product status: active, inactive, discontinued, out_of_stock';
COMMENT ON COLUMN public.product.stock IS 'Available quantity in inventory';
COMMENT ON COLUMN public.product.sku IS 'Stock Keeping Unit - unique product identifier';