/**
 * Vault Authentication Utilities
 * 
 * This file provides utility functions to manage vault initialization
 * and key generation consistently across all authentication methods.
 */

import { vaultService } from '@/lib/vault/vault-service';

export interface VaultInitResult {
  vaultBlobId?: string;
  isNewVault?: boolean;
  userId?: string;
  initialized: boolean;
  error?: string;
  timestamp: string;
}

/**
 * Generate a consistent vault key for a user
 */
export function generateVaultKey(userId: string, salt: string): string {
  // Create a vault-specific key using user ID and salt
  // In production, you might want to use a more sophisticated key derivation
  return `vault-${salt}-${userId}`;
}

/**
 * Generate vault key for email/password authentication
 */
export function generateVaultKeyFromPassword(userId: string, passwordHash: string): string {
  // Use first 16 chars of password hash as salt
  const salt = passwordHash.slice(0, 16);
  return `vault-${userId}-${salt}`;
}

/**
 * Generate a consistent vault key for a user (for frontend use)
 */
export function generateConsistentVaultKey(userId: string): string {
  // Create a consistent key based on user ID
  // This ensures the same vault is accessed across sessions
  return `vault-${userId}-consistent`;
}

/**
 * Initialize vault for any authentication method
 */
export async function initializeUserVaultSafely(
  userId: string, 
  userKey: string,
  isNewUser: boolean = false
): Promise<VaultInitResult> {
  console.log('[vault-auth] Initializing vault for user:', userId);
  
  try {
    // Initialize vault - this will create a new vault or return existing one
    const { blobId: vaultBlobId, isNew: isNewVault } = await vaultService.initializeUserVault(userId, userKey);
    
    const result: VaultInitResult = {
      vaultBlobId,
      isNewVault,
      userId,
      initialized: true,
      timestamp: new Date().toISOString()
    };
    
    console.log('[vault-auth] Vault initialization successful:', {
      userId,
      vaultBlobId,
      isNewVault,
      timestamp: result.timestamp
    });

    // Log warning if we expected existing vault but got new one
    if (!isNewUser && isNewVault) {
      console.warn('[vault-auth] New vault created for existing user - possible data loss');
    }
    
    return result;
    
  } catch (vaultError) {
    console.error('[vault-auth] Failed to initialize vault:', vaultError);
    return {
      error: vaultError instanceof Error ? vaultError.message : 'Vault initialization failed',
      initialized: false,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get vault information for client-side storage
 */
export function getVaultStorageInfo(vaultResult: VaultInitResult, userKey: string) {
  if (!vaultResult.initialized || !vaultResult.vaultBlobId) {
    return null;
  }

  return {
    vaultBlobId: vaultResult.vaultBlobId,
    // Note: In production, you might want to store a derived key or encrypted key
    // Never store the actual encryption key in localStorage in production
    vaultKey: userKey, // Consider encrypting this with user's session key
    userId: vaultResult.userId,
    initialized: true,
    timestamp: vaultResult.timestamp
  };
}
