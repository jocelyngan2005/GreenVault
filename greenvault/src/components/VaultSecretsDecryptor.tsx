'use client';

import React, { useState } from 'react';
import { decryptSecret, decryptAllSecrets, copyPasswordToClipboard, DecryptedSecret } from '@/lib/vault/decrypt-utils';

interface VaultSecretsDecryptorProps {
  userId: string;
  userKey: string;
  className?: string;
}

export default function VaultSecretsDecryptor({ userId, userKey, className = '' }: VaultSecretsDecryptorProps) {
  const [secrets, setSecrets] = useState<DecryptedSecret[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedSecretId, setSelectedSecretId] = useState<string>('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [copyStatus, setCopyStatus] = useState<{[key: string]: boolean}>({});

  // Decrypt all secrets
  const handleDecryptAll = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await decryptAllSecrets({
        userId,
        userKey,
        includePasswords: true
      });

      if (result.success && Array.isArray(result.data)) {
        setSecrets(result.data);
      } else {
        setError(result.error || 'Failed to decrypt secrets');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decrypt secrets');
    } finally {
      setLoading(false);
    }
  };

  // Decrypt a specific secret
  const handleDecryptSingle = async () => {
    if (!selectedSecretId) {
      setError('Please select a secret to decrypt');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const result = await decryptSecret({
        userId,
        userKey,
        secretId: selectedSecretId
      });

      if (result.success && result.data && !Array.isArray(result.data)) {
        const decryptedSecret = result.data as DecryptedSecret;
        // Update the specific secret in the list or add it if not present
        setSecrets(prev => {
          const existingIndex = prev.findIndex(s => s.id === decryptedSecret.id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = decryptedSecret;
            return updated;
          } else {
            return [...prev, decryptedSecret];
          }
        });
      } else {
        setError(result.error || 'Failed to decrypt secret');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decrypt secret');
    } finally {
      setLoading(false);
    }
  };

  // Copy password to clipboard
  const handleCopyPassword = async (secret: DecryptedSecret) => {
    const success = await copyPasswordToClipboard(secret);
    if (success) {
      setCopyStatus(prev => ({ ...prev, [secret.id]: true }));
      setTimeout(() => {
        setCopyStatus(prev => ({ ...prev, [secret.id]: false }));
      }, 2000);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPasswords(!showPasswords);
  };

  // Clear all decrypted data
  const handleClear = () => {
    setSecrets([]);
    setError('');
    setSelectedSecretId('');
    setCopyStatus({});
  };

  return (
    <div className={`vault-secrets-decryptor ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Vault Secrets Decryptor</h2>
        
        {/* Controls */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleDecryptAll}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Decrypting...' : 'Decrypt All Secrets'}
            </button>
            
            <button
              onClick={togglePasswordVisibility}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {showPasswords ? 'Hide Passwords' : 'Show Passwords'}
            </button>
            
            <button
              onClick={handleClear}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Clear All
            </button>
          </div>

          {/* Single secret decryption */}
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter Secret ID to decrypt individual secret"
              value={selectedSecretId}
              onChange={(e) => setSelectedSecretId(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleDecryptSingle}
              disabled={loading || !selectedSecretId}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Decrypt Single
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-medium">Error:</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Decrypting secrets...</p>
          </div>
        )}

        {/* Secrets Display */}
        {secrets.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">
                Decrypted Secrets ({secrets.length})
              </h3>
              <p className="text-sm text-gray-500">
                Decrypted at: {secrets[0]?.decryptedAt ? new Date(secrets[0].decryptedAt).toLocaleString() : 'N/A'}
              </p>
            </div>
            
            <div className="grid gap-4">
              {secrets.map((secret) => (
                <div key={secret.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-semibold text-gray-800">{secret.title}</h4>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {secret.category}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Username:</span>
                      <p className="text-gray-800 font-mono bg-gray-50 p-1 rounded">{secret.username}</p>
                    </div>
                    
                    {secret.password && (
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-600">Password:</span>
                          <button
                            onClick={() => handleCopyPassword(secret)}
                            className={`text-xs px-2 py-1 rounded transition-colors ${
                              copyStatus[secret.id] 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {copyStatus[secret.id] ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <p className="text-gray-800 font-mono bg-gray-50 p-1 rounded">
                          {showPasswords ? secret.password : '••••••••'}
                        </p>
                      </div>
                    )}
                    
                    {secret.url && (
                      <div>
                        <span className="font-medium text-gray-600">URL:</span>
                        <p className="text-blue-600 underline">
                          <a href={secret.url} target="_blank" rel="noopener noreferrer">
                            {secret.url}
                          </a>
                        </p>
                      </div>
                    )}
                    
                    {secret.notes && (
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-600">Notes:</span>
                        <p className="text-gray-800 bg-gray-50 p-2 rounded">{secret.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 flex justify-between">
                    <span>ID: {secret.id}</span>
                    <span>Modified: {new Date(secret.lastModified).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
