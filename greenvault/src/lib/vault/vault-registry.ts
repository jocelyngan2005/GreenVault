/**
 * Vault Registry - Track vaults by user ID
 * 
 * This system maintains a mapping between user IDs and their vault blob IDs
 * to enable retrieval of existing vaults instead of always creating new ones.
 */

import { EnhancedWalrusAccountManager } from '../walrus/manager';
import fs from 'fs';
import path from 'path';

export interface VaultRegistryEntry {
  userId: string;
  blobId: string;
  createdAt: string;
  lastAccessed: string;
  authType: 'email' | 'zklogin';
}

export class VaultRegistry {
  private walrusManager: EnhancedWalrusAccountManager;
  private registryBlobId: string | null = null;
  private registryFile: string;
  private useFileStorage = false;

  constructor() {
    // Initialize with basic Walrus configuration
    this.walrusManager = new EnhancedWalrusAccountManager({
      epochs: 1,
      aggregatorUrl: 'https://aggregator-devnet.walrus.space',
      publisherUrl: 'https://publisher-devnet.walrus.space',
      preferOfficialSDK: false, // Use HTTP API for reliability
    });

    // Set up file-based fallback
    this.registryFile = path.join(process.cwd(), 'vault-registry.json');
  }

  /**
   * Initialize the registry (for first-time setup)
   */
  private async initializeRegistry(): Promise<void> {
    if (!this.registryBlobId && !this.useFileStorage) {
      console.log('[vault-registry] Initializing new registry...');
      const emptyRegistry: VaultRegistryEntry[] = [];
      await this.saveRegistry(emptyRegistry);
    }
  }

  /**
   * Get the registry data from storage (Walrus or file fallback)
   */
  private async getRegistry(): Promise<VaultRegistryEntry[]> {
    try {
      if (this.useFileStorage) {
        // Use file storage
        if (!fs.existsSync(this.registryFile)) {
          console.log('[vault-registry] No registry file found, starting fresh');
          return [];
        }

        const registryData = fs.readFileSync(this.registryFile, 'utf-8');
        const registry = JSON.parse(registryData);
        console.log('[vault-registry] Retrieved registry from file:', registry);
        return registry;
      } else {
        // Try Walrus storage
        if (!this.registryBlobId) {
          console.log('[vault-registry] No registry blob ID found, starting fresh');
          return [];
        }

        const registryData = await this.walrusManager.retrieveString(this.registryBlobId);
        const registry = JSON.parse(registryData);
        console.log('[vault-registry] Retrieved registry from Walrus:', registry);
        return registry;
      }
    } catch (error) {
      // If Walrus fails, fall back to file storage
      if (!this.useFileStorage) {
        console.log('[vault-registry] Walrus failed, falling back to file storage:', error);
        this.useFileStorage = true;
        return await this.getRegistry(); // Recursive call with file storage
      }

      // Registry doesn't exist yet, return empty array
      console.log('[vault-registry] No existing registry found, starting fresh:', error);
      return [];
    }
  }

  /**
   * Save the registry data to storage (Walrus or file fallback)
   */
  private async saveRegistry(registry: VaultRegistryEntry[]): Promise<void> {
    try {
      const registryData = JSON.stringify(registry, null, 2);

      if (this.useFileStorage) {
        // Use file storage
        fs.writeFileSync(this.registryFile, registryData);
        console.log('[vault-registry] Registry saved successfully to file:', this.registryFile);
      } else {
        // Try Walrus storage
        const blobId = await this.walrusManager.storeString(registryData);
        this.registryBlobId = blobId;
        console.log('[vault-registry] Registry saved successfully with blob ID:', blobId);
      }
    } catch (error) {
      // If Walrus fails, fall back to file storage
      if (!this.useFileStorage) {
        console.log('[vault-registry] Walrus failed, falling back to file storage:', error);
        this.useFileStorage = true;
        await this.saveRegistry(registry); // Recursive call with file storage
        return;
      }

      console.error('[vault-registry] Failed to save registry:', error);
      throw error;
    }
  }

  /**
   * Register a new vault for a user
   */
  async registerVault(userId: string, blobId: string, authType: 'email' | 'zklogin'): Promise<void> {
    console.log('[vault-registry] Registering vault for user:', { userId, blobId, authType });

    // Initialize registry if needed
    await this.initializeRegistry();

    const registry = await this.getRegistry();

    // Check if user already has a vault
    const existingIndex = registry.findIndex(entry => entry.userId === userId);

    if (existingIndex >= 0) {
      // Update existing entry
      registry[existingIndex] = {
        ...registry[existingIndex],
        blobId,
        lastAccessed: new Date().toISOString(),
        authType
      };
      console.log('[vault-registry] Updated existing vault entry for user:', userId);
    } else {
      // Add new entry
      registry.push({
        userId,
        blobId,
        createdAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        authType
      });
      console.log('[vault-registry] Added new vault entry for user:', userId);
    }

    await this.saveRegistry(registry);
  }

  /**
   * Get vault blob ID for a user
   */
  async getVaultBlobId(userId: string): Promise<string | null> {
    console.log('[vault-registry] Looking up vault for user:', userId);

    // Initialize registry if needed
    await this.initializeRegistry();

    const registry = await this.getRegistry();
    const entry = registry.find(entry => entry.userId === userId);

    if (entry) {
      // Update last accessed time
      entry.lastAccessed = new Date().toISOString();
      await this.saveRegistry(registry);

      console.log('[vault-registry] Found existing vault for user:', { userId, blobId: entry.blobId });
      return entry.blobId;
    }

    console.log('[vault-registry] No existing vault found for user:', userId);
    return null;
  }

  /**
   * Check if user has an existing vault
   */
  async hasVault(userId: string): Promise<boolean> {
    const blobId = await this.getVaultBlobId(userId);
    return blobId !== null;
  }

  /**
   * Remove vault entry for a user (for cleanup)
   */
  async removeVault(userId: string): Promise<void> {
    console.log('[vault-registry] Removing vault entry for user:', userId);

    const registry = await this.getRegistry();
    const filteredRegistry = registry.filter(entry => entry.userId !== userId);

    if (filteredRegistry.length !== registry.length) {
      await this.saveRegistry(filteredRegistry);
      console.log('[vault-registry] Removed vault entry for user:', userId);
    }
  }

  /**
   * Get all vault entries (for admin/debugging)
   */
  async getAllVaults(): Promise<VaultRegistryEntry[]> {
    return await this.getRegistry();
  }
}

// Export singleton instance
export const vaultRegistry = new VaultRegistry();
