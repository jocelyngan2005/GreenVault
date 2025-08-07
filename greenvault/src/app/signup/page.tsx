'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { SignupCredentials, AuthResponse, ZkLoginData, ZkLoginState } from '@/types/zklogin';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [showWalletInfo, setShowWalletInfo] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [step, setStep] = useState<'initial' | 'processing' | 'success' | 'error'>('initial');
  const [zkLoginData, setZkLoginData] = useState<ZkLoginData | null>(null);
  const [userAddress, setUserAddress] = useState('');
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

        window.location.href = '/role-selection'; // Redirect to role selection

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
        
        // Only handle signup OAuth callbacks
        if (idToken && state === 'zklogin-signup') {
          handleOAuthCallback(idToken);
        }
      }
    };

    handleDirectCallback();

    return () => { };
  }, []);

  const generateGoogleAuthUrl = (nonce: string) => {
    const redirectUri = process.env.NEXT_PUBLIC_APP_URL_SIGNUP || 'http://localhost:3000/signup';
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID || '');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'id_token');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('nonce', nonce);
    authUrl.searchParams.set('state', 'zklogin-signup');

    return authUrl.toString();
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const credentials: SignupCredentials = { 
        email, 
        password, 
        name: name.trim() || undefined 
      };
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const result: AuthResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Signup failed');
      }

      // Store authentication token
      localStorage.setItem('auth-token', result.data!.token);
      localStorage.setItem('user-data', JSON.stringify(result.data!.user));
      
      window.location.href = '/onboarding';

    } catch (err) {
      console.error('Signup error:', err);
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async (provider: 'google') => {
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
      setError('Failed to initiate Google sign-up: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setStep('error');
      setIsGoogleLoading(false);
    }
  };

  const emailSignUp = () => {
    setShowEmailForm(!showEmailForm);
    setError('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setStep('initial');
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
    setShowEmailForm(false);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
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
              {showEmailForm ? 'Create your account' : 'Create your secure digital identity'}
            </p>
          </div>

          {!isMounted ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : step === 'processing' && !showEmailForm ? (
            // Processing zkLogin
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Processing Authentication
              </h3>
              <p className="text-gray-600">
                Generating keys, verifying JWT, and creating your zkLogin address...
              </p>
            </div>
          ) : showEmailForm ? (
            // Email Signup Form
            <form onSubmit={handleEmailSignup} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Name (Optional)
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-black px-3 py-2 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="Your full name"
                />
              </div>

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
                  placeholder="Choose a password (min. 6 characters)"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-black px-3 py-2 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="Confirm your password"
                  required
                />
              </div>

              {error && (
                <div className="text-red-700 text-sm text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-black text-white py-3 px-4 border border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <label htmlFor="zkEmail" className="block text-sm font-medium mb-2">
                  Email (Optional for zkLogin)
                </label>
                <input
                  type="email"
                  id="zkEmail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-black px-3 py-2 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="your@email.com"
                />
              </div>

              <div className="space-y-4">
                <button
                  onClick={emailSignUp}
                  className="w-full bg-black text-white py-3 px-4 border border-black hover:bg-white hover:text-black transition-colors"
                >
                  Sign Up with Email
                </button>

                <button
                  onClick={() => handleGoogleSignup('google')}
                  disabled={isGoogleLoading}
                  className="w-full bg-white text-black py-3 px-4 border border-black hover:bg-black hover:text-white transition-colors disabled:opacity-50"
                >
                  {isGoogleLoading ? 'Redirecting to Google...' : 'Sign Up with Google (zkLogin)'}
                </button>
              </div>
            </div>
          )}

          {/* Show error */}
          {step === 'error' && !showEmailForm && (
            <div className="mt-4 text-center">
              <p className="text-red-700 text-sm">Authentication error: {error}</p>
              <button
                onClick={reset}
                className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          )}

          {!showEmailForm && step === 'initial' && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-xs text-gray-600 space-y-2">
                <p>• zkLogin creates a decentralized identity without storing personal data</p>
                <p>• Your vault will be encrypted and stored on Walrus & Seal</p>
                <p>• No wallet required - privacy-first approach</p>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            {showEmailForm ? (
              <button
                onClick={emailSignUp}
                className="text-sm text-blue-600 hover:underline"
              >
                ← Back to zkLogin options
              </button>
            ) : null}
            <Link href="/login" className="text-sm hover:underline block mt-2">
              Already have an account? Login
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-gray-600 hover:underline">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
