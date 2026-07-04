import { NextResponse } from 'next/server';
import { getActiveEmailProvider, hasRealEmailProvider, isEmailConfigured } from '@/lib/email';
import { getEmailFromAddress, isResendConfigured } from '@/lib/resendConfig';

export const dynamic = 'force-dynamic';

/** Public status for UI — never exposes API keys or secrets. */
export async function GET() {
  const provider = getActiveEmailProvider();

  return NextResponse.json({
    configured: isEmailConfigured(),
    realProvider: hasRealEmailProvider(),
    provider,
    resend: isResendConfigured(),
    from: hasRealEmailProvider() ? getEmailFromAddress() : undefined,
  });
}
