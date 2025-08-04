'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleSignup = async (provider: 'email' | 'google') => {
    setIsLoading(true);
    // Simulate zkLogin signup process
    setTimeout(() => {
      setIsLoading(false);
      // Redirect to onboarding
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
            <p className="mt-2 text-gray-600">Create your secure digital identity</p>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email (Optional for zkLogin)
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-black px-3 py-2 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="your@email.com"
              />
            </div>

            <div className="space-y-4">
              <button
                onClick={() => handleSignup('email')}
                disabled={isLoading}
                className="w-full bg-black text-white py-3 px-4 border border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Creating Account...' : 'Sign Up with Email (zkLogin)'}
              </button>

              <button
                onClick={() => handleSignup('google')}
                disabled={isLoading}
                className="w-full bg-white text-black py-3 px-4 border border-black hover:bg-black hover:text-white transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Creating Account...' : 'Sign Up with Google (zkLogin)'}
              </button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-xs text-gray-600 space-y-2">
              <p>• zkLogin creates a decentralized identity without storing personal data</p>
              <p>• Your vault will be encrypted and stored on Walrus & Seal</p>
              <p>• No wallet required - privacy-first approach</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <Link href="/login" className="text-sm hover:underline">
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
