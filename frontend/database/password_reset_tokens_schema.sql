-- Password reset tokens for local PostgreSQL
-- Run this SQL in your PostgreSQL database

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON public.password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON public.password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_used_at ON public.password_reset_tokens(used_at);

-- Ensure used_at column exists on older installations
ALTER TABLE public.password_reset_tokens
  ADD COLUMN IF NOT EXISTS used_at TIMESTAMP WITH TIME ZONE;
