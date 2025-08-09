'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import VaultSecretsManager from '@/components/VaultSecretsManager';
import { loadUnifiedUserData, generateVaultKey, storeUnifiedUserData, loadUnifiedUserDataWithServerSync } from '@/lib/auth/user-data-sync';

interface UserProfile {
  name: string;
  email: string;
  role: 'project-owner' | 'credit-buyer' | null;
  joinDate: string;
  walletAddress?: string;
  didAddress?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: null,
    joinDate: '2025-01-15',
    walletAddress: '0x742d35Cc6472C14B5B1793c7E5a85B5d4C7B2F2e',
    didAddress: 'did:sui:0x742d35Cc6472C14B5B1793c7E5a85B5d4C7B2F2e'
  });

  const [activeTab, setActiveTab] = useState<'profile' | 'vault'>('profile');
  const [showRecoveryPhrase, setShowRecoveryPhrase] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [userKey, setUserKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const mockRecoveryPhrase = 'secure vault recovery phrase would appear here after authentication';
  const mockDID = 'did:example:123456789abcdefghi';

  useEffect(() => {
    setIsMounted(true);
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // Use unified user data loader with server sync to get DID
      const unifiedUserData = await loadUnifiedUserDataWithServerSync();
      
      if (!unifiedUserData) {
        // No user data found, redirect to login
        console.log('No user data found, redirecting to login');
        router.push('/login');
        return;
      }
      
      // Set user ID and key for vault operations
      const loadedUserId = unifiedUserData.id;
      const loadedUserKey = generateVaultKey(loadedUserId);
      
      // Set profile data
      const loadedProfile: Partial<UserProfile> = {
        name: unifiedUserData.name || '',
        email: unifiedUserData.email || '',
        walletAddress: unifiedUserData.walletAddress || unifiedUserData.userAddress || '',
        didAddress: unifiedUserData.did || '',
        joinDate: unifiedUserData.createdAt ? new Date(unifiedUserData.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      };

      // Get user role from localStorage
      const role = localStorage.getItem('user-role') as 'project-owner' | 'credit-buyer' | null;
      
      // Update state
      setUserId(loadedUserId);
      setUserKey(loadedUserKey);
      setUserProfile(prev => ({
        ...prev,
        ...loadedProfile,
        role
      }));
      
    } catch (error) {
      console.error('Error loading user data:', error);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setUserProfile(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      
      // Get current unified user data
      const currentUserData = loadUnifiedUserData();
      if (!currentUserData) {
        throw new Error('No user data found');
      }
      
      // Update only the editable fields
      const updatedUserData = {
        ...currentUserData,
        name: userProfile.name,
        email: userProfile.email
        // Don't update walletAddress or did - they're read-only
      };
      
      // Store the updated unified data
      storeUnifiedUserData(updatedUserData);
      
      // Also update the legacy zkLogin data if it exists (for backward compatibility)
      const zkLoginDataStr = localStorage.getItem('zklogin-data');
      if (zkLoginDataStr) {
        try {
          const zkLoginData = JSON.parse(zkLoginDataStr);
          const updatedZkLoginData = {
            ...zkLoginData,
            decodedJwt: {
              ...zkLoginData.decodedJwt,
              name: userProfile.name,
              email: userProfile.email
            }
          };
          localStorage.setItem('zklogin-data', JSON.stringify(updatedZkLoginData));
        } catch (error) {
          console.error('Error updating zkLogin data:', error);
        }
      }
      
      setHasUnsavedChanges(false);
      alert('Profile updated successfully!');
      
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVaultRecovery = () => {
    const confirmed = confirm('This will show your vault recovery phrase. Make sure you are in a secure location.');
    if (confirmed) {
      setShowRecoveryPhrase(true);
    }
  };

  const handleExportData = () => {
    alert('Data export feature would download your encrypted vault data for backup purposes.');
  };

  const handleLogout = () => {
    const confirmed = confirm('Are you sure you want to logout? You will need to sign in again to access your account.');
    if (confirmed) {
      // Clear user data from localStorage (but preserve user-role)
      const userRole = localStorage.getItem('user-role'); // Save the role
      localStorage.removeItem('user-token');
      localStorage.removeItem('cart-items');
      localStorage.removeItem('zklogin-user');
      localStorage.removeItem('user-session');
      
      // Clear any session storage
      sessionStorage.clear();
      
      // Restore the user role so they don't have to choose again
      if (userRole) {
        localStorage.setItem('user-role', userRole);
      }
      
      // Redirect to landing page using Next.js router
      router.push('/');
    }
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

        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        ) : (
        <>
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
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full p-2 border border-gray-300"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">Email Address</label>
                      <input
                        type="email"
                        value={userProfile.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full p-2 border border-gray-300"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">User Role</label>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-300">
                        <span>{getRoleIcon()}</span>
                        <span>{isMounted ? getRoleDisplayName() : 'Loading...'}</span>
                        {isMounted && !userProfile.role && (
                          <a href="/role-selection" className="text-blue-600 hover:underline text-sm ml-2">
                            Set Role
                          </a>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600">Member Since</label>
                      <div className="p-2 bg-gray-50 border border-gray-300 text-sm">
                        {userProfile.joinDate ? new Date(userProfile.joinDate).toLocaleDateString() : 'Not available'}
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
                      <button 
                        onClick={handleSaveProfile}
                        disabled={isLoading || !hasUnsavedChanges}
                        className={`text-sm px-4 py-2 border transition-colors ${
                          hasUnsavedChanges && !isLoading
                            ? 'bg-black text-white border-black hover:bg-white hover:text-black'
                            : 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed'
                        }`}
                      >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button 
                        onClick={() => {
                          if (hasUnsavedChanges) {
                            if (confirm('You have unsaved changes. Are you sure you want to discard them?')) {
                              loadUserData();
                            }
                          }
                        }}
                        disabled={isLoading || !hasUnsavedChanges}
                        className={`text-sm px-4 py-2 border transition-colors ${
                          hasUnsavedChanges && !isLoading
                            ? 'bg-white text-black border-black hover:bg-black hover:text-white'
                            : 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed'
                        }`}
                      >
                        Discard Changes
                      </button>
                      <button 
                        onClick={handleLogout}
                        disabled={isLoading}
                        className="text-sm bg-red-600 text-white px-4 py-2 border border-red-600 hover:bg-white hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Role-Specific Information */}
            {isMounted && userProfile.role && (
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

            {/* Vault Security Section */}
            <div className="border border-black p-6">
              <h3 className="text-xl font-bold mb-4">Vault Security & Recovery</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Digital Identity (DID)</h4>
                  <div className="p-3 font-mono text-sm border border-black bg-gray-50 mb-2">
                    {userProfile.didAddress || 'Not available'}
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    Your unique decentralized identifier
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Recovery Options</h4>
                  <p className="text-sm mb-4 text-gray-600">
                    Your vault is encrypted and stored on Walrus & Seal network. Use these options to backup or recover your data.
                  </p>
                  
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={handleVaultRecovery}
                      className="bg-black text-white px-4 py-2 border border-black hover:bg-white hover:text-black transition-colors"
                    >
                      Show Recovery Phrase
                    </button>
                    
                    <button
                      onClick={handleExportData}
                      className="bg-white text-black px-4 py-2 border border-black hover:bg-black hover:text-white transition-colors"
                    >
                      Export Vault Data
                    </button>
                  </div>

                  {showRecoveryPhrase && (
                    <div className="border border-yellow-600 bg-yellow-50 p-4">
                      <h4 className="font-bold mb-2">⚠️ Recovery Phrase</h4>
                      <div className="p-3 font-mono text-sm border border-gray-300 bg-white">
                        {mockRecoveryPhrase}
                      </div>
                      <p className="text-xs mt-2 text-yellow-700">
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

                <div>
                  <h4 className="font-medium mb-2">Account Security</h4>
                  <p className="text-sm mb-4 text-gray-600">
                    Secure your account and manage your session.
                  </p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleLogout}
                      className="bg-red-600 text-white px-4 py-2 border border-red-600 hover:bg-white hover:text-red-600 transition-colors"
                    >
                      Logout from All Devices
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Real Vault Secrets Manager */}
            {userId && userKey ? (
              <VaultSecretsManager userId={userId} userKey={userKey} />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading vault...</p>
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
        </>
        )}
      </main>
    </Navigation>
  );
}
