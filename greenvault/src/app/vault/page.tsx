'use client';

import { useEffect } from 'react';

export default function VaultPage() {
  useEffect(() => {
    // Redirect to profile page since vault is now part of profile
    window.location.href = '/profile';
  }, []);

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
        <p className="text-gray-600">The vault has been moved to your profile page.</p>
        <a href="/profile" className="text-blue-600 hover:underline">
          Go to Profile →
        </a>
      </div>
    </div>
  );
}
