import { WalrusVaultManager } from '@/lib/vault/vault-manager';
import { VaultData, VaultEntry, VaultEntryInput, SealedVaultData, VaultSearchQuery, VaultStats } from '@/types/vault';
import { vaultRegistry } from '@/lib/vault/vault-registry';
import { enhancedWalrusManager } from '@/lib/walrus/manager';
import { sealDataAESGCM, unsealDataAESGCM } from '@/lib/walrus/crypto';

export interface UserVaultData {
  blobId: string;
  secretsBlobId?: string;
  userId: string;
  createdAt: string;
  lastUpdated: string;
  version: string;
}

export class VaultService {
  private vaultManager: WalrusVaultManager;

  constructor() {
    this.vaultManager = new WalrusVaultManager();
  }

  /**
   * Initialize or get user's vault
   */
  async initializeUserVault(userId: string, userKey: string, authType: 'email' | 'zklogin' = 'email'): Promise<{ blobId: string; isNew: boolean }> {
    try {
      console.log('[vault-service] Initializing vault for user:', userId);

      // Check if user already has a vault in the registry
      const existingBlobId = await vaultRegistry.getVaultBlobId(userId);
      
      if (existingBlobId) {
        console.log('[vault-service] Found existing vault for user:', { userId, blobId: existingBlobId });
        
        // Verify the vault can be retrieved (it still exists)
        try {
          await this.vaultManager.retrieveVault(existingBlobId, userKey);
          console.log('[vault-service] Successfully verified existing vault');
          
          return {
            blobId: existingBlobId,
            isNew: false
          };
        } catch (retrieveError) {
          console.warn('[vault-service] Existing vault not accessible, creating new one:', retrieveError);
          // Fall through to create new vault
        }
      } else {
        console.log('[vault-service] No existing vault found in registry for user:', userId);
      }

      // Create a new vault for the user
      console.log('[vault-service] Creating new vault for user:', userId);
      const vaultData = await this.vaultManager.createVault(userId, userKey);

      // Register the new vault in the registry
      await vaultRegistry.registerVault(userId, vaultData.blobId, authType);

      console.log('[vault-service] Vault initialized successfully:', {
        userId,
        blobId: vaultData.blobId,
        isNew: true
      });

      return {
        blobId: vaultData.blobId,
        isNew: true
      };

    } catch (error) {
      console.error('[vault-service] Failed to initialize vault:', error);
      throw new Error(`Failed to initialize vault: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add a new credential to the vault
   */
  async addCredential(blobId: string, userKey: string, credential: VaultEntryInput): Promise<{ success: boolean; entryId?: string }> {
    try {
      console.log('[vault-service] Adding credential to vault:', {
        blobId,
        title: credential.title,
        username: credential.username
      });

      // Validate input
      if (!credential.title || !credential.username || !credential.password) {
        throw new Error('Title, username, and password are required');
      }

      const updatedVault = await this.vaultManager.addEntry(blobId, userKey, credential);

      // Get the newly added entry ID by finding the most recent entry
      const vault = await this.vaultManager.retrieveVault(updatedVault.blobId, userKey);
      const newestEntry = vault.entries.reduce((latest, entry) => 
        new Date(entry.createdAt) > new Date(latest.createdAt) ? entry : latest
      );

      console.log('[vault-service] Credential added successfully:', {
        entryId: newestEntry.id,
        title: newestEntry.title,
        totalEntries: vault.metadata.totalEntries
      });

      return {
        success: true,
        entryId: newestEntry.id
      };

    } catch (error) {
      console.error('[vault-service] Failed to add credential:', error);
      return {
        success: false
      };
    }
  }

  /**
   * Get all credentials from vault
   */
  async getAllCredentials(blobId: string, userKey: string): Promise<VaultEntry[]> {
    try {
      console.log('[vault-service] Retrieving all credentials from vault:', blobId);

      const vault = await this.vaultManager.retrieveVault(blobId, userKey);

      console.log('[vault-service] Retrieved credentials:', {
        totalEntries: vault.entries.length,
        userId: vault.metadata.userId
      });

      return vault.entries.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

    } catch (error) {
      console.error('[vault-service] Failed to get credentials:', error);
      throw new Error(`Failed to retrieve credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a credential in the vault
   */
  async updateCredential(blobId: string, userKey: string, entryId: string, updates: Partial<VaultEntryInput>): Promise<{ success: boolean }> {
    try {
      console.log('[vault-service] Updating credential:', {
        blobId,
        entryId,
        updates: Object.keys(updates)
      });

      await this.vaultManager.updateEntry(blobId, userKey, entryId, updates);

      console.log('[vault-service] Credential updated successfully:', entryId);

      return { success: true };

    } catch (error) {
      console.error('[vault-service] Failed to update credential:', error);
      return { success: false };
    }
  }

  /**
   * Remove a credential from the vault
   */
  async removeCredential(blobId: string, userKey: string, entryId: string): Promise<{ success: boolean }> {
    try {
      console.log('[vault-service] Removing credential:', {
        blobId,
        entryId
      });

      await this.vaultManager.removeEntry(blobId, userKey, entryId);

      console.log('[vault-service] Credential removed successfully:', entryId);

      return { success: true };

    } catch (error) {
      console.error('[vault-service] Failed to remove credential:', error);
      return { success: false };
    }
  }

  /**
   * Search credentials in the vault
   */
  async searchCredentials(blobId: string, userKey: string, query: VaultSearchQuery): Promise<VaultEntry[]> {
    try {
      console.log('[vault-service] Searching credentials:', {
        blobId,
        query
      });

      const results = await this.vaultManager.searchEntries(blobId, userKey, query);

      console.log('[vault-service] Search completed:', {
        resultsCount: results.length
      });

      return results.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

    } catch (error) {
      console.error('[vault-service] Search failed:', error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get vault statistics
   */
  async getVaultStatistics(blobId: string, userKey: string): Promise<VaultStats> {
    try {
      console.log('[vault-service] Getting vault statistics:', blobId);

      const stats = await this.vaultManager.getVaultStats(blobId, userKey);

      console.log('[vault-service] Statistics retrieved:', stats);

      return stats;

    } catch (error) {
      console.error('[vault-service] Failed to get statistics:', error);
      throw new Error(`Failed to get statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export vault data for backup
   */
  async exportVaultData(blobId: string, userKey: string, includePasswords: boolean = false): Promise<any> {
    try {
      console.log('[vault-service] Exporting vault data:', {
        blobId,
        includePasswords
      });

      const exportData = await this.vaultManager.exportVault(blobId, userKey, includePasswords);

      console.log('[vault-service] Vault data exported:', {
        totalEntries: exportData.entries.length,
        exportType: exportData.exportType
      });

      return exportData;

    } catch (error) {
      console.error('[vault-service] Export failed:', error);
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate vault integrity
   */
  async validateVault(blobId: string, userKey: string): Promise<{ isValid: boolean; issues: string[] }> {
    try {
      console.log('[vault-service] Validating vault integrity:', blobId);

      const validation = await this.vaultManager.validateVaultIntegrity(blobId, userKey);

      console.log('[vault-service] Vault validation completed:', validation);

      return validation;

    } catch (error) {
      console.error('[vault-service] Validation failed:', error);
      return {
        isValid: false,
        issues: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Get user's vault data
   */
  async getUserVault(userId: string, userKey: string): Promise<UserVaultData | null> {
    try {
      console.log('[vault-service] Getting vault for user:', userId);

      // Get full vault entry from registry (includes secretsBlobId)
      const registryEntry = await vaultRegistry.getVaultEntry(userId);
      
      if (!registryEntry) {
        console.log('[vault-service] No vault found for user:', userId);
        return null;
      }

      // Try to retrieve the vault to verify it exists
      try {
        const vault = await this.vaultManager.retrieveVault(registryEntry.blobId, userKey);
        
        // Create user vault data structure with secrets blob ID
        const userVaultData: UserVaultData = {
          blobId: registryEntry.blobId,
          secretsBlobId: registryEntry.secretsBlobId,
          userId: vault.metadata.userId,
          createdAt: vault.metadata.createdAt,
          lastUpdated: vault.metadata.lastUpdated,
          version: vault.metadata.version,
        };

        console.log('[vault-service] Retrieved vault successfully:', {
          userId,
          blobId: registryEntry.blobId,
          secretsBlobId: registryEntry.secretsBlobId || 'none',
          totalEntries: vault.entries.length
        });

        return userVaultData;

      } catch (retrieveError) {
        console.warn('[vault-service] Vault not accessible, removing from registry:', retrieveError);
        await vaultRegistry.removeVault(userId);
        return null;
      }

    } catch (error) {
      console.error('[vault-service] Failed to get user vault:', error);
      return null;
    }
  }

  /**
   * Update user's vault data, creating one if it doesn't exist
   */
  async updateUserVault(userId: string, userKey: string, updates: Partial<UserVaultData>): Promise<void> {
    try {
      console.log('[vault-service] Updating vault for user:', userId, 'updates:', updates);

      // Get current vault data
      let currentVault = await this.getUserVault(userId, userKey);
      
      if (!currentVault) {
        console.log('[vault-service] No existing vault found, creating new vault for user:', userId);
        
        // Initialize a new vault when none exists
        const initResult = await this.initializeUserVault(userId, userKey, 'email');
        currentVault = {
          userId,
          blobId: initResult.blobId,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          version: '1.0'
        };
      }

      // Update the vault with new data
      const updatedVaultData: UserVaultData = {
        ...currentVault,
        ...updates,
        lastUpdated: new Date().toISOString()
      };

      // If secrets blob ID is being updated, save it to the registry
      if (updates.secretsBlobId) {
        await vaultRegistry.updateSecretsBlobId(userId, updates.secretsBlobId);
        console.log('[vault-service] Updated secrets blob ID in registry:', updates.secretsBlobId);
      }

      console.log('[vault-service] Vault updated successfully:', {
        userId,
        blobId: updatedVaultData.blobId,
        secretsBlobId: updatedVaultData.secretsBlobId || 'none'
      });

    } catch (error) {
      console.error('[vault-service] Failed to update user vault:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const vaultService = new VaultService();
