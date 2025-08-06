'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = () => {
      const hash = window.location.hash;
      const urlParams = new URLSearchParams(searchParams);
      const state = urlParams.get('state');
      
      if (hash && hash.includes('id_token=')) {
        // Extract the parameters from the hash
        const hashParams = new URLSearchParams(hash.substring(1));
        const idToken = hashParams.get('id_token');
        const returnedState = hashParams.get('state');
        
        if (idToken) {
          // Store the ID token temporarily
          sessionStorage.setItem('oauth_id_token', idToken);
          
          // Route based on state parameter
          if (returnedState === 'zklogin-signup') {
            // Redirect to signup page to handle the callback
            router.push('/signup?oauth_callback=true');
          } else if (returnedState === 'zklogin') {
            // Redirect to login page to handle the callback
            router.push('/login?oauth_callback=true');
          } else {
            // Default to login if state is unclear
            router.push('/login?oauth_callback=true');
          }
        } else {
          // No ID token found, redirect to login with error
          router.push('/login?error=oauth_failed');
        }
      } else {
        // No hash found, redirect to login
        router.push('/login?error=oauth_failed');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Completing Authentication</h2>
        <p className="text-gray-600">Please wait while we process your authentication...</p>
      </div>
    </div>
  );
}
