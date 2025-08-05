'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import type { ZkLoginData, ZkLoginState } from '@/types/zklogin';
import Link from 'next/link';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL;

export default function LoginPage() {
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [step, setStep] = useState<'initial' | 'processing' | 'success' | 'error'>('initial');
  const [error, setError] = useState('');
  const [zkLoginData, setZkLoginData] = useState<ZkLoginData | null>(null);
  const [userAddress, setUserAddress] = useState('');

  // Check for OAuth callback on component mount
  useEffect(() => {
    const handleOAuthCallback = async (idToken: string) => {
      try {
        setIsGoogleLoading(true);
        setStep('processing');

        // Retrieve pre-login data
        const preLoginDataStr = sessionStorage.getItem('zklogin-predata');
        if (!preLoginDataStr) {
          throw new Error('Pre-login data not found');
        }

        const preLoginData = JSON.parse(preLoginDataStr) as ZkLoginState;

        // Generate user salt (in production, this should be stored securely)
        let userSalt = localStorage.getItem('zklogin-user-salt');
        if (!userSalt) {
          // Use 16 bytes (32 hex chars) to match prover's requirement
          userSalt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
          localStorage.setItem('zklogin-user-salt', userSalt);
        }

        // Authenticate with backend
        const authResponse = await fetch('/api/zklogin/authenticate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken,
            preLoginData,
            userSalt,
          }),
        });

        if (!authResponse.ok) {
          const errorData = await authResponse.json();
          throw new Error(errorData.error || 'Authentication failed');
        }

        const { data: zkLoginData } = await authResponse.json() as { data: ZkLoginData };

        setZkLoginData(zkLoginData);
        setUserAddress(zkLoginData.userAddress);
        setStep('success');

        // Store zkLogin data for use in other pages
        localStorage.setItem('zklogin-data', JSON.stringify(zkLoginData));

        window.location.href = '/onboarding'; // Redirect to onboarding

      } catch (err) {
        console.error('OAuth callback error:', err);
        setError('Authentication failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
        setStep('error');
      } finally {
        setIsGoogleLoading(false);
      }
    };

    // Handle real OAuth callback (from URL hash)
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const idToken = urlParams.get('id_token');

    if (idToken) {
      handleOAuthCallback(idToken);
    }

    // Only handle real OAuth callback
    return () => { };
  }, []);

  const generateGoogleAuthUrl = (nonce: string) => {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID || '');
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI || '');
    authUrl.searchParams.set('response_type', 'id_token');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('nonce', nonce);
    authUrl.searchParams.set('state', 'zklogin');

    return authUrl.toString();
  };

  // Email Login handler
  const handleEmailLogin = async (provider: 'email') => {
    setIsEmailLoading(true);
    // Simulate zkLogin process
    setTimeout(() => {
      setIsEmailLoading(false);
      // Redirect to onboarding or dashboard
      window.location.href = '/onboarding';
    }, 2000);
  };

  // Google Login handler
  const handleGoogleLogin = async (provider: 'google') => {
    try {
      setIsGoogleLoading(true);
      setStep('processing');
      setError('');

      // Generate pre-login data from backend
      const preLoginResponse = await fetch('/api/zklogin/prelogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!preLoginResponse.ok) {
        throw new Error('Failed to generate pre-login data');
      }

      const { data: preLoginData } = await preLoginResponse.json() as { data: ZkLoginState };

      // Store pre-login data in sessionStorage
      sessionStorage.setItem('zklogin-predata', JSON.stringify(preLoginData));

      // Always use real Google OAuth
      const authUrl = generateGoogleAuthUrl(preLoginData.nonce);
      window.location.href = authUrl;

    } catch (err) {
      setError('Failed to initiate Google sign-in: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setStep('error');
      setIsEmailLoading(false);
    }
  };

  const reset = () => {
    console.log('Resetting application state...');

    // Clear all storage
    sessionStorage.clear();
    localStorage.removeItem('zklogin-user-salt');

    // Clear all states
    setZkLoginData(null);
    setUserAddress('');
    setStep('initial');
    setError('');
    setIsGoogleLoading(false);

    console.log('Application state reset completed');
  };


  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="border border-black p-8">
          <div className="text-center mb-8">
            <Link href="/" className="text-2xl font-bold hover:underline">
              GreenVault
            </Link>
            <p className="mt-2 text-gray-600">Secure login with zkProof technology</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => handleEmailLogin('email')}
              disabled={isEmailLoading}
              className="w-full bg-black text-white py-3 px-4 border border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50"
            >
              {isEmailLoading ? 'Authenticating...' : 'Login with Email'}
            </button>

            <button
              onClick={() => handleGoogleLogin('google')}
              disabled={isGoogleLoading}
              className="w-full bg-white text-black py-3 px-4 border border-black hover:bg-black hover:text-white transition-colors disabled:opacity-50"
            >
              {isGoogleLoading ? 'Authenticating...' : 'Login with Google'}
            </button>
          </div>

          {step === 'error' && (
            <div className="mt-4 text-center">
              <p className="text-red-700 text-sm">Authentication error: {error}</p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-4">
              zkLogin provides wallet-less authentication while maintaining privacy
            </p>
            <Link href="/signup" className="text-sm hover:underline">
              Don't have an account? Sign up
            </Link>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-gray-600 hover:underline">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}