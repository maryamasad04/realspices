import { rawQuery } from '@/lib/postgresClient';

let schemaReady = false;

export async function ensurePasswordResetSchema(): Promise<void> {
  if (schemaReady) return;

  await rawQuery(`
    CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      used_at TIMESTAMP WITH TIME ZONE
    )
  `);

  await rawQuery(`
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id
    ON public.password_reset_tokens(user_id)
  `);

  await rawQuery(`
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash
    ON public.password_reset_tokens(token_hash)
  `);

  await rawQuery(`
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires
    ON public.password_reset_tokens(expires_at)
  `);

  await rawQuery(`
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_used_at
    ON public.password_reset_tokens(used_at)
  `);

  await rawQuery(`
    ALTER TABLE public.password_reset_tokens
    ADD COLUMN IF NOT EXISTS used_at TIMESTAMP WITH TIME ZONE
  `);

  schemaReady = true;
}
