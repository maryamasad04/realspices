'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, User, Mail, Lock, ArrowLeft, ShieldCheck, Users, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login, signup, getProfile } from '../../lib/backendApi.js';

import { useUser } from '@/context/UserContext';
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
  siteDivider,
} from '@/lib/siteStyles';

export default function LoginPage() {
  const { dark: darkMode } = useTheme();
  const router = useRouter();
  const [loginType, setLoginType] = useState<'selection' | 'admin' | 'user'>('selection');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const { user, setUser, logout } = useUser();

  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAdminLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Call admin auth API
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.email,
          password: formData.password,
          action: 'login'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Save admin info to localStorage
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('adminId', data.admin.admin_id);
        localStorage.setItem('adminUsername', data.admin.username);
        
        // Redirect to admin dashboard
        router.push('/admin/dashboard');
      } else {
        // Check for 401 Unauthorized (invalid credentials)
        if (response.status === 401) {
          setError('Incorrect username or password. Please try again.');
        } else {
          setError(data.error || 'Login failed. Please check your credentials.');
        }
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Admin login failed';
      if (errorMessage.includes('Network error')) {
        setError('Unable to connect to server. Please check your connection and try again.');
      } else {
        setError(errorMessage);
      }
    }
    setIsLoading(false);
  };

  const handleUserLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const res = await login({ email: formData.email, password: formData.password });
        if (res.token) {
          localStorage.setItem('authToken', res.token);
          const profile = await getProfile(res.token);
          if (profile && profile.user) {
            localStorage.setItem('userId', String(profile.user.id));
            // Don't clear cart - let returning users keep their items
            setUser(profile.user);
          }
          window.location.href = '/';
        } else {
          setError(res.error || 'Login failed');
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }
        const res = await signup({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
        });
        if (res.token) {
          localStorage.setItem('authToken', res.token);
          const profile = await getProfile(res.token);
          if (profile && profile.user) {
            localStorage.setItem('userId', String(profile.user.id));
            // New user signup - start with fresh cart
            localStorage.removeItem('tadbir_cart_guest');
            localStorage.removeItem('tadbir_cart');
            setUser(profile.user);
          }
          window.location.href = '/';
        } else {
          setError(res.error || 'Signup failed');
        }
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Server error';
      
      // Check for 401 Unauthorized (invalid credentials)
      if (errorMessage.includes('401') || errorMessage.includes('Invalid credentials')) {
        setError('Incorrect email or password. Please try again.');
      } else if (errorMessage.includes('Network error')) {
        setError('Unable to connect to server. Please check your connection and try again.');
      } else {
        setError(errorMessage);
      }
    }
    setIsLoading(false);
  };

  // Selection page
  if (loginType === 'selection') {
    return (
      <PageShell>
        <div className={`${siteContainer()} max-w-2xl py-12`}>
          <Link href="/" className={`${siteBackLink(darkMode)} mb-8`}>
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <div className="text-center mb-8">
            <h1 className={`${siteHeading(darkMode, 'md')} mb-4`}>Choose Login Type</h1>
            <p className={siteSubtext(darkMode)}>Please select how you would like to access Real Spices</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Admin Login */}
            <Card 
              className={`${siteCard(darkMode, true)} cursor-pointer shadow-none`}
              onClick={() => setLoginType('admin')}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-rose-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <h3 className={`${siteHeading(darkMode, 'sm')} mb-2`}>Admin Login</h3>
                <p className={`${siteSubtext(darkMode)} text-sm mb-4`}>Access admin dashboard with full control over products, orders, and analytics</p>
                <div className="flex items-center justify-center space-x-2 text-xs">
                  <BarChart3 className="w-4 h-4" />
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Dashboard Access</span>
                </div>
              </CardContent>
            </Card>

            {/* User Login */}
            <Card 
              className={`${siteCard(darkMode, true)} cursor-pointer shadow-none`}
              onClick={() => setLoginType('user')}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-rose-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className={`${siteHeading(darkMode, 'sm')} mb-2`}>User Login</h3>
                <p className={`${siteSubtext(darkMode)} text-sm mb-4`}>Sign in to your customer account to shop, track orders, and manage your profile</p>
                <div className="flex items-center justify-center space-x-2 text-xs">
                  <User className="w-4 h-4" />
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Customer Portal</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageShell>
    );
  }
  // Admin login form
  if (loginType === 'admin') {
    return (
      <PageShell>
        <div className={`${siteContainer()} max-w-md py-12`}>
          <button 
            onClick={() => setLoginType('selection')}
            className={`${siteBackLink(darkMode)} mb-8`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login Selection
          </button>
          
          <Card className={`${siteCard(darkMode)} shadow-none`}>
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-rose-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <CardTitle className={siteHeading(darkMode, 'sm')}>
                Admin Login
              </CardTitle>
              <p className={`${siteSubtext(darkMode)} text-sm`}>
                Access the admin dashboard
              </p>
            </CardHeader>
            <CardContent className="pt-2">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email" className={darkMode ? 'text-white' : 'text-gray-700'}>
                    Admin Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="text"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className={siteInput(darkMode, 'pl-10')}
                      placeholder="admin"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="password" className={darkMode ? 'text-white' : 'text-gray-700'}>
                    Password
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
                      placeholder="Enter admin password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div className={`text-sm text-center p-3 rounded-xl border ${darkMode ? 'bg-rose-900/20 border-rose-800/50' : 'bg-rose-50 border-rose-100'}`}>
                  <p className="text-rose-700 dark:text-rose-400">Demo: admin@realspices.com / admin123</p>
                </div>
                
                <Button
                  type="submit"
                  disabled={isLoading}
                  className={siteBtnPrimary('w-full')}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Signing In...</span>
                    </div>
                  ) : (
                    'Sign In as Admin'
                  )}
                </Button>
                {error && <div className="text-rose-700 text-center text-sm">{error}</div>}
              </form>
            </CardContent>
          </Card>
        </div>
      </PageShell>
    );
  }
  // User login form (existing login/signup)
  return (
    <PageShell>
      <div className={`${siteContainer()} max-w-md py-12`}>
        <button 
          onClick={() => setLoginType('selection')}
          className={`${siteBackLink(darkMode)} mb-8`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login Selection
        </button>
        <Card className={`${siteCard(darkMode)} shadow-none`}>
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-rose-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <CardTitle className={siteHeading(darkMode, 'sm')}>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <p className={`${siteSubtext(darkMode)} text-sm`}>
              {isLogin 
                ? 'Sign in to your Real Spices account' 
                : 'Join the Real Spices family today'
              }
            </p>
          </CardHeader>
          <CardContent className={`pt-2${mounted ? ' custom-cursor-on-hover' : ''}`}>
            <form onSubmit={handleUserLogin} className="space-y-4">
              {!isLogin && (
                <div>
                  <Label htmlFor="name" className={darkMode ? 'text-white' : 'text-gray-700'}>
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required={!isLogin}
                      autoComplete="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={siteInput(darkMode, 'pl-10')}
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="email" className={darkMode ? 'text-white' : 'text-gray-700'}>
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={siteInput(darkMode, 'pl-10')}
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="password" className={darkMode ? 'text-white' : 'text-gray-700'}>
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    className={siteInput(darkMode, 'pl-10 pr-10')}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {!isLogin && (
                <div>
                  <Label htmlFor="confirmPassword" className={darkMode ? 'text-white' : 'text-gray-700'}>
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      required={!isLogin}
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={siteInput(darkMode, 'pl-10')}
                      placeholder="Confirm your password"
                    />
                  </div>
                </div>
              )}
              {!isLogin && (
                <div>
                  <Label htmlFor="phone" className={darkMode ? 'text-white' : 'text-gray-700'}>
                    Phone Number
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="phone"
                      name="phone"
                      type="text"
                      required={!isLogin}
                      autoComplete="tel"
                      value={formData.phone || ''}
                      onChange={handleInputChange}
                      className={siteInput(darkMode, 'pl-10')}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
              )}
              {isLogin && (
                <div className="text-right">
                  <Link href="/forgot-password" className={`text-sm ${siteBackLink(darkMode)} normal-case tracking-normal`}>
                    Forgot Password?
                  </Link>
                </div>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className={siteBtnPrimary('w-full')}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
                  </div>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </Button>
              {error && <div className="text-rose-700 text-center text-sm">{error}</div>}

            </form>
            <Separator className={`my-6 ${siteDivider(darkMode)}`} />
            <div className="text-center">
              <p className={`text-sm ${siteSubtext(darkMode)}`}>
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setFormData({ name: '', email: '', password: '', confirmPassword: '', phone: '' });
                    setError('');
                  }}
                  className={`ml-2 ${siteBackLink(darkMode)} normal-case tracking-normal`}
                >
                  {isLogin ? 'Create Account' : 'Sign In'}
                </button>
              </p>
            </div>
            {!isLogin && (
              <p className={`text-xs text-center mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                By creating an account, you agree to our{' '}
                <Link href="/terms" className={siteBackLink(darkMode)}>
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className={siteBackLink(darkMode)}>
                  Privacy Policy
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
