import { v4 as uuidv4 } from 'uuid';
import { VaultData, VaultEntry, VaultEntryInput, SealedVaultData, VaultSearchQuery, VaultStats } from '@/types/vault';
import { sealVaultDataAESGCM, unsealVaultDataAESGCM, validateVaultAESGCMFormat } from '../walrus/crypto';
import { EnhancedWalrusAccountManager, enhancedWalrusConfig } from '../walrus/manager';
import { ServerAccountManager } from '../walrus/server-manager';

/**
 * WalrusVaultManager - Secure vault management using Walrus network
 * 
 * This manager provides encrypted storage for user credentials using the same
 * infrastructure as the account manager but specifically designed for vault data.
 */
export class WalrusVaultManager {
  private walrusManager: EnhancedWalrusAccountManager;
  private serverManager: ServerAccountManager;

  constructor() {
    // Use the same configuration as account manager for consistency
    this.walrusManager = new EnhancedWalrusAccountManager({
      ...enhancedWalrusConfig,
      useSealEncryption: false, // Use AES-GCM for vault data
      encryptionMethod: 'aes-gcm'
    });

    this.serverManager = new ServerAccountManager();
  }

  /**
   * Create a new vault for a user
   */
  async createVault(userId: string, userKey: string): Promise<SealedVaultData> {
    console.log('[walrus-vault-manager] Creating new vault for user:', { userId, userKey: userKey.slice(0, 20) + '...' });

    const vaultData: VaultData = {
      entries: [],
      metadata: {
        userId,
        totalEntries: 0,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    return await this.storeVault(vaultData, userKey);
  }

  /**
   * Store vault data with encryption
   */
  async storeVault(vaultData: VaultData, userKey: string): Promise<SealedVaultData> {
    console.log('[walrus-vault-manager] Storing vault for user:', vaultData.metadata.userId);
    console.log('[walrus-vault-manager] Total entries:', vaultData.metadata.totalEntries);

    try {
      // Encrypt vault data
      const sealedData = await sealVaultDataAESGCM(vaultData, userKey);
      
      // Try to store in Walrus first, fallback to server
      let blobId: string;
      let storageType: string;

      try {
        console.log('[walrus-vault-manager] Attempting to store vault in Walrus...');
        blobId = await this.walrusManager.storeString(sealedData);
        storageType = 'walrus';
        console.log('[walrus-vault-manager] Vault stored successfully in Walrus:', blobId);
      } catch (walrusError) {
        console.warn('[walrus-vault-manager] Walrus storage failed, using server fallback');
        
        // Store as a JSON file on server for vault data
        const timestamp = Date.now();
        const userId = vaultData.metadata.userId;
        blobId = `vault-${btoa(userId).slice(0, 8)}-${timestamp}`;
        
        // Store in server filesystem
        const fs = require('fs');
        const path = require('path');
        const VAULT_STORAGE_DIR = path.join(process.cwd(), '.walrus-data', 'vaults');
        
        if (!fs.existsSync(VAULT_STORAGE_DIR)) {
          fs.mkdirSync(VAULT_STORAGE_DIR, { recursive: true });
          console.log('[walrus-vault-manager] Created vault storage directory:', VAULT_STORAGE_DIR);
        }
        
        const filePath = path.join(VAULT_STORAGE_DIR, `${blobId}.sealed`);
        fs.writeFileSync(filePath, sealedData);
        
        storageType = 'server';
        console.log('[walrus-vault-manager] Vault stored successfully on server:', blobId);
      }

      const sealedVaultData: SealedVaultData = {
        sealedData,
        blobId,
        metadata: {
          userId: vaultData.metadata.userId,
          totalEntries: vaultData.metadata.totalEntries,
          createdAt: vaultData.metadata.createdAt,
          lastUpdated: new Date().toISOString(),
          version: vaultData.metadata.version,
        },
      };

      console.log('[walrus-vault-manager] Vault stored successfully:', {
        userId: sealedVaultData.metadata.userId,
        blobId: sealedVaultData.blobId,
        totalEntries: sealedVaultData.metadata.totalEntries,
        size: sealedData.length,
        storageType,
        encryption: 'AES-GCM'
      });

      return sealedVaultData;

    } catch (error) {
      console.error('[walrus-vault-manager] Failed to store vault:', error);
      throw error;
    }
  }

  /**
   * Retrieve vault data with decryption
   */
  async retrieveVault(blobId: string, userKey: string): Promise<VaultData> {
    console.log('[walrus-vault-manager] Retrieving vault:', { blobId, userKey: userKey.slice(0, 20) + '...' });

    try {
      let sealedData: string;

      // Try Walrus first, then server fallback
      try {
        console.log('[walrus-vault-manager] Attempting to retrieve from Walrus...');
        sealedData = await this.walrusManager.retrieveString(blobId);
        console.log('[walrus-vault-manager] Vault retrieved successfully from Walrus');
      } catch (walrusError) {
        console.warn('[walrus-vault-manager] Walrus retrieval failed, trying server:', walrusError);
        
        // Try server storage
        const fs = require('fs');
        const path = require('path');
        const VAULT_STORAGE_DIR = path.join(process.cwd(), '.walrus-data', 'vaults');
        const filePath = path.join(VAULT_STORAGE_DIR, `${blobId}.sealed`);
        
        if (!fs.existsSync(filePath)) {
          throw new Error(`Vault not found: ${blobId}`);
        }
        
        sealedData = fs.readFileSync(filePath, 'utf-8');
        console.log('[walrus-vault-manager] Vault retrieved from server storage');
      }

      // Validate format
      if (!validateVaultAESGCMFormat(sealedData)) {
        throw new Error('Invalid vault data format');
      }

      // Decrypt vault data
      const vaultData = await unsealVaultDataAESGCM(sealedData, userKey);

      console.log('[walrus-vault-manager] Vault retrieved and decrypted successfully:', {
        userId: vaultData.metadata.userId,
        totalEntries: vaultData.metadata.totalEntries,
        lastUpdated: vaultData.metadata.lastUpdated
      });

      return vaultData;

    } catch (error) {
      console.error('[walrus-vault-manager] Failed to retrieve vault:', error);
      throw error;
    }
  }

  /**
   * Add a new entry to the vault
   */
  async addEntry(blobId: string, userKey: string, entryData: VaultEntryInput): Promise<SealedVaultData> {
    console.log('[walrus-vault-manager] Adding new entry to vault:', blobId);

    // Retrieve existing vault
    const vaultData = await this.retrieveVault(blobId, userKey);

    // Create new entry
    const newEntry: VaultEntry = {
      id: uuidv4(),
      title: entryData.title,
      username: entryData.username,
      password: entryData.password,
      tags: entryData.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add entry to vault
    vaultData.entries.push(newEntry);
    vaultData.metadata.totalEntries = vaultData.entries.length;
    vaultData.metadata.lastUpdated = new Date().toISOString();

    console.log('[walrus-vault-manager] Entry added:', {
      id: newEntry.id,
      title: newEntry.title,
      totalEntries: vaultData.metadata.totalEntries
    });

    // Store updated vault
    return await this.storeVault(vaultData, userKey);
  }

  /**
   * Update an existing entry in the vault
   */
  async updateEntry(blobId: string, userKey: string, entryId: string, updateData: Partial<VaultEntryInput>): Promise<SealedVaultData> {
    console.log('[walrus-vault-manager] Updating entry in vault:', entryId);

    // Retrieve existing vault
    const vaultData = await this.retrieveVault(blobId, userKey);

    // Find and update entry
    const entryIndex = vaultData.entries.findIndex(entry => entry.id === entryId);
    if (entryIndex === -1) {
      throw new Error(`Entry not found: ${entryId}`);
    }

    const existingEntry = vaultData.entries[entryIndex];
    vaultData.entries[entryIndex] = {
      ...existingEntry,
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    vaultData.metadata.lastUpdated = new Date().toISOString();

    console.log('[walrus-vault-manager] Entry updated:', {
      id: entryId,
      title: vaultData.entries[entryIndex].title
    });

    // Store updated vault
    return await this.storeVault(vaultData, userKey);
  }

  /**
   * Remove an entry from the vault
   */
  async removeEntry(blobId: string, userKey: string, entryId: string): Promise<SealedVaultData> {
    console.log('[walrus-vault-manager] Removing entry from vault:', entryId);

    // Retrieve existing vault
    const vaultData = await this.retrieveVault(blobId, userKey);

    // Find and remove entry
    const entryIndex = vaultData.entries.findIndex(entry => entry.id === entryId);
    if (entryIndex === -1) {
      throw new Error(`Entry not found: ${entryId}`);
    }

    const removedEntry = vaultData.entries.splice(entryIndex, 1)[0];
    vaultData.metadata.totalEntries = vaultData.entries.length;
    vaultData.metadata.lastUpdated = new Date().toISOString();

    console.log('[walrus-vault-manager] Entry removed:', {
      id: entryId,
      title: removedEntry.title,
      remainingEntries: vaultData.metadata.totalEntries
    });

    // Store updated vault
    return await this.storeVault(vaultData, userKey);
  }

  /**
   * Search entries in the vault
   */
  async searchEntries(blobId: string, userKey: string, query: VaultSearchQuery): Promise<VaultEntry[]> {
    console.log('[walrus-vault-manager] Searching vault entries:', query);

    // Retrieve vault
    const vaultData = await this.retrieveVault(blobId, userKey);

    // Filter entries based on query
    let results = vaultData.entries;

    if (query.title) {
      const titleLower = query.title.toLowerCase();
      results = results.filter(entry => 
        entry.title.toLowerCase().includes(titleLower)
      );
    }

    if (query.username) {
      const usernameLower = query.username.toLowerCase();
      results = results.filter(entry => 
        entry.username.toLowerCase().includes(usernameLower)
      );
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter(entry => 
        query.tags!.some(tag => entry.tags?.includes(tag))
      );
    }

    console.log('[walrus-vault-manager] Search completed:', {
      totalEntries: vaultData.entries.length,
      matchingEntries: results.length
    });

    return results;
  }

  /**
   * Get vault statistics
   */
  async getVaultStats(blobId: string, userKey: string): Promise<VaultStats> {
    console.log('[walrus-vault-manager] Getting vault statistics:', blobId);

    // Retrieve vault
    const vaultData = await this.retrieveVault(blobId, userKey);
    
    // Entries updated in the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentEntries = vaultData.entries.filter(entry => 
      new Date(entry.updatedAt) > thirtyDaysAgo
    ).length;

    // Collect unique tags
    const uniqueTags = Array.from(new Set(
      vaultData.entries.flatMap(entry => entry.tags || [])
    ));

    const stats: VaultStats = {
      totalEntries: vaultData.metadata.totalEntries,
      recentEntries,
      uniqueTags,
      lastUpdated: vaultData.metadata.lastUpdated
    };

    console.log('[walrus-vault-manager] Vault statistics:', stats);

    return stats;
  }

  /**
   * Export vault data (for backup purposes)
   */
  async exportVault(blobId: string, userKey: string, includePasswords: boolean = false): Promise<any> {
    console.log('[walrus-vault-manager] Exporting vault data:', { blobId, includePasswords });

    // Retrieve vault
    const vaultData = await this.retrieveVault(blobId, userKey);

    // Create export data
    const exportData = {
      metadata: vaultData.metadata,
      entries: vaultData.entries.map(entry => ({
        id: entry.id,
        title: entry.title,
        username: entry.username,
        password: includePasswords ? entry.password : '***HIDDEN***',
        tags: entry.tags,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt
      })),
      exportedAt: new Date().toISOString(),
      exportType: includePasswords ? 'full' : 'partial'
    };

    console.log('[walrus-vault-manager] Vault exported:', {
      userId: vaultData.metadata.userId,
      totalEntries: exportData.entries.length,
      includePasswords
    });

    return exportData;
  }

  /**
   * Validate vault integrity
   */
  async validateVaultIntegrity(blobId: string, userKey: string): Promise<{ isValid: boolean; issues: string[] }> {
    console.log('[walrus-vault-manager] Validating vault integrity:', blobId);

    const issues: string[] = [];

    try {
      // Retrieve and decrypt vault
      const vaultData = await this.retrieveVault(blobId, userKey);

      // Check metadata consistency
      if (vaultData.metadata.totalEntries !== vaultData.entries.length) {
        issues.push(`Metadata inconsistency: totalEntries (${vaultData.metadata.totalEntries}) doesn't match actual entries (${vaultData.entries.length})`);
      }

      // Check for duplicate IDs
      const entryIds = vaultData.entries.map(entry => entry.id);
      const uniqueIds = new Set(entryIds);
      if (entryIds.length !== uniqueIds.size) {
        issues.push('Duplicate entry IDs found');
      }

      // Check for empty required fields
      vaultData.entries.forEach((entry, index) => {
        if (!entry.title) {
          issues.push(`Entry ${index} has empty title`);
        }
        if (!entry.username) {
          issues.push(`Entry ${index} (${entry.title}) has empty username`);
        }
        if (!entry.password) {
          issues.push(`Entry ${index} (${entry.title}) has empty password`);
        }
      });

      console.log('[walrus-vault-manager] Vault integrity check completed:', {
        isValid: issues.length === 0,
        totalIssues: issues.length
      });

      return {
        isValid: issues.length === 0,
        issues
      };

    } catch (error) {
      console.error('[walrus-vault-manager] Vault integrity check failed:', error);
      return {
        isValid: false,
        issues: [`Vault access failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }
}
