'use client';

import { useState } from 'react';
import { useVaultSecrets } from '@/lib/vault/use-vault-secrets';
import type { AddSecretRequest } from '@/lib/vault/vault-secrets-client';

interface VaultSecretsManagerProps {
  userId: string;
  userKey: string;
}

export default function VaultSecretsManager({ userId, userKey }: VaultSecretsManagerProps) {
  const {
    secrets,
    loading,
    error,
    categories,
    addSecret,
    deleteSecret,
    updateSecret,
    searchSecrets,
    filterByCategory,
    generatePassword,
    validateSecret,
    clearError
  } = useVaultSecrets({ userId, userKey });

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newSecret, setNewSecret] = useState<AddSecretRequest>({
    title: '',
    username: '',
    password: '',
    category: 'General',
    notes: '',
    url: ''
  });

  // Filter secrets based on category and search
  const searchedSecrets = searchSecrets(searchText) || [];
  const displaySecrets = selectedCategory === 'All' 
    ? searchedSecrets 
    : (searchedSecrets || []).filter(s => s.category === selectedCategory);

  const handleAddSecret = async () => {
    const validation = validateSecret(newSecret);
    if (!validation.isValid) {
      alert(`Validation errors: ${validation.errors.join(', ')}`);
      return;
    }

    const result = await addSecret(newSecret);
    if (result.success) {
      setShowAddForm(false);
      setShowPassword(false);
      setNewSecret({
        title: '',
        username: '',
        password: '',
        category: 'General',
        notes: '',
        url: ''
      });
    } else {
      alert(`Failed to add secret: ${result.error}`);
    }
  };

  const handleGeneratePassword = () => {
    setNewSecret(prev => ({
      ...prev,
      password: generatePassword(16)
    }));
  };

  const handleDeleteSecret = async (secretId: string) => {
    if (confirm('Are you sure you want to delete this secret?')) {
      const result = await deleteSecret(secretId);
      if (!result.success) {
        alert(`Failed to delete secret: ${result.error}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
        <p className="mt-2">Loading secrets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-600 bg-red-50 p-4 mb-4">
        <p className="text-red-700">Error: {error}</p>
        <button
          onClick={clearError}
          className="mt-2 text-sm text-red-600 hover:underline"
        >
          Clear Error
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold mb-2">Secure Password Vault</h2>
          <p className="text-gray-600">
            Your passwords are encrypted and stored securely on Walrus & Seal network.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-black text-white px-4 py-2 border border-black hover:bg-white hover:text-black transition-colors"
        >
          + Add New
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Search secrets..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="flex-1 min-w-64 p-2 border border-gray-300"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="p-2 border border-gray-300"
        >
          <option value="All">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* Add New Secret Form */}
      {showAddForm && (
        <div className="border border-black p-6 bg-gray-50">
          <h3 className="font-semibold mb-4">Add New Secret</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Title (e.g., Gmail Account)"
              value={newSecret.title}
              onChange={(e) => setNewSecret(prev => ({ ...prev, title: e.target.value }))}
              className="p-2 border border-gray-300"
            />
            <input
              type="text"
              placeholder="Username/Email"
              value={newSecret.username}
              onChange={(e) => setNewSecret(prev => ({ ...prev, username: e.target.value }))}
              className="p-2 border border-gray-300"
            />
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={newSecret.password}
                  onChange={(e) => setNewSecret(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full p-2 pr-10 border border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <button
                onClick={handleGeneratePassword}
                className="px-3 py-2 border border-gray-300 hover:bg-gray-100"
                type="button"
              >
                Generate
              </button>
            </div>
            <select
              value={newSecret.category}
              onChange={(e) => setNewSecret(prev => ({ ...prev, category: e.target.value }))}
              className="p-2 border border-gray-300"
            >
              <option value="General">General</option>
              <option value="Personal">Personal</option>
              <option value="Development">Development</option>
              <option value="Financial">Financial</option>
              <option value="Social">Social</option>
            </select>
            <input
              type="url"
              placeholder="URL (optional)"
              value={newSecret.url || ''}
              onChange={(e) => setNewSecret(prev => ({ ...prev, url: e.target.value }))}
              className="p-2 border border-gray-300"
            />
            <textarea
              placeholder="Notes (optional)"
              value={newSecret.notes || ''}
              onChange={(e) => setNewSecret(prev => ({ ...prev, notes: e.target.value }))}
              className="p-2 border border-gray-300"
              rows={3}
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAddSecret}
              className="bg-black text-white px-4 py-2 border border-black hover:bg-white hover:text-black transition-colors"
            >
              Save Secret
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setShowPassword(false);
              }}
              className="bg-white text-black px-4 py-2 border border-black hover:bg-black hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Secrets List */}
      <div className="border border-black">
        <div className="bg-gray-50 px-6 py-4 border-b border-black">
          <h3 className="text-lg font-bold">
            Stored Secrets ({displaySecrets.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {displaySecrets.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {searchText ? 'No secrets found matching your search.' : 'No secrets stored yet.'}
            </div>
          ) : (
            displaySecrets.map((secret) => (
              <div key={secret.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{secret.title}</h4>
                    <p className="text-sm text-gray-600 mb-1">Username: {secret.username}</p>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>Category: {secret.category}</span>
                      <span>Modified: {new Date(secret.lastModified).toLocaleDateString()}</span>
                    </div>
                    {secret.notes && (
                      <p className="text-sm text-gray-600 mt-2">{secret.notes}</p>
                    )}
                    {secret.url && (
                      <a
                        href={secret.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline mt-1 block"
                      >
                        {secret.url}
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteSecret(secret.id)}
                      className="text-sm px-3 py-1 border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
