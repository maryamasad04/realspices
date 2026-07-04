import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { findValidResetToken } from '@/lib/passwordReset';

export const dynamic = 'force-dynamic';

async function validateToken(token: string) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const resetToken = await findValidResetToken(tokenHash);

  if (!resetToken) {
    return { valid: false as const };
  }

  return { valid: true as const, userId: resetToken.user_id };
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const result = await validateToken(token);

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, error: 'Invalid, expired, or already used reset link' },
        { status: 401 }
      );
    }

    return NextResponse.json({ valid: true, userId: result.userId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Password Reset] Validate error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const result = await validateToken(token);

    if (!result.valid) {
      return NextResponse.json(
        { error: 'Invalid, expired, or already used reset link' },
        { status: 401 }
      );
    }

    return NextResponse.json({ valid: true, userId: result.userId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Password Reset] Validate error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
