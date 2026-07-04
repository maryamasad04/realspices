import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { getEmailFromAddress, getResendApiKey, isResendConfigured } from '@/lib/resendConfig';

interface SendPasswordResetEmailOptions {
  to: string;
  resetLink: string;
  expiresMinutes: number;
}

export type EmailProvider = 'resend' | 'nodemailer' | 'dev-link' | 'none';

export interface SendPasswordResetEmailResult {
  sent: boolean;
  provider: EmailProvider;
  error?: string;
}

function buildPasswordResetHtml(resetLink: string, expiresMinutes: number): string {
  return `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
    <h2 style="color: #b91c1c; margin-bottom: 16px;">Reset your Real Spices password</h2>
    <p>Hello,</p>
    <p>We received a request to reset your password. Click the button below to choose a new password. This link expires in <strong>${expiresMinutes} minutes</strong>.</p>
    <p style="margin: 28px 0;">
      <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #d97706 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Reset Password
      </a>
    </p>
    <p style="font-size: 13px; color: #666;">If the button does not work, copy and paste this link into your browser:</p>
    <p style="font-size: 13px; word-break: break-all;"><a href="${resetLink}">${resetLink}</a></p>
    <p style="color: #666; font-size: 12px; margin-top: 24px;">If you did not request a password reset, you can safely ignore this email. Your password will not change unless you use the link above.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0;" />
    <p style="color: #9ca3af; font-size: 12px;">Real Spices Team</p>
  </div>
</body>
</html>`;
}

function buildPasswordResetText(resetLink: string, expiresMinutes: number): string {
  return `Reset your Real Spices password

We received a request to reset your password. Open this link to choose a new password (expires in ${expiresMinutes} minutes):

${resetLink}

If you did not request this, you can safely ignore this email.

— Real Spices Team`;
}

async function sendViaResend({
  to,
  resetLink,
  expiresMinutes,
}: SendPasswordResetEmailOptions): Promise<{ sent: boolean; error?: string }> {
  const apiKey = getResendApiKey();
  if (!apiKey) return { sent: false, error: 'RESEND_API_KEY is not set' };

  const resend = new Resend(apiKey);
  const from = getEmailFromAddress();

  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject: 'Reset your Real Spices password',
    html: buildPasswordResetHtml(resetLink, expiresMinutes),
    text: buildPasswordResetText(resetLink, expiresMinutes),
  });

  if (error) {
    console.error('[Email] Resend error:', error);
    return { sent: false, error: error.message };
  }

  console.log('[Email] Resend message id:', data?.id);
  return { sent: true };
}

async function sendViaNodemailer({ to, resetLink, expiresMinutes }: SendPasswordResetEmailOptions): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = getEmailFromAddress();

  if (!host || !user || !pass) return false;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to,
    subject: 'Reset your Real Spices password',
    html: buildPasswordResetHtml(resetLink, expiresMinutes),
    text: buildPasswordResetText(resetLink, expiresMinutes),
  });

  return true;
}

export function hasRealEmailProvider(): boolean {
  return isResendConfigured() || Boolean(process.env.SMTP_HOST);
}

function isDevEnvironment(): boolean {
  return process.env.NODE_ENV !== 'production';
}

export async function sendPasswordResetEmail(
  options: SendPasswordResetEmailOptions
): Promise<SendPasswordResetEmailResult> {
  try {
    if (isResendConfigured()) {
      const result = await sendViaResend(options);
      if (result.sent) return { sent: true, provider: 'resend' };
      if (isDevEnvironment()) {
        console.warn('[Email] Resend failed, falling back to dev link:', result.error);
      } else {
        return { sent: false, provider: 'none', error: result.error };
      }
    }

    if (process.env.SMTP_HOST) {
      const sent = await sendViaNodemailer(options);
      if (sent) return { sent: true, provider: 'nodemailer' };
    }

    if (isDevEnvironment()) {
      console.log('[Email] Dev mode — reset link shown in app UI');
      return { sent: true, provider: 'dev-link' };
    }

    return { sent: false, provider: 'none', error: 'No email provider configured' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown email error';
    console.error('[Email] Failed to send password reset email:', error);
    return { sent: false, provider: 'none', error: message };
  }
}

export function isEmailConfigured(): boolean {
  return hasRealEmailProvider() || isDevEnvironment();
}

export function getActiveEmailProvider(): EmailProvider {
  if (isResendConfigured()) return 'resend';
  if (process.env.SMTP_HOST) return 'nodemailer';
  if (isDevEnvironment()) return 'dev-link';
  return 'none';
}
