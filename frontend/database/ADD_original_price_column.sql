-- Add original_price column to product table if it doesn't exist
ALTER TABLE public.product
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2);

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_product_original_price ON public.product(original_price);
