'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/hooks/use-theme';
import PageShell from '@/components/site/page-shell';
import {
  siteCard,
  siteBtnPrimary,
  siteInput,
  siteBackLink,
  siteHeading,
  siteSubtext,
  siteContainer,
} from '@/lib/siteStyles';

import { GENERIC_RESET_SUCCESS_MESSAGE } from '@/lib/passwordResetConstants';

export default function ForgotPasswordPage() {
  const { dark: darkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [devResetLink, setDevResetLink] = useState('');
  const [devMode, setDevMode] = useState(false);
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  const [emailProvider, setEmailProvider] = useState<string | null>(null);
  const [resendReady, setResendReady] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  React.useEffect(() => {
    fetch('/api/auth/email-status')
      .then((res) => res.json())
      .then((data) => setResendReady(Boolean(data.resend)))
      .catch(() => setResendReady(null));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setDevResetLink('');
    setDevMode(false);
    setEmailSent(null);
    setEmailProvider(null);
    setIsLoading(true);

    try {
      if (!email) {
        throw new Error('Please enter your email address');
      }

      console.log('Requesting password reset for:', email);

      // Call API to request password reset
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      setSuccess(true);
      setEmailSent(data.emailSent ?? null);
      setEmailProvider(data.emailProvider ?? null);
      setDevMode(Boolean(data.devMode));
      if (data.resetLink) {
        setDevResetLink(data.resetLink);
      }
      setEmail('');
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageShell>
      <div className={`${siteContainer()} max-w-md py-12`}>
        <Link href="/login" className={`${siteBackLink(darkMode)} mb-8`}>
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>

        <Card className={`${siteCard(darkMode)} shadow-none`}>
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-rose-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <CardTitle className={siteHeading(darkMode, 'sm')}>
              Forgot Password
            </CardTitle>
            <p className={`${siteSubtext(darkMode)} text-sm mt-2`}>
              Enter your email and we will send you a secure reset link valid for 15 minutes
            </p>
            {resendReady === false && (
              <p className={`text-xs mt-2 px-3 py-2 rounded-xl border ${
                darkMode ? 'bg-amber-900/20 text-amber-300 border-amber-800/50' : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                Add <code className="font-mono">RESEND_API_KEY</code> to .env.local for real inbox delivery.
              </p>
            )}
          </CardHeader>

          <CardContent className="pt-4">
            {success ? (
              <div className={`flex flex-col items-center text-center p-6 rounded-2xl border ${
                darkMode ? 'bg-green-900/20 border-green-800/50' : 'bg-green-50 border-green-200'
              }`}>
                <CheckCircle2 className="w-12 h-12 text-green-600 mb-3" />
                <h3 className={`font-light mb-2 ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
                  Check Your Email
                </h3>
                <p className={`text-sm mb-4 ${darkMode ? 'text-green-300' : 'text-green-600'}`}>
                  {devMode
                    ? 'Your reset link is ready. Click the button below to set a new password.'
                    : GENERIC_RESET_SUCCESS_MESSAGE}
                </p>

                {devMode && devResetLink && (
                  <a href={devResetLink} className="w-full mb-3 block">
                    <Button className={siteBtnPrimary('w-full')}>
                      Reset Password Now
                    </Button>
                  </a>
                )}

                {!devMode && emailSent === false && devResetLink && (
                  <a href={devResetLink} className="w-full mb-3 block">
                    <Button className={siteBtnPrimary('w-full')}>
                      Reset Password Now
                    </Button>
                  </a>
                )}

                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {devMode
                    ? 'Local development mode — no email is sent. Add RESEND_API_KEY to .env.local for real delivery.'
                    : emailProvider === 'resend'
                      ? "Didn't receive it? Check spam, or confirm your email is verified in your Resend account."
                      : emailSent
                        ? "Didn't receive the email? Check your spam folder or try again."
                        : devResetLink
                          ? 'Email delivery failed. Use the button above, or check RESEND_API_KEY in .env.local.'
                          : "If this email isn't registered, no reset link is created. Use the address you signed up with."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email" className={darkMode ? 'text-white' : 'text-gray-700'}>
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={siteInput(darkMode, 'pl-10')}
                      placeholder="Enter your email"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {error && (
                  <div className={`flex items-start gap-3 p-3 rounded-xl border ${
                    darkMode ? 'bg-rose-900/20 border-rose-800/50' : 'bg-rose-50 border-rose-200'
                  }`}>
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <p className={`text-sm ${darkMode ? 'text-rose-400' : 'text-rose-600'}`}>{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className={siteBtnPrimary('w-full')}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </div>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className={`text-sm ${siteSubtext(darkMode)}`}>
                Remember your password?{' '}
                <Link href="/login" className={siteBackLink(darkMode)}>
                  Sign In
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
