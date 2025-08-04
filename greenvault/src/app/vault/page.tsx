'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Secret {
  id: string;
  title: string;
  username: string;
  category: string;
  lastModified: string;
  isDecrypted: boolean;
}

export default function VaultPage() {
  const [secrets, setSecrets] = useState<Secret[]>([
    {
      id: '1',
      title: 'GitHub',
      username: 'user@example.com',
      category: 'Development',
      lastModified: '2025-01-15',
      isDecrypted: false
    },
    {
      id: '2',
      title: 'Email Account',
      username: 'personal@email.com',
      category: 'Personal',
      lastModified: '2025-01-10',
      isDecrypted: false
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [decryptPassword, setDecryptPassword] = useState('');
  const [decryptingId, setDecryptingId] = useState<string | null>(null);

  const categories = ['All', 'Personal', 'Development', 'Financial', 'Social'];

  const filteredSecrets = selectedCategory === 'All' 
    ? secrets 
    : secrets.filter(s => s.category === selectedCategory);

  const handleDecrypt = async (id: string) => {
    if (!decryptPassword) return;
    
    setDecryptingId(id);
    // Simulate decryption
    setTimeout(() => {
      setSecrets(secrets.map(s => 
        s.id === id ? { ...s, isDecrypted: true } : s
      ));
      setDecryptingId(null);
      setDecryptPassword('');
    }, 1000);
  };

  const handleAddSecret = () => {
    const newSecret: Secret = {
      id: Date.now().toString(),
      title: 'New Entry',
      username: '',
      category: 'Personal',
      lastModified: new Date().toISOString().split('T')[0],
      isDecrypted: false
    };
    setSecrets([...secrets, newSecret]);
    setShowAddForm(false);
  };

  const handleDeleteSecret = (id: string) => {
    setSecrets(secrets.filter(s => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b border-black">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-2xl font-bold hover:underline">
                GreenVault
              </Link>
              <nav className="flex gap-4">
                <Link href="/vault" className="text-sm font-medium underline">Vault</Link>
                <Link href="/marketplace" className="text-sm hover:underline">Marketplace</Link>
                <Link href="/assets" className="text-sm hover:underline">My Assets</Link>
                <Link href="/assistant" className="text-sm hover:underline">AI Assistant</Link>
              </nav>
            </div>
            <Link href="/settings" className="text-sm hover:underline">Settings</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Secure Vault</h1>
            <p className="text-gray-600">Encrypted storage via Walrus & Seal + Oasis Confidential EVM</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-black text-white px-6 py-2 border border-black hover:bg-white hover:text-black transition-colors"
          >
            Add Secret
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 border border-black whitespace-nowrap ${
                selectedCategory === category 
                  ? 'bg-black text-white' 
                  : 'bg-white text-black hover:bg-black hover:text-white'
              } transition-colors`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Add Secret Form */}
        {showAddForm && (
          <div className="border border-black p-6 mb-6 bg-gray-50">
            <h3 className="text-lg font-bold mb-4">Add New Secret</h3>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <input
                type="text"
                placeholder="Title"
                className="border border-black px-3 py-2 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black"
              />
              <input
                type="text"
                placeholder="Username/Email"
                className="border border-black px-3 py-2 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black"
              />
              <select className="border border-black px-3 py-2 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black">
                {categories.slice(1).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <input
              type="password"
              placeholder="Password"
              className="w-full border border-black px-3 py-2 mb-4 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddSecret}
                className="bg-black text-white px-4 py-2 border border-black hover:bg-white hover:text-black transition-colors"
              >
                Save Secret
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-white text-black px-4 py-2 border border-black hover:bg-black hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Secrets List */}
        <div className="space-y-4">
          {filteredSecrets.map(secret => (
            <div key={secret.id} className="border border-black p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold">{secret.title}</h3>
                  <p className="text-gray-600">Username: {secret.username}</p>
                  <p className="text-sm text-gray-500">
                    Category: {secret.category} | Last modified: {secret.lastModified}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeleteSecret(secret.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {!secret.isDecrypted ? (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-600 mb-2">Enter master password to decrypt:</p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={decryptPassword}
                      onChange={(e) => setDecryptPassword(e.target.value)}
                      placeholder="Master password"
                      className="flex-1 border border-black px-3 py-2 bg-white text-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                    <button
                      onClick={() => handleDecrypt(secret.id)}
                      disabled={!decryptPassword || decryptingId === secret.id}
                      className="bg-black text-white px-4 py-2 border border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50"
                    >
                      {decryptingId === secret.id ? 'Decrypting...' : 'Decrypt'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-4 bg-green-50 p-4">
                  <p className="text-sm text-green-800 mb-2">✓ Decrypted successfully</p>
                  <p className="font-mono text-sm">Password: ••••••••••••</p>
                  <button
                    onClick={() => setSecrets(secrets.map(s => 
                      s.id === secret.id ? { ...s, isDecrypted: false } : s
                    ))}
                    className="text-sm text-gray-600 hover:underline mt-2"
                  >
                    Lock again
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredSecrets.length === 0 && (
          <div className="text-center py-12 border border-black">
            <p className="text-gray-600 mb-4">No secrets found in this category</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-black text-white px-6 py-2 border border-black hover:bg-white hover:text-black transition-colors"
            >
              Add Your First Secret
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
