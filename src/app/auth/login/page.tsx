'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store JWT token
        localStorage.setItem('aegis_token', data.access_token);
        localStorage.setItem('aegis_token_expires', (Date.now() + (data.expires_in * 1000)).toString());
        
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError('Authentication failed. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Aegis Forensics</h1>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Access your digital forensics platform
            </p>
          </div>

          <div className="mt-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500 sm:text-sm"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 pr-10 placeholder-gray-400 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-slate-500 sm:text-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '👁️‍🗨️' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300 text-slate-600 focus:ring-slate-500"
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link
                    href="/auth/forgot-password"
                    className="font-medium text-slate-600 hover:text-slate-500"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full justify-center rounded-md border border-transparent bg-slate-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">Test Credentials</span>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-md">
                <p className="font-medium mb-2">Demo Login (if no admin setup):</p>
                <p>Email: admin@company.com</p>
                <p>Password: secure_password_123</p>
                <p className="text-xs mt-2 text-gray-500">
                  Note: First setup admin at /auth/setup-admin if needed
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700">
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          
          {/* Overlay content */}
          <div className="relative z-10 flex flex-col justify-center h-full px-12 text-white">
            <div className="max-w-md">
              <h2 className="text-4xl font-bold mb-6">
                Digital Forensics Platform
              </h2>
              <p className="text-xl text-slate-300 mb-8">
                Advanced AI-powered tools for comprehensive digital investigations and evidence analysis.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center">
                    <span className="text-sm">🔍</span>
                  </div>
                  <span className="text-slate-200">Deep Evidence Analysis</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center">
                    <span className="text-sm">🤖</span>
                  </div>
                  <span className="text-slate-200">AI-Powered Insights</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center">
                    <span className="text-sm">🔒</span>
                  </div>
                  <span className="text-slate-200">Secure Chain of Custody</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center">
                    <span className="text-sm">📊</span>
                  </div>
                  <span className="text-slate-200">Real-time Monitoring</span>
                </div>
              </div>
            </div>
          </div>

          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
