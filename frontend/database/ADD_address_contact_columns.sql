-- Migration: add phone and email to address table if missing
ALTER TABLE public.address
  ADD COLUMN IF NOT EXISTS phone VARCHAR(32),
  ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Optionally add indexes for phone/email if lookup by phone/email is required
CREATE INDEX IF NOT EXISTS idx_address_phone ON public.address(phone);
CREATE INDEX IF NOT EXISTS idx_address_email ON public.address(email);
