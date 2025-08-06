'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';

interface Secret {
  id: string;
  title: string;
  username: string;
  category: string;
  lastModified: string;
  isDecrypted: boolean;
}

interface UserProfile {
  name: string;
  email: string;
  role: 'project-owner' | 'credit-buyer' | null;
  joinDate: string;
  walletAddress?: string;
  didAddress?: string;
}

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: null,
    joinDate: '2025-01-15',
    walletAddress: '0x742d35Cc6472C14B5B1793c7E5a85B5d4C7B2F2e',
    didAddress: 'did:sui:0x742d35Cc6472C14B5B1793c7E5a85B5d4C7B2F2e'
  });

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
    },
    {
      id: '3',
      title: 'Banking Portal',
      username: 'john.doe',
      category: 'Financial',
      lastModified: '2025-01-08',
      isDecrypted: false
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [decryptPassword, setDecryptPassword] = useState('');
  const [decryptingId, setDecryptingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'vault'>('profile');

  const categories = ['All', 'Personal', 'Development', 'Financial', 'Social'];

  useEffect(() => {
    // Get user role from localStorage
    const role = localStorage.getItem('user-role') as 'project-owner' | 'credit-buyer' | null;
    setUserProfile(prev => ({ ...prev, role }));

    // In a real app, you'd fetch user data from an API
    // For now, we'll simulate with localStorage data
    const zkLoginData = localStorage.getItem('zklogin-data');
    if (zkLoginData) {
      try {
        const data = JSON.parse(zkLoginData);
        setUserProfile(prev => ({
          ...prev,
          walletAddress: data.userAddress || prev.walletAddress
        }));
      } catch (error) {
        console.error('Error parsing zkLogin data:', error);
      }
    }
  }, []);

  const filteredSecrets = selectedCategory === 'All' 
    ? secrets 
    : secrets.filter(s => s.category === selectedCategory);

  const handleDecrypt = async (id: string) => {
    if (!decryptPassword) return;
    
    setDecryptingId(id);
    // Simulate decryption
    setTimeout(() => {
      setSecrets(prev => prev.map(s => 
        s.id === id ? { ...s, isDecrypted: true } : s
      ));
      setDecryptingId(null);
      setDecryptPassword('');
    }, 1500);
  };

  const handleAddSecret = () => {
    const newSecret: Secret = {
      id: Date.now().toString(),
      title: 'New Secret',
      username: 'username',
      category: 'Personal',
      lastModified: new Date().toISOString().split('T')[0],
      isDecrypted: false
    };
    setSecrets(prev => [...prev, newSecret]);
    setShowAddForm(false);
  };

  const getRoleDisplayName = () => {
    switch (userProfile.role) {
      case 'project-owner': return 'Project Owner';
      case 'credit-buyer': return 'Credit Buyer';
      default: return 'Not Set';
    }
  };

  const getRoleIcon = () => {
    switch (userProfile.role) {
      case 'project-owner': return '🌱';
      case 'credit-buyer': return '🏢';
      default: return '👤';
    }
  };

  return (
    <Navigation>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profile</h1>
          <p className="text-gray-600">Manage your account information and secure vault.</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-black mb-8">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-2 text-sm ${
                activeTab === 'profile' 
                  ? 'border-b-2 border-black font-medium' 
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`pb-2 text-sm ${
                activeTab === 'vault' 
                  ? 'border-b-2 border-black font-medium' 
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Secure Vault
            </button>
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-8">
            {/* User Information Card */}
            <div className="border border-black p-6">
              <div className="flex items-center mb-6">
                <div className="text-4xl mr-4">{getRoleIcon()}</div>
                <div>
                  <h2 className="text-xl font-bold">{userProfile.name}</h2>
                  <p className="text-gray-600">{userProfile.email}</p>
                  <p className="text-sm text-gray-500">Member since {new Date(userProfile.joinDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Account Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600">Full Name</label>
                      <input
                        type="text"
                        value={userProfile.name}
                        onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full p-2 border border-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">Email Address</label>
                      <input
                        type="email"
                        value={userProfile.email}
                        onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full p-2 border border-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">User Role</label>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-300">
                        <span>{getRoleIcon()}</span>
                        <span>{getRoleDisplayName()}</span>
                        {!userProfile.role && (
                          <a href="/role-selection" className="text-blue-600 hover:underline text-sm ml-2">
                            Set Role
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Blockchain Identity</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600">Wallet Address</label>
                      <div className="p-2 bg-gray-50 border border-gray-300 text-sm font-mono break-all">
                        {userProfile.walletAddress || 'Not connected'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">DID (Decentralized Identity)</label>
                      <div className="p-2 bg-gray-50 border border-gray-300 text-sm font-mono break-all">
                        {userProfile.didAddress || 'Not created'}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button className="text-sm bg-black text-white px-4 py-2 border border-black hover:bg-white hover:text-black transition-colors">
                        Update Profile
                      </button>
                      <button className="text-sm bg-white text-black px-4 py-2 border border-black hover:bg-black hover:text-white transition-colors">
                        Export Data
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Role-Specific Information */}
            {userProfile.role && (
              <div className="border border-black p-6">
                <h3 className="font-semibold mb-4">
                  {userProfile.role === 'project-owner' ? 'Project Owner Dashboard' : 'Credit Buyer Dashboard'}
                </h3>
                {userProfile.role === 'project-owner' ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 border border-gray-300">
                      <p className="text-2xl font-bold">3</p>
                      <p className="text-sm text-gray-600">Active Projects</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 border border-gray-300">
                      <p className="text-2xl font-bold">2,400</p>
                      <p className="text-sm text-gray-600">Tons CO₂ Impact</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 border border-gray-300">
                      <p className="text-2xl font-bold">$1,250</p>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 border border-gray-300">
                      <p className="text-2xl font-bold">15.5</p>
                      <p className="text-sm text-gray-600">Tons CO₂ Offset</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 border border-gray-300">
                      <p className="text-2xl font-bold">8</p>
                      <p className="text-sm text-gray-600">Projects Supported</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 border border-gray-300">
                      <p className="text-2xl font-bold">$350</p>
                      <p className="text-sm text-gray-600">Total Investment</p>
                    </div>
                  </div>
                )}
                <div className="mt-4">
                  <a 
                    href={userProfile.role === 'project-owner' ? '/project-owner' : '/credit-buyer'}
                    className="text-sm bg-black text-white px-4 py-2 border border-black hover:bg-white hover:text-black transition-colors inline-block"
                  >
                    Go to Dashboard →
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vault Tab */}
        {activeTab === 'vault' && (
          <div className="space-y-8">
            {/* Vault Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold mb-2">Secure Password Vault</h2>
                <p className="text-gray-600">Your passwords are encrypted and stored securely on Walrus & Seal network.</p>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-black text-white px-4 py-2 border border-black hover:bg-white hover:text-black transition-colors"
              >
                + Add New
              </button>
            </div>

            {/* Categories Filter */}
            <div className="flex gap-2 flex-wrap">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 text-sm border ${
                    selectedCategory === category
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300 hover:border-black'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Secrets List */}
            <div className="border border-black">
              <div className="bg-gray-50 px-6 py-4 border-b border-black">
                <h3 className="text-lg font-bold">
                  Stored Secrets ({filteredSecrets.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {filteredSecrets.map((secret) => (
                  <div key={secret.id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{secret.title}</h4>
                        <p className="text-sm text-gray-600 mb-1">Username: {secret.username}</p>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>Category: {secret.category}</span>
                          <span>Modified: {secret.lastModified}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {secret.isDecrypted ? (
                          <div className="text-green-600 text-sm">✓ Decrypted</div>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              type="password"
                              placeholder="Master password"
                              value={decryptPassword}
                              onChange={(e) => setDecryptPassword(e.target.value)}
                              className="text-sm p-1 border border-gray-300 w-32"
                            />
                            <button
                              onClick={() => handleDecrypt(secret.id)}
                              disabled={decryptingId === secret.id}
                              className={`text-sm px-3 py-1 border border-black ${
                                decryptingId === secret.id
                                  ? 'bg-gray-100 text-gray-400'
                                  : 'hover:bg-black hover:text-white'
                              } transition-colors`}
                            >
                              {decryptingId === secret.id ? 'Decrypting...' : 'Decrypt'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Secret Form */}
            {showAddForm && (
              <div className="border border-black p-6 bg-gray-50">
                <h3 className="font-semibold mb-4">Add New Secret</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Title (e.g., Gmail Account)"
                    className="p-2 border border-gray-300"
                  />
                  <input
                    type="text"
                    placeholder="Username/Email"
                    className="p-2 border border-gray-300"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    className="p-2 border border-gray-300"
                  />
                  <select className="p-2 border border-gray-300">
                    {categories.slice(1).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 mt-4">
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

            {/* Security Information */}
            <div className="border border-blue-200 bg-blue-50 p-6">
              <h3 className="font-semibold mb-2">🔐 Security Information</h3>
              <ul className="text-sm space-y-1">
                <li>• All passwords are encrypted before being stored</li>
                <li>• Data is distributed across Walrus & Seal decentralized storage</li>
                <li>• Your master password is never stored - only you can decrypt your data</li>
                <li>• Zero-knowledge architecture ensures maximum privacy</li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </Navigation>
  );
}
