'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Eye, EyeOff, Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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

function ResetPasswordInner() {
  const { dark: darkMode } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState<string>('');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    // Get token from URL query params
    const tokenParam = searchParams.get('token');
    
    if (!tokenParam) {
      setError('Invalid or expired reset link. Please request a new one.');
      setIsValid(false);
      setValidating(false);
      return;
    }

    setToken(tokenParam);

    // Validate the reset token via API
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/auth/validate-reset-token?token=${encodeURIComponent(tokenParam)}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.valid) {
            setIsValid(true);
            console.log('Valid reset token');
          } else {
            setError(data.message || 'Invalid or expired reset link');
            setIsValid(false);
          }
        } else {
          setError('Invalid or expired reset link. Please request a new one.');
          setIsValid(false);
        }
      } catch (err: any) {
        console.error('Error validating reset token:', err);
        setError('Failed to validate reset link');
        setIsValid(false);
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Submit password reset via API
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess(true);
      
      // Redirect to login
      setTimeout(() => {
        router.push('/login?message=Password reset successfully. Please sign in with your new password.');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      console.error('Password reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (validating) {
    return (
      <PageShell className="flex items-center justify-center">
        <Card className={`${siteCard(darkMode)} shadow-none max-w-md w-full mx-4`}>
          <CardContent className="pt-8 flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin text-rose-800 mb-4" />
            <p className={siteSubtext(darkMode)}>Validating reset link...</p>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

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
              <Lock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className={siteHeading(darkMode, 'sm')}>
              Create New Password
            </CardTitle>
            <p className={`${siteSubtext(darkMode)} text-sm mt-2`}>
              Enter a new password to secure your account
            </p>
          </CardHeader>

          <CardContent className="pt-4">
            {success ? (
              <div className={`flex flex-col items-center text-center p-6 rounded-2xl border ${
                darkMode ? 'bg-green-900/20 border-green-800/50' : 'bg-green-50 border-green-200'
              }`}>
                <CheckCircle2 className="w-12 h-12 text-green-600 mb-3" />
                <h3 className={`font-light mb-2 ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
                  Password Reset Successful
                </h3>
                <p className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-600'}`}>
                  Your password has been updated. Redirecting to login...
                </p>
              </div>
            ) : !isValid ? (
              <div className={`flex flex-col gap-4 p-4 rounded-2xl border ${
                darkMode ? 'bg-rose-900/20 border-rose-800/50' : 'bg-rose-50 border-rose-200'
              }`}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-rose-300' : 'text-rose-700'}`}>
                      {error || 'Invalid or expired reset link'}
                    </p>
                  </div>
                </div>
                <Link 
                  href="/forgot-password" 
                  className={`${siteBackLink(darkMode)} normal-case tracking-normal underline`}
                >
                  Request a new reset link
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="password" className={darkMode ? 'text-white' : 'text-gray-700'}>
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className={siteInput(darkMode, 'pl-10 pr-10')}
                      placeholder="Enter new password (min 6 characters)"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className={darkMode ? 'text-white' : 'text-gray-700'}>
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={siteInput(darkMode, 'pl-10 pr-10')}
                      placeholder="Confirm new password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className={`flex items-start gap-3 p-3 rounded-xl border ${
                    darkMode ? 'bg-rose-900/20 border-rose-800/50' : 'bg-rose-50 border-rose-200'
                  }`}>
                    <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                    <p className={`text-sm ${darkMode ? 'text-rose-300' : 'text-rose-700'}`}>{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || !formData.password || !formData.confirmPassword}
                  className={siteBtnPrimary('w-full disabled:opacity-50 disabled:cursor-not-allowed')}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Resetting...</span>
                    </div>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
