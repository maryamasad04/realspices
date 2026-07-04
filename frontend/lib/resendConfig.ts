/** Resend email configuration — set RESEND_API_KEY in .env.local */

export function getResendApiKey(): string | undefined {
  const key = process.env.RESEND_API_KEY?.trim();
  return key || undefined;
}

export function getEmailFromAddress(): string {
  return process.env.EMAIL_FROM?.trim() || 'Real Spices <onboarding@resend.dev>';
}

export function isResendConfigured(): boolean {
  return Boolean(getResendApiKey());
}
