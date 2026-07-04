import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  findUserByEmail,
  deleteResetTokensForUser,
  createResetToken,
} from '@/lib/passwordReset';
import { sendPasswordResetEmail, isEmailConfigured } from '@/lib/email';
import {
  GENERIC_RESET_SUCCESS_MESSAGE,
  PASSWORD_RESET_EXPIRY_MS,
} from '@/lib/passwordResetConstants';

export const dynamic = 'force-dynamic';

const EXPIRY_MINUTES = PASSWORD_RESET_EXPIRY_MS / (60 * 1000);

function genericSuccess(extra?: Record<string, unknown>) {
  return NextResponse.json({
    success: true,
    message: GENERIC_RESET_SUCCESS_MESSAGE,
    ...extra,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const user = await findUserByEmail(email);

    // Always return the same response — do not reveal whether the email exists
    if (!user) {
      return genericSuccess();
    }

    await deleteResetTokensForUser(user.id);

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);

    const created = await createResetToken(user.id, tokenHash, expiresAt);
    if (!created.success) {
      console.error('[Password Reset] Failed to store token:', created.error);
      // Still return generic message to avoid leaking account existence
      return genericSuccess();
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetLink = `${appUrl}/reset-password?token=${resetToken}`;

    const { sent, provider, error: emailError } = await sendPasswordResetEmail({
      to: email,
      resetLink,
      expiresMinutes: EXPIRY_MINUTES,
    });

    if (!sent) {
      console.warn('[Password Reset] Email not sent for user:', user.id);
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Password Reset] Dev reset link:', resetLink);
      }
    } else {
      console.log(`[Password Reset] Email sent via ${provider} to:`, email);
    }

    const isDev = process.env.NODE_ENV !== 'production';

    return genericSuccess({
      emailSent: sent,
      emailProvider: sent ? provider : undefined,
      emailConfigured: isEmailConfigured(),
      ...(isDev && sent && provider === 'dev-link' ? { resetLink, devMode: true } : {}),
      ...(isDev && !sent ? { resetLink, emailError } : {}),
    });
  } catch (error: unknown) {
    console.error('[Password Reset] Unexpected error:', error);
    return genericSuccess();
  }
}
