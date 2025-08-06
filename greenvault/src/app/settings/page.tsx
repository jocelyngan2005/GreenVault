'use client';

import { useState } from 'react';
import Navigation from '../../components/Navigation';

export default function SettingsPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState('en');
  const [showRecoveryPhrase, setShowRecoveryPhrase] = useState(false);

  const mockRecoveryPhrase = 'secure vault recovery phrase would appear here after authentication';
  const mockDID = 'did:example:123456789abcdefghi';

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Apply theme to document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleResetDID = () => {
    const confirmed = confirm('Are you sure you want to reset your DID? This will log you out and require re-authentication.');
    if (confirmed) {
      alert('DID reset initiated. You will be redirected to login.');
      // In a real app, this would trigger the DID reset process
    }
  };

  const handleVaultRecovery = () => {
    const confirmed = confirm('This will show your vault recovery phrase. Make sure you are in a secure location.');
    if (confirmed) {
      setShowRecoveryPhrase(true);
    }
  };

  const handleLogout = () => {
    const confirmed = confirm('Are you sure you want to logout?');
    if (confirmed) {
      // In a real app, this would clear auth state
      window.location.href = '/';
    }
  };

  const handleExportData = () => {
    alert('Data export feature would download your encrypted vault data for backup purposes.');
  };

  return (
    <Navigation>
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'}`}>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Manage your account, security, and preferences
          </p>
        </div>

        <div className="space-y-8">
          {/* Identity Section */}
          <section className={`border ${theme === 'dark' ? 'border-white' : 'border-black'} p-6`}>
            <h2 className="text-xl font-bold mb-4">Digital Identity (DID)</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Your DID</label>
                <div className={`p-3 font-mono text-sm border ${theme === 'dark' ? 'border-white bg-gray-900' : 'border-black bg-gray-50'}`}>
                  {mockDID}
                </div>
                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Your unique decentralized identifier
                </p>
              </div>
              
              <button
                onClick={handleResetDID}
                className={`${theme === 'dark' ? 'bg-white text-black border-white hover:bg-black hover:text-white' : 'bg-black text-white border-black hover:bg-white hover:text-black'} px-4 py-2 border transition-colors`}
              >
                Reset DID
              </button>
            </div>
          </section>

          {/* Vault Security */}
          <section className={`border ${theme === 'dark' ? 'border-white' : 'border-black'} p-6`}>
            <h2 className="text-xl font-bold mb-4">Vault Security</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Recovery Options</h3>
                <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Your vault is encrypted and stored on Walrus & Seal network. Use these options to backup or recover your data.
                </p>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleVaultRecovery}
                    className={`${theme === 'dark' ? 'bg-white text-black border-white hover:bg-black hover:text-white' : 'bg-black text-white border-black hover:bg-white hover:text-black'} px-4 py-2 border transition-colors`}
                  >
                    Show Recovery Phrase
                  </button>
                  
                  <button
                    onClick={handleExportData}
                    className={`${theme === 'dark' ? 'bg-black text-white border-white hover:bg-white hover:text-black' : 'bg-white text-black border-black hover:bg-black hover:text-white'} px-4 py-2 border transition-colors`}
                  >
                    Export Vault Data
                  </button>
                </div>
              </div>

              {showRecoveryPhrase && (
                <div className={`border ${theme === 'dark' ? 'border-yellow-400 bg-yellow-900' : 'border-yellow-600 bg-yellow-50'} p-4`}>
                  <h4 className="font-bold mb-2">⚠️ Recovery Phrase</h4>
                  <div className={`p-3 font-mono text-sm border ${theme === 'dark' ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'}`}>
                    {mockRecoveryPhrase}
                  </div>
                  <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'}`}>
                    Store this phrase securely. Anyone with access to it can recover your vault.
                  </p>
                  <button
                    onClick={() => setShowRecoveryPhrase(false)}
                    className="mt-2 text-sm hover:underline"
                  >
                    Hide Recovery Phrase
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Preferences */}
          <section className={`border ${theme === 'dark' ? 'border-white' : 'border-black'} p-6`}>
            <h2 className="text-xl font-bold mb-4">Preferences</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Theme</label>
                <button
                  onClick={handleThemeToggle}
                  className={`${theme === 'dark' ? 'bg-white text-black border-white hover:bg-black hover:text-white' : 'bg-black text-white border-black hover:bg-white hover:text-black'} px-4 py-2 border transition-colors`}
                >
                  {theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className={`border ${theme === 'dark' ? 'border-white bg-black text-white' : 'border-black bg-white text-black'} px-3 py-2 focus:outline-none focus:ring-1 ${theme === 'dark' ? 'focus:ring-white' : 'focus:ring-black'}`}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
            </div>
          </section>

          {/* Carbon Preferences */}
          <section className={`border ${theme === 'dark' ? 'border-white' : 'border-black'} p-6`}>
            <h2 className="text-xl font-bold mb-4">Carbon Offset Preferences</h2>
            <div className="space-y-4">
              <div>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span className="text-sm">Auto-suggest carbon credits based on my activity</span>
                </label>
              </div>
              <div>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm">Monthly carbon offset reminders</span>
                </label>
              </div>
              <div>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span className="text-sm">Show impact comparisons and statistics</span>
                </label>
              </div>
            </div>
          </section>

          {/* Account Actions */}
          <section className={`border ${theme === 'dark' ? 'border-white' : 'border-black'} p-6`}>
            <h2 className="text-xl font-bold mb-4">Account</h2>
            <div className="space-y-4">
              <button
                onClick={handleLogout}
                className={`${theme === 'dark' ? 'bg-red-600 text-white border-red-600 hover:bg-black hover:text-red-600' : 'bg-red-600 text-white border-red-600 hover:bg-white hover:text-red-600'} px-4 py-2 border transition-colors`}
              >
                Logout
              </button>
              
              <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                <p>Account created with zkLogin authentication</p>
                <p>Data stored on Walrus & Seal + Oasis Confidential EVM</p>
              </div>
            </div>
          </section>
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <a href="/profile" className="text-sm hover:underline">
            ← Back to Profile
          </a>
        </div>
      </main>
      </div>
    </Navigation>
  );
}
