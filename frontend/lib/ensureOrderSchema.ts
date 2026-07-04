import { rawQuery } from '@/lib/postgresClient';

let schemaReady = false;

export async function ensureOrderSchema(): Promise<void> {
  if (schemaReady) return;

  await rawQuery(`
    ALTER TABLE public."order"
    ADD COLUMN IF NOT EXISTS address_id UUID REFERENCES public.address(id) ON DELETE SET NULL
  `);

  schemaReady = true;
}
