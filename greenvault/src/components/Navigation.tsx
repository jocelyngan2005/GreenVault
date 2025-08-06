'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface NavigationProps {
  children: React.ReactNode;
  theme?: 'light' | 'dark';
}

export default function Navigation({ children, theme = 'light' }: NavigationProps) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<'project-owner' | 'credit-buyer' | null>(null);

  useEffect(() => {
    // Get user role from localStorage or other state management
    const role = localStorage.getItem('user-role') as 'project-owner' | 'credit-buyer' | null;
    setUserRole(role);
  }, []);

  const getUserRoleDisplay = () => {
    switch (userRole) {
      case 'project-owner':
        return 'Project Owner';
      case 'credit-buyer':
        return 'Credit Buyer';
      default:
        return 'User';
    }
  };

  const getNavItems = () => {
    const baseItems = [
      { href: '/marketplace', label: 'Marketplace' },
      { href: '/assets', label: 'My Assets' },
      { href: '/assistant', label: 'AI Assistant' },
    ];

    if (userRole === 'project-owner') {
      return [
        { href: '/project-owner', label: 'Dashboard' },
        { href: '/project-owner/new-project', label: 'New Project' },
        { href: '/project-owner/marketplace', label: 'Marketplace' },
        ...baseItems.slice(1) // Skip general marketplace, use project-owner specific
      ];
    } else if (userRole === 'credit-buyer') {
      return [
        { href: '/credit-buyer', label: 'Dashboard' },
        { href: '/credit-buyer/marketplace', label: 'Marketplace' },
        { href: '/credit-buyer/assistant', label: 'AI Assistant' },
        { href: '/assets', label: 'My Assets' }
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();
  const isActive = (href: string) => pathname === href;

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'}`}>
      {/* Header */}
      <header className={`border-b ${theme === 'dark' ? 'border-white' : 'border-black'}`}>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-2xl font-bold hover:underline">
                GreenVault
              </Link>
              <nav className="flex gap-4">
                {navItems.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`text-sm ${
                      isActive(href) ? 'font-medium underline' : 'hover:underline'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-600">{getUserRoleDisplay()}</span>
              <Link href="/settings" className={`text-sm ${isActive('/settings') ? 'font-medium underline' : 'hover:underline'}`}>
                Settings
              </Link>
              <Link 
                href="/profile" 
                className={`flex items-center justify-center w-8 h-8 rounded-full border ${
                  theme === 'dark' ? 'border-white' : 'border-black'
                } ${isActive('/profile') ? 'bg-black text-white' : 'hover:bg-black hover:text-white'} transition-colors`}
                title="Profile & Vault"
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
