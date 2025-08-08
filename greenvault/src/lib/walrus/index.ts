// Core types
export type { 
  AccountData, 
  SealedAccountData, 
  WalrusConfig,
  WalrusStoreResponse,
  WalrusReadResponse 
} from '../../types/walrus';

// Crypto utilities
export {
  sealDataAESGCM,
  unsealDataAESGCM,
  validateAESGCMFormat,
  CRYPTO_CONFIG
} from './crypto';

// Server storage fallback
export { serverAccountManager } from './server-manager';

// Manager with Official SDK Integration (PRIMARY)
export {
  enhancedWalrusManager,
  enhancedWalrusConfig,
  EnhancedWalrusAccountManager,
  type EnhancedWalrusConfig
} from './manager';

// User Data Manager - Server-side only
export {
  WalrusUserManager,
  walrusUserManager,
  type WalrusUserData
} from './user-manager';

// Import types and classes for helper functions
import { WalrusUserManager, type WalrusUserData } from './user-manager';

// Helper function for retrieving user data after authentication
export async function retrieveUserDataFromWalrus(userId: string, userKey: string): Promise<WalrusUserData | null> {
  try {
    const manager = WalrusUserManager.getInstance();
    await manager.initialize();
    return await manager.retrieveUserData(userId, userKey);
  } catch (error) {
    console.error('[walrus-index] Failed to retrieve user data:', error);
    return null;
  }
}

// Helper function for storing/updating user data
export async function storeUserDataInWalrus(userData: WalrusUserData, userKey: string): Promise<string | null> {
  try {
    const manager = WalrusUserManager.getInstance();
    await manager.initialize();
    return await manager.storeUserData(userData, userKey);
  } catch (error) {
    console.error('[walrus-index] Failed to store user data:', error);
    return null;
  }
}

// Main exports for backend integration - V2 as primary
export { 
  enhancedWalrusManager as walrusManager,
  enhancedWalrusConfig as defaultWalrusConfig,
  EnhancedWalrusAccountManager as WalrusAccountManager
} from './manager';

// Default export - enhanced V2 manager for new applications
export { enhancedWalrusManager as default } from './manager';
