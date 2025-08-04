'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavigationProps {
  children: React.ReactNode;
  theme?: 'light' | 'dark';
}

export default function Navigation({ children, theme = 'light' }: NavigationProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/vault', label: 'Vault' },
    { href: '/marketplace', label: 'Marketplace' },
    { href: '/assets', label: 'My Assets' },
    { href: '/assistant', label: 'AI Assistant' },
  ];

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
            <Link href="/settings" className={`text-sm ${isActive('/settings') ? 'font-medium underline' : 'hover:underline'}`}>
              Settings
            </Link>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
