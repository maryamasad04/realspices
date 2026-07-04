import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcryptjs from 'bcryptjs';
import { postgres } from '@/lib/postgresClient';
import { ensurePasswordResetSchema } from '@/lib/ensurePasswordResetSchema';
import {
  findValidResetToken,
  consumeResetToken,
  deleteResetToken,
} from '@/lib/passwordReset';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await ensurePasswordResetSchema();

    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const resetToken = await findValidResetToken(tokenHash);

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid, expired, or already used reset link' },
        { status: 401 }
      );
    }

    // Atomically mark token as used before updating password (prevents reuse)
    const consumed = await consumeResetToken(resetToken.id);
    if (!consumed) {
      return NextResponse.json(
        { error: 'Invalid, expired, or already used reset link' },
        { status: 401 }
      );
    }

    const hashedPassword = await bcryptjs.hash(password, 12);

    const { error: updateError } = await postgres
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', consumed.user_id);

    if (updateError) {
      console.error('[Password Reset] Failed to update password:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    // Remove token record after successful reset
    await deleteResetToken(consumed.id);

    // Invalidate any other outstanding tokens for this user
    await postgres
      .from('password_reset_tokens')
      .delete()
      .eq('user_id', consumed.user_id);

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Password Reset] Unexpected error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
