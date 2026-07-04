-- Migration: backfill timestamps, set defaults, ensure sequence sync and trigger for product table
-- Run this in your local Postgres (psql or pgAdmin)

-- 1) Backfill any NULL timestamps so NOT NULL can be applied safely
UPDATE public.product SET created_at = NOW() WHERE created_at IS NULL;
UPDATE public.product SET updated_at = NOW() WHERE updated_at IS NULL;

-- 2) Set sensible defaults for new rows
ALTER TABLE public.product ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE public.product ALTER COLUMN updated_at SET DEFAULT NOW();

-- 3) Ensure sequence exists and is set to max(id)
CREATE SEQUENCE IF NOT EXISTS public.product_id_seq START 1;
ALTER SEQUENCE public.product_id_seq OWNED BY public.product.id;
SELECT setval('public.product_id_seq', COALESCE((SELECT MAX(id) FROM public.product), 1));
ALTER TABLE public.product ALTER COLUMN id SET DEFAULT nextval('public.product_id_seq'::regclass);

-- 4) Create/replace trigger function to update updated_at on row updates
CREATE OR REPLACE FUNCTION public.update_product_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_product_updated_at ON public.product;
CREATE TRIGGER update_product_updated_at
  BEFORE UPDATE ON public.product
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_updated_at();

-- 5) (Optional) Verify: select id, created_at, updated_at from public.product order by id desc limit 5;
