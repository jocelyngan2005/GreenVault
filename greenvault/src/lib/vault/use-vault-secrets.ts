'use client';

import { useState, useEffect, useCallback } from 'react';
import { vaultSecretsClient, type AddSecretRequest, type UpdateSecretRequest } from './vault-secrets-client';
import type { VaultSecret, VaultSecretsData } from '@/app/api/vault/secrets/route';

export interface UseVaultSecretsOptions {
  userId: string;
  userKey: string;
  autoLoad?: boolean;
}

export interface UseVaultSecretsReturn {
  // State
  secrets: VaultSecret[];
  loading: boolean;
  error: string | null;
  categories: string[];
  
  // Actions
  loadSecrets: () => Promise<void>;
  addSecret: (secret: AddSecretRequest) => Promise<{ success: boolean; error?: string }>;
  updateSecret: (secretId: string, updates: UpdateSecretRequest) => Promise<{ success: boolean; error?: string }>;
  deleteSecret: (secretId: string) => Promise<{ success: boolean; error?: string }>;
  searchSecrets: (searchText: string) => VaultSecret[];
  filterByCategory: (category: string) => VaultSecret[];
  generatePassword: (length?: number) => string;
  validateSecret: (secret: AddSecretRequest) => { isValid: boolean; errors: string[] };
  
  // Utilities
  refreshSecrets: () => Promise<void>;
  clearError: () => void;
}

export function useVaultSecrets({ userId, userKey, autoLoad = true }: UseVaultSecretsOptions): UseVaultSecretsReturn {
  const [secrets, setSecrets] = useState<VaultSecret[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  // Load secrets from the API
  const loadSecrets = useCallback(async () => {
    if (!userId || !userKey) {
      setError('User ID and User Key are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const secretsData: VaultSecretsData = await vaultSecretsClient.getSecrets(userId, userKey);
      setSecrets(secretsData.secrets);
      
      // Update categories
      const uniqueCategories = vaultSecretsClient.getCategories(secretsData.secrets);
      setCategories(uniqueCategories);
      
      console.log('[use-vault-secrets] Loaded secrets:', {
        count: secretsData.secrets.length,
        categories: uniqueCategories
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load secrets';
      setError(errorMessage);
      console.error('[use-vault-secrets] Failed to load secrets:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, userKey]);

  // Add a new secret
  const addSecret = useCallback(async (secret: AddSecretRequest): Promise<{ success: boolean; error?: string }> => {
    if (!userId || !userKey) {
      return { success: false, error: 'User ID and User Key are required' };
    }

    setLoading(true);
    setError(null);

    try {
      // Validate the secret
      const validation = vaultSecretsClient.validateSecret(secret);
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(', ') };
      }

      const result = await vaultSecretsClient.addSecret(userId, userKey, secret);
      
      // Update local state
      setSecrets(prev => [result.secret, ...prev]);
      
      // Update categories
      const uniqueCategories = vaultSecretsClient.getCategories([result.secret, ...secrets]);
      setCategories(uniqueCategories);
      
      console.log('[use-vault-secrets] Secret added successfully:', {
        secretId: result.secret.id,
        totalSecrets: result.totalSecrets
      });
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add secret';
      setError(errorMessage);
      console.error('[use-vault-secrets] Failed to add secret:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [userId, userKey, secrets]);

  // Update an existing secret
  const updateSecret = useCallback(async (secretId: string, updates: UpdateSecretRequest): Promise<{ success: boolean; error?: string }> => {
    if (!userId || !userKey) {
      return { success: false, error: 'User ID and User Key are required' };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await vaultSecretsClient.updateSecret(userId, userKey, secretId, updates);
      
      // Update local state
      setSecrets(prev => prev.map(secret => 
        secret.id === secretId ? result.secret : secret
      ));
      
      // Update categories if category was changed
      if (updates.category) {
        const uniqueCategories = vaultSecretsClient.getCategories(secrets);
        setCategories(uniqueCategories);
      }
      
      console.log('[use-vault-secrets] Secret updated successfully:', {
        secretId,
        totalSecrets: result.totalSecrets
      });
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update secret';
      setError(errorMessage);
      console.error('[use-vault-secrets] Failed to update secret:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [userId, userKey, secrets]);

  // Delete a secret
  const deleteSecret = useCallback(async (secretId: string): Promise<{ success: boolean; error?: string }> => {
    if (!userId || !userKey) {
      return { success: false, error: 'User ID and User Key are required' };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await vaultSecretsClient.deleteSecret(userId, userKey, secretId);
      
      // Update local state
      setSecrets(prev => prev.filter(secret => secret.id !== secretId));
      
      // Update categories
      const uniqueCategories = vaultSecretsClient.getCategories(secrets.filter(secret => secret.id !== secretId));
      setCategories(uniqueCategories);
      
      console.log('[use-vault-secrets] Secret deleted successfully:', {
        secretId,
        totalSecrets: result.totalSecrets
      });
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete secret';
      setError(errorMessage);
      console.error('[use-vault-secrets] Failed to delete secret:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [userId, userKey, secrets]);

  // Search secrets by text
  const searchSecrets = useCallback((searchText: string): VaultSecret[] => {
    return vaultSecretsClient.searchSecretsByText(secrets || [], searchText);
  }, [secrets]);

  // Filter secrets by category
  const filterByCategory = useCallback((category: string): VaultSecret[] => {
    return vaultSecretsClient.searchSecretsByCategory(secrets || [], category);
  }, [secrets]);

  // Generate a secure password
  const generatePassword = useCallback((length: number = 16): string => {
    return vaultSecretsClient.generateSecurePassword(length);
  }, []);

  // Validate secret data
  const validateSecret = useCallback((secret: AddSecretRequest): { isValid: boolean; errors: string[] } => {
    return vaultSecretsClient.validateSecret(secret);
  }, []);

  // Refresh secrets (reload from API)
  const refreshSecrets = useCallback(async () => {
    await loadSecrets();
  }, [loadSecrets]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-load secrets on mount if enabled
  useEffect(() => {
    if (autoLoad && userId && userKey) {
      loadSecrets();
    }
  }, [autoLoad, userId, userKey, loadSecrets]);

  return {
    // State
    secrets,
    loading,
    error,
    categories,
    
    // Actions
    loadSecrets,
    addSecret,
    updateSecret,
    deleteSecret,
    searchSecrets,
    filterByCategory,
    generatePassword,
    validateSecret,
    
    // Utilities
    refreshSecrets,
    clearError,
  };
}
