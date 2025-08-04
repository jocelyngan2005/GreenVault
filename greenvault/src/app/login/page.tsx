'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleZkLogin = async (provider: 'email' | 'google') => {
    setIsLoading(true);
    // Simulate zkLogin process
    setTimeout(() => {
      setIsLoading(false);
      // Redirect to onboarding or dashboard
      window.location.href = '/onboarding';
    }, 2000);
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
              onClick={() => handleZkLogin('email')}
              disabled={isLoading}
              className="w-full bg-black text-white py-3 px-4 border border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Authenticating...' : 'Login with Email (zkLogin)'}
            </button>

            <button
              onClick={() => handleZkLogin('google')}
              disabled={isLoading}
              className="w-full bg-white text-black py-3 px-4 border border-black hover:bg-black hover:text-white transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Authenticating...' : 'Login with Google (zkLogin)'}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
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
