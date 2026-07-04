import pg from 'pg';

const pool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  database: 'realspices',
  user: 'postgres',
  password: '12345678',
});

const sql = `
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
`;

try {
  await pool.query(sql);
  const check = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='password_reset_tokens'"
  );
  console.log('OK - table created:', check.rows[0]?.table_name);
} catch (e) {
  console.error('FAILED:', e.message);
  process.exit(1);
} finally {
  await pool.end();
}
