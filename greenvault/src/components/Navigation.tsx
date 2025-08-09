'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cartUtils } from '@/lib/cartUtils';
import AIAssistant from './AIAssistant';

interface NavigationProps {
  children: React.ReactNode;
  theme?: 'light' | 'dark';
}

export default function Navigation({ children, theme = 'light' }: NavigationProps) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<'project-owner' | 'credit-buyer' | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    // Get user role from localStorage or other state management
    const role = localStorage.getItem('user-role') as 'project-owner' | 'credit-buyer' | null;
    setUserRole(role);
    
    // Initialize cart count
    if (role === 'credit-buyer') {
      setCartCount(cartUtils.getCartSummary().itemCount);
    }
  }, []);

  useEffect(() => {
    // Listen for cart updates to update the count
    const handleCartUpdate = (event: CustomEvent) => {
      if (userRole === 'credit-buyer') {
        setCartCount(event.detail.length);
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate as EventListener);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate as EventListener);
    };
  }, [userRole]);

  useEffect(() => {
    // Handle escape key to close AI assistant
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAIAssistant) {
        setShowAIAssistant(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showAIAssistant]);

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
    ];

    if (userRole === 'project-owner') {
      return [
        { href: '/project-owner', label: 'Dashboard' },
        { href: '/project-owner/marketplace', label: 'Marketplace' },
        { href: '/project-owner/assets', label: 'My Assets' },
      ];
    } else if (userRole === 'credit-buyer') {
      return [
        { href: '/credit-buyer', label: 'Dashboard' },
        { href: '/credit-buyer/marketplace', label: 'Marketplace' },
        { href: '/credit-buyer/cart', label: 'Cart', badge: cartCount > 0 ? cartCount : undefined },
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
              <h1 className="text-2xl font-bold">
                GreenVault
              </h1>
              <nav className="flex gap-4">
                {isMounted && navItems.map(({ href, label, badge }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`text-sm relative inline-flex items-center ${
                      isActive(href) ? 'font-medium underline' : 'hover:underline'
                    }`}
                  >
                    {label}
                    {badge && (
                      <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-600">{isMounted ? getUserRoleDisplay() : 'User'}</span>
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

      {/* Floating AI Assistant Button for Credit Buyers */}
      {isMounted && userRole === 'credit-buyer' && (
        <>
          <button
            onClick={() => setShowAIAssistant(true)}
            className={`fixed bottom-6 right-6 w-14 h-14 rounded-full ${
              theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'
            } shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center z-40`}
            title="AI Assistant"
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              <path d="M13 8H7"></path>
              <path d="M17 12H7"></path>
            </svg>
          </button>

          {/* AI Assistant Overlay */}
          <AIAssistant 
            isOpen={showAIAssistant}
            onClose={() => setShowAIAssistant(false)}
            userId={userRole ? `user_${userRole}_${Date.now()}` : 'anonymous'}
          />
        </>
      )}
    </div>
  );
}
