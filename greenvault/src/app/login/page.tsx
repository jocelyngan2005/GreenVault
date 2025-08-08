'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import type { ZkLoginData, ZkLoginState, LoginCredentials, AuthResponse } from '@/types/zklogin';
import Link from 'next/link';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function LoginPage() {
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [step, setStep] = useState<'initial' | 'processing' | 'success' | 'error'>('initial');
  const [error, setError] = useState('');
  const [zkLoginData, setZkLoginData] = useState<ZkLoginData | null>(null);
  const [userAddress, setUserAddress] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [showWalletInfo, setShowWalletInfo] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check for OAuth callback on component mount
  useEffect(() => {
    // Ensure this only runs on client side
    if (typeof window === 'undefined') return;

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

        const authResult = await authResponse.json();
        
        if (!authResult.success) {
          throw new Error(authResult.error || 'Authentication failed');
        }

        const { data: zkLoginData, vaultInfo } = authResult;

        setZkLoginData(zkLoginData);
        setUserAddress(zkLoginData.userAddress);
        setStep('success');

        // Store zkLogin data for use in other pages
        localStorage.setItem('zklogin-data', JSON.stringify(zkLoginData));

        // Check and setup vault for user
        await checkAndSetupVault(zkLoginData);

        // Check if user has a role preference, otherwise go to role selection
        const userRole = localStorage.getItem('user-role');
        if (userRole === 'project-owner') {
          window.location.href = '/project-owner';
        } else if (userRole === 'credit-buyer') {
          window.location.href = '/credit-buyer';
        } else {
          window.location.href = '/role-selection';
        }

      } catch (err) {
        console.error('OAuth callback error:', err);
        setError('Authentication failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
        setStep('error');
      } finally {
        setIsGoogleLoading(false);
      }
    };

    // Check for OAuth callback from URL hash (direct from Google)
    const handleDirectCallback = () => {
      const hash = window.location.hash;
      if (hash && hash.includes('id_token=')) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const idToken = hashParams.get('id_token');
        const state = hashParams.get('state');
        
        // Only handle login OAuth callbacks
        if (idToken && state === 'zklogin') {
          handleOAuthCallback(idToken);
        }
      }
    };

    handleDirectCallback();

    return () => { };
  }, []);

  const generateGoogleAuthUrl = (nonce: string) => {
    const redirectUri = process.env.NEXT_PUBLIC_APP_URL_LOGIN || 'http://localhost:3000/login';
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID || '');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'id_token');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('nonce', nonce);
    authUrl.searchParams.set('state', 'zklogin');

    return authUrl.toString();
  };

  // Email Login handler
  // Function to check and setup vault for user
  const checkAndSetupVault = async (userData: any) => {
    try {
      console.log('Checking vault for user:', userData.email || userData.id);
      
      // Check if user has completed onboarding before
      const onboardingCompleted = localStorage.getItem('onboarding-completed');
      
      // Only automatically setup vault for existing users who have completed onboarding
      if (onboardingCompleted !== 'true') {
        console.log('User has not completed onboarding, skipping automatic vault setup');
        return;
      }
      
      // Generate consistent vault key
      const vaultKey = `vault-${userData.id}-consistent`;
      
      // Call vault check API
      const response = await fetch('/api/vault/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          userId: userData.email || userData.id,
          userKey: vaultKey,
          authType: userData.authType || 'email'
        })
      });

      const result = await response.json();

      if (result.success) {
        // Store vault information
        const vaultData = {
          vaultBlobId: result.data.blobId,
          userId: result.data.userId,
          initialized: true,
          timestamp: result.data.timestamp
        };
        localStorage.setItem(`vault-${result.data.userId}`, result.data.blobId);
        localStorage.setItem('vault-data', JSON.stringify(vaultData));
        console.log('Vault information stored:', vaultData);
      } else {
        console.warn('Vault setup failed:', result.message);
      }
    } catch (error) {
      console.error('Vault check/setup failed:', error);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setIsEmailLoading(true);
      setError('');
      setStep('processing');

      const credentials: LoginCredentials = { email, password };
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const result: AuthResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Login failed');
      }

      // Store authentication token
      localStorage.setItem('auth-token', result.data!.token);
      localStorage.setItem('user-data', JSON.stringify(result.data!.user));

      // Check and setup vault for user
      await checkAndSetupVault(result.data!.user);

      setStep('success');

      // Check if user has a role preference, otherwise go to role selection
      const userRole = localStorage.getItem('user-role');
      if (userRole === 'project-owner') {
        window.location.href = '/project-owner';
      } else if (userRole === 'credit-buyer') {
        window.location.href = '/credit-buyer';
      } else {
        window.location.href = '/role-selection';
      }

    } catch (err) {
      console.error('Email login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      setStep('error');
    } finally {
      setIsEmailLoading(false);
    }
  };

  // Email Login toggler
  const toggleLoginMode = () => {
    setShowEmailForm(!showEmailForm);
    setError('');
    setStep('initial');
    setEmail('');
    setPassword('');
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
    setEmail('');
    setPassword('');
    setShowEmailForm(false);
    setWalletAddress('');
    setShowWalletInfo(false);

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
            <p className="mt-2 text-gray-600">
              {showEmailForm ? 'Login with your credentials' : 'Secure login with zkProof technology'}
            </p>
          </div>

          {!isMounted ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : showEmailForm ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-black px-3 py-2 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-black px-3 py-2 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isEmailLoading}
                className="w-full bg-black text-white py-3 px-4 border border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50"
              >
                {isEmailLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <button
                onClick={toggleLoginMode}
                className="w-full bg-black text-white py-3 px-4 border border-black hover:bg-white hover:text-black transition-colors"
              >
                Sign In with Email
              </button>
              
              <button
                onClick={() => handleGoogleLogin('google')}
                disabled={isGoogleLoading}
                className="w-full bg-white text-black py-3 px-4 border border-black hover:bg-black hover:text-white transition-colors disabled:opacity-50"
              >
                {isGoogleLoading ? 'Authenticating...' : 'Sign In with Google'}
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className="mt-4 text-center">
              <p className="text-red-700 text-sm">Authentication error: {error}</p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            {showEmailForm ? (
              <button
                onClick={toggleLoginMode}
                className="text-sm text-blue-600 hover:underline"
              >
                ← Back to zkLogin options
              </button>
            ) : (
              <p className="text-sm text-gray-600 mb-4">
                zkLogin provides wallet-less authentication while maintaining privacy
              </p>
            )}
            <Link href="/signup" className="text-sm hover:underline block mt-2">
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