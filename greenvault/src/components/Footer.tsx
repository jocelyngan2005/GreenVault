import Link from 'next/link';

interface FooterProps {
  theme?: 'light' | 'dark';
}

export default function Footer({ theme = 'light' }: FooterProps) {
  return (
    <footer className={`border-t ${theme === 'dark' ? 'border-white' : 'border-black'} mt-16`}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm">
            &copy; 2025 GreenVault. Built with privacy and sustainability in mind.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="/vault" className="text-sm hover:underline">Vault</Link>
            <Link href="/marketplace" className="text-sm hover:underline">Marketplace</Link>
          </div>
        </div>
        <div className={`mt-4 pt-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Secured by Walrus & Seal storage • Powered by Oasis Confidential EVM • zkLogin authentication
          </p>
        </div>
      </div>
    </footer>
  );
}
