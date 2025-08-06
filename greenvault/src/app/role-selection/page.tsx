'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const roles = [
    {
      id: 'project-owner',
      title: 'Project Owner',
      subtitle: 'Unbanked Individual / Local Project Owner',
      description: 'Register your carbon offset project, mint NFTs, and list them on the marketplace',
      features: [
        'Register forest preservation, clean energy, or conservation projects',
        'Mint NFTs representing your carbon offset projects',
        'List projects on the marketplace for buyers',
        'Track project verification and sales',
        'No wallet required - use email login via zkLogin'
      ],
      icon: '🌱',
      redirectPath: '/project-owner'
    },
    {
      id: 'credit-buyer',
      title: 'Credit Buyer',
      subtitle: 'Company or Individual Wanting to Offset Emissions',
      description: 'Set emission offset goals, purchase carbon credits, and track your environmental impact',
      features: [
        'Set monthly/yearly carbon offset goals',
        'Browse and purchase verified carbon credit NFTs',
        'Track your carbon footprint and offset history',
        'AI assistant for automated offset recommendations',
        'Login with zkLogin or wallet connection'
      ],
      icon: '🏢',
      redirectPath: '/credit-buyer'
    }
  ];

  const handleRoleSelect = (roleId: string, redirectPath: string) => {
    setSelectedRole(roleId);
    // Store role in localStorage for future reference
    localStorage.setItem('user-role', roleId);
    
    // Redirect to role-specific interface
    setTimeout(() => {
      window.location.href = redirectPath;
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b border-black">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold hover:underline">
              GreenVault
            </Link>
            <Link href="/login" className="text-sm hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Role</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select how you'd like to use GreenVault. You can always switch between roles later.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {roles.map((role) => (
            <div
              key={role.id}
              className={`border-2 p-8 cursor-pointer transition-all duration-300 ${
                selectedRole === role.id
                  ? 'border-green-500 bg-green-50 scale-105'
                  : 'border-black hover:border-gray-600 hover:shadow-lg'
              }`}
              onClick={() => handleRoleSelect(role.id, role.redirectPath)}
            >
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">{role.icon}</div>
                <h2 className="text-2xl font-bold mb-2">{role.title}</h2>
                <p className="text-sm text-gray-600 font-medium">{role.subtitle}</p>
              </div>

              <p className="text-center mb-6 text-gray-700">{role.description}</p>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wide">Key Features:</h3>
                <ul className="space-y-2">
                  {role.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 text-center">
                <button
                  className={`w-full py-3 px-6 border transition-colors ${
                    selectedRole === role.id
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-black text-white border-black hover:bg-white hover:text-black'
                  }`}
                >
                  {selectedRole === role.id ? 'Starting...' : `Start as ${role.title}`}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-gray-600">
            Not sure which role fits you?{' '}
            <Link href="/learn-more" className="text-black hover:underline font-medium">
              Learn more about each role
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
