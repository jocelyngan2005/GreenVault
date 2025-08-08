import { AccountData, SealedAccountData } from '@/types/walrus';
import { sealDataAESGCM, unsealDataAESGCM } from './crypto';
import fs from 'fs';
import path from 'path';

// Server-side storage directory
const STORAGE_DIR = path.join(process.cwd(), '.walrus-storage');

export class ServerAccountManager {
  private storageDir: string;

  constructor() {
    this.storageDir = STORAGE_DIR;
    // Ensure storage directory exists
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
      console.log('[walrus-server-manager] Created server storage directory:', this.storageDir);
    }
  }

  /**
   * Seal account data using AES-GCM authenticated encryption
   */
  private async sealData(data: AccountData, userKey: string): Promise<string> {
    console.log('[walrus-server-manager] Sealing account data using AES-GCM for user:', data.metadata.userId);
    return await sealDataAESGCM(data, userKey);
  }

  /**
   * Unseal account data with auto-detection of encryption format
   */
  private async unsealData(sealedData: string, userKey: string): Promise<AccountData> {
    console.log('[walrus-server-manager] Unsealing account data, sealed size:', sealedData.length, 'chars');

    try {
      const data = await unsealDataAESGCM(sealedData, userKey);
      console.log('[walrus-server-manager] Data unsealed successfully for user:', data.metadata.userId);
      return data;
    } catch (error) {
      console.error('[walrus-server-manager] Failed to unseal data:', error);
      throw new Error('Failed to unseal account data');
    }
  }

  /**
   * Store account data on server filesystem (fallback when Walrus is down)
   */
  async storeAccount(accountData: AccountData, userKey: string): Promise<SealedAccountData> {
    console.log('[walrus-server-manager] Storing account data on server for user:', accountData.metadata.userId);
    console.log('[walrus-server-manager] Storing userSalt:', accountData.userSalt);

    try {
      // Seal the data with AES-GCM
      const sealedData = await this.sealData(accountData, userKey);
      
      // Generate a server blob ID for consistency
      const timestamp = Date.now();
      const userId = accountData.metadata.userId;
      const blobId = `server-${btoa(userId).slice(0, 8)}-${timestamp}`;

      console.log('[walrus-server-manager] Storing to server filesystem with blobId:', blobId);

      // Store in server filesystem
      const filePath = path.join(this.storageDir, `${blobId}.sealed`);
      fs.writeFileSync(filePath, sealedData);
      
      const sealedAccountData: SealedAccountData = {
        sealedData,
        blobId,
        metadata: {
          userId: accountData.metadata.userId,
          createdAt: accountData.metadata.createdAt,
          lastUpdated: new Date().toISOString(),
          version: accountData.metadata.version,
        },
      };

      console.log('[walrus-server-manager] Account successfully stored on server:', {
        userId: sealedAccountData.metadata.userId,
        blobId: sealedAccountData.blobId,
        size: sealedData.length,
        storageType: 'server',
        encryption: 'AES-GCM',
        filePath
      });

      return sealedAccountData;
    } catch (error) {
      console.error('[walrus-server-manager] Failed to store account on server:', error);
      throw error;
    }
  }

  /**
   * Retrieve account data from server filesystem
   */
  async retrieveAccount(blobId: string, userKey: string): Promise<AccountData> {
    console.log('[walrus-server-manager] Retrieving account data from server, blobId:', blobId);

    try {
      const filePath = path.join(this.storageDir, `${blobId}.sealed`);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`Account not found on server: ${blobId}`);
      }
      
      const sealedData = fs.readFileSync(filePath, 'utf-8');
      console.log('[walrus-server-manager] Retrieved sealed data from server, size:', sealedData.length, 'chars');

      // Unseal the data with auto-detection
      const accountData = await this.unsealData(sealedData, userKey);

      console.log('[walrus-server-manager] Account successfully retrieved from server:', {
        userId: accountData.metadata.userId,
        blobId,
        hasZkLogin: !!accountData.zkLoginData,
        hasDID: !!accountData.didData,
        storageType: 'server',
        encryption: 'AES-GCM (auto-detected)'
      });

      return accountData;
    } catch (error) {
      console.error('[walrus-server-manager] Failed to retrieve account from server:', error);
      throw error;
    }
  }

  /**
   * Update account data on server filesystem
   */
  async updateAccount(
    existingBlobId: string, 
    updatedAccountData: AccountData, 
    userKey: string
  ): Promise<SealedAccountData> {
    console.log('[walrus-server-manager] Updating account data on server, existing blobId:', existingBlobId);

    // Update metadata
    updatedAccountData.metadata.lastLogin = new Date().toISOString();
    updatedAccountData.metadata.version = `v${Date.now()}`;
    
    // Store as new account (immutable updates)
    return await this.storeAccount(updatedAccountData, userKey);
  }
}

// Global server account manager instance
export const serverAccountManager = new ServerAccountManager();
