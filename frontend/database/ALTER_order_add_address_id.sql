-- Link orders to saved delivery addresses
ALTER TABLE public."order"
  ADD COLUMN IF NOT EXISTS address_id UUID REFERENCES public.address(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_order_address_id ON public."order"(address_id);
