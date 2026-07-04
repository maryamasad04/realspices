-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);

-- Create index on token_hash for token validation
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON public.password_reset_tokens(token_hash);

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON public.password_reset_tokens(expires_at);
