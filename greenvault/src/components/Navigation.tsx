'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cartUtils } from '@/lib/cartUtils';

interface NavigationProps {
  children: React.ReactNode;
  theme?: 'light' | 'dark';
}

export default function Navigation({ children, theme = 'light' }: NavigationProps) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<'project-owner' | 'credit-buyer' | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState('');
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

  const handleSendMessage = () => {
    if (assistantMessage.trim()) {
      // Here you would typically send the message to your AI service
      console.log('Sending message:', assistantMessage);
      setAssistantMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
        ...baseItems.slice(1) // Skip general marketplace, use project-owner specific
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
          {showAIAssistant && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className={`${
                theme === 'dark' ? 'bg-black text-white border-white' : 'bg-white text-black border-black'
              } border-2 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col`}>
                {/* Header */}
                <div className={`flex justify-between items-center p-4 border-b ${
                  theme === 'dark' ? 'border-white' : 'border-black'
                }`}>
                  <h2 className="text-xl font-bold">AI Assistant</h2>
                  <button
                    onClick={() => setShowAIAssistant(false)}
                    className={`w-8 h-8 rounded-full border ${
                      theme === 'dark' ? 'border-white hover:bg-white hover:text-black' : 'border-black hover:bg-black hover:text-white'
                    } flex items-center justify-center transition-colors`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
                    }`}>
                      <h3 className="font-semibold mb-2">👋 How can I help you today?</h3>
                      <p className="text-sm opacity-80">
                        I can assist you with carbon credit analysis, market insights, sustainability recommendations, and portfolio optimization.
                      </p>
                    </div>

                    {/* Sample conversation */}
                    <div className="space-y-3">
                      <div className={`p-3 rounded-lg ${
                        theme === 'dark' ? 'bg-blue-900' : 'bg-blue-50'
                      } ml-8`}>
                        <p className="text-sm">What are the best carbon credits for my portfolio?</p>
                      </div>
                      
                      <div className={`p-3 rounded-lg ${
                        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                      } mr-8`}>
                        <p className="text-sm">
                          Based on your preferences and market trends, I recommend focusing on:
                          <br />• Nature-based solutions (25-30%)
                          <br />• Direct air capture (20-25%) 
                          <br />• Renewable energy credits (45-50%)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input area */}
                <div className={`p-4 border-t ${
                  theme === 'dark' ? 'border-white' : 'border-black'
                }`}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={assistantMessage}
                      onChange={(e) => setAssistantMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything about carbon credits..."
                      className={`flex-1 px-3 py-2 border ${
                        theme === 'dark' 
                          ? 'border-white bg-black text-white placeholder-gray-400' 
                          : 'border-black bg-white text-black placeholder-gray-500'
                      } focus:outline-none focus:ring-1 ${
                        theme === 'dark' ? 'focus:ring-white' : 'focus:ring-black'
                      }`}
                      autoFocus
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={!assistantMessage.trim()}
                      className={`px-4 py-2 ${
                        theme === 'dark' 
                          ? 'bg-white text-black hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-400' 
                          : 'bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500'
                      } transition-colors disabled:cursor-not-allowed`}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
