import { rawQuery } from '@/lib/postgresClient';
import { ensurePasswordResetSchema } from '@/lib/ensurePasswordResetSchema';

export interface ValidResetToken {
  id: number;
  user_id: string;
  expires_at: string;
}

export interface UserRecord {
  id: string;
  email: string;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const result = await rawQuery(
    `SELECT id, email FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [email.trim()]
  );

  if (result.error || !result.data?.length) {
    return null;
  }

  return result.data[0] as UserRecord;
}

export async function deleteResetTokensForUser(userId: string): Promise<void> {
  await rawQuery(`DELETE FROM password_reset_tokens WHERE user_id = $1`, [userId]);
}

export async function createResetToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date
): Promise<{ success: boolean; error?: string }> {
  await ensurePasswordResetSchema();

  const result = await rawQuery(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [userId, tokenHash, expiresAt.toISOString()]
  );

  if (result.error) {
    return { success: false, error: result.error.message };
  }

  return { success: true };
}

export async function findValidResetToken(tokenHash: string): Promise<ValidResetToken | null> {
  await ensurePasswordResetSchema();

  const result = await rawQuery(
    `SELECT id, user_id, expires_at
     FROM password_reset_tokens
     WHERE token_hash = $1
       AND expires_at > NOW()
       AND used_at IS NULL
     LIMIT 1`,
    [tokenHash]
  );

  if (result.error || !result.data?.length) {
    return null;
  }

  return result.data[0] as ValidResetToken;
}

/** Atomically mark token as used to prevent reuse. Returns null if already used or expired. */
export async function consumeResetToken(tokenId: number): Promise<ValidResetToken | null> {
  const result = await rawQuery(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE id = $1
       AND used_at IS NULL
       AND expires_at > NOW()
     RETURNING id, user_id, expires_at`,
    [tokenId]
  );

  if (result.error || !result.data?.length) {
    return null;
  }

  return result.data[0] as ValidResetToken;
}

export async function deleteResetToken(tokenId: number): Promise<void> {
  await rawQuery(`DELETE FROM password_reset_tokens WHERE id = $1`, [tokenId]);
}
