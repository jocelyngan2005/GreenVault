import { enhancedWalrusManager } from './manager';
import { serverAccountManager } from './server-manager';
import type { AccountData, SealedAccountData } from '@/types/walrus';
import type { ZkLoginData, User } from '@/types/zklogin';

export interface WalrusUserData {
  zkLoginData?: ZkLoginData;
  didData?: {
    did: string;
    document: any;
    createdAt: string;
    updatedAt: string;
  };
  userSalt: string;
  metadata: {
    userId: string;
    email?: string;
    name?: string;
    lastLogin: string;
    createdAt: string;
    version: string;
  };
  // Store additional user preferences that were in localStorage
  userRole?: 'project-owner' | 'credit-buyer';
  theme?: 'light' | 'dark';
  language?: string;
}

export class WalrusUserManager {
  private static instance: WalrusUserManager;
  private cache: Map<string, WalrusUserData> = new Map();
  private isInitialized = false;

  private constructor() {}

  static getInstance(): WalrusUserManager {
    if (!WalrusUserManager.instance) {
      WalrusUserManager.instance = new WalrusUserManager();
    }
    return WalrusUserManager.instance;
  }

  /**
   * Initialize the manager
   * if walrus sdk loaded successfully > proceed to storage on walrus
   * if walrus sdk failed to load > fallback to local storage
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('[walrus-user-manager] Initializing storage...');
    
    try {
      // Initialize the Walrus manager
      await enhancedWalrusManager.initialize?.();
      this.isInitialized = true; // if initialization is successful
      console.log('[walrus-user-manager] Initialization complete!');
    } catch (error) {
      console.warn('[walrus-user-manager] Initialization warning! (fallback enabled):', error);
      this.isInitialized = true; // Still allow operations with fallback
    }
  }

  /**
   * Comprehensive Walrus health check before storage operations
   */
  private async runWalrusHealthCheck(): Promise<{
    isHealthy: boolean;
    reason: string;
    details: any;
  }> {
    console.log('[walrus-user-manager] Starting comprehensive health check...');
    
    try {
      // Development mode check 
      const DISABLE_WALRUS_IN_DEV = process.env.NODE_ENV === 'development' && process.env.WALRUS_ENABLED !== 'true';
      // const FORCE_WALRUS_IN_DEV = process.env.NODE_ENV === 'development' && process.env.WALRUS_ENABLED === 'true';

      if (DISABLE_WALRUS_IN_DEV) {
        return {
          isHealthy: false,
          reason: 'Walrus disabled in development mode (set WALRUS_ENABLED=true to enable)',
          details: { developmentMode: true, walrusEnabled: false }
        };
      }

      // Manager initialization
      try {
        // check if Walrus SDK is loaded
        await enhancedWalrusManager.initialize?.();
      } catch (initError) {
        return {
          isHealthy: false,
          reason: 'Failed to initialize Walrus manager',
          details: { initError: initError instanceof Error ? initError.message : String(initError) }
        };
      }

      // If forced in development, skip network checks
      // if (FORCE_WALRUS_IN_DEV) {
      //   console.log('[walrus-user-manager] Walrus in development mode');
      //   const managerStatus = enhancedWalrusManager.getStatus();
      //   return {
      //     isHealthy: true,
      //     reason: 'Walrus forced enabled in development mode',
      //     details: {
      //       developmentMode: true,
      //       walrusEnabled: true,
      //       networkReachable: 'bypassed',
      //       managerStatus
      //     }
      //   };
      // }

      // Network connectivity and service availability
      const isAvailable = await enhancedWalrusManager.isAvailable();
      
      if (!isAvailable) {
        return {
          isHealthy: false,
          reason: 'Walrus network endpoints are not reachable or responding',
          details: { networkCheck: false, endpoints: 'devnet endpoints unavailable' }
        };
      }

      // Get manager status
      const managerStatus = enhancedWalrusManager.getStatus();
      
      // All checks passed
      console.log('[walrus-user-manager] All health checks passed - Walrus is ready');
      return {
        isHealthy: true,
        reason: 'Walrus is healthy and ready for storage operations',
        details: {
          developmentMode: false,
          walrusEnabled: true,
          networkReachable: true,
          managerStatus
        }
      };

    } catch (healthError) {
      const errorMessage = healthError instanceof Error ? healthError.message : String(healthError);
      console.warn('[walrus-user-manager] Health check failed with error:', errorMessage);
      
      return {
        isHealthy: false,
        reason: `Health check failed: ${errorMessage}`,
        details: { error: errorMessage, checkFailed: true }
      };
    }
  }

  /**
   * Store user data directly in Walrus/server storage
   */
  async storeUserData(userData: WalrusUserData, userKey: string): Promise<string> {
    console.log('[walrus-user-manager] Storing user data for:', userData.metadata.userId);

    // Ensure manager is initialized
    await this.initialize();

    // Convert to AccountData format expected by Walrus managers
    const accountData: AccountData = {
      zkLoginData: userData.zkLoginData || {
        userAddress: '',
        zkProof: {} as any,
        ephemeralKeyPair: { privateKey: '', publicKey: '' },
        maxEpoch: 0,
        randomness: '',
        userSalt: userData.userSalt,
        jwt: '',
        decodedJwt: {} as any
      },
      didData: userData.didData,
      userSalt: userData.userSalt,
      metadata: userData.metadata
    };

    let sealedData: SealedAccountData;
    let storageType = 'unknown';

    try {
      // Run comprehensive health check first
      console.log('[walrus-user-manager] Running Walrus health check before storage...');
      const healthCheck = await this.runWalrusHealthCheck();
      
      if (healthCheck.isHealthy) {
        // Walrus is healthy - use Walrus storage
        console.log('[walrus-user-manager] Health check passed - Walrus is healthy and available');
        console.log('[walrus-user-manager] Storing data in Walrus network...');

        try {
          sealedData = await enhancedWalrusManager.storeAccount(accountData, userKey);
          storageType = 'walrus';
          console.log('[walrus-user-manager] Data successfully stored in Walrus network:', sealedData.blobId);
        } catch (storeError) {
          const errorMessage = storeError instanceof Error ? storeError.message : String(storeError);
          console.warn('[walrus-user-manager] Walrus storage failed despite health check:', errorMessage);
          // Fall through to catch block for server fallback
          throw storeError;
        }
      } else {
        // Walrus is unhealthy - use server fallback immediately
        console.log('[walrus-user-manager] Health check failed:', healthCheck.reason);
        console.log('[walrus-user-manager] Using secure server storage...');

        sealedData = await serverAccountManager.storeAccount(accountData, userKey);
        storageType = 'server-planned';
        console.log('[walrus-user-manager] Data stored in server storage:', sealedData.blobId);
      }

    } catch (error) {
      // Emergency fallback if Walrus storage failed after health check passed
      console.error('[walrus-user-manager] Primary storage failed, using emergency server fallback...');
      
      sealedData = await serverAccountManager.storeAccount(accountData, userKey);
      storageType = 'server-emergency';
      console.log('[walrus-user-manager] Data stored in server storage:', sealedData.blobId);
    }

    // Cache the data locally for quick access
    this.cache.set(userData.metadata.userId, userData);

    // Store the blobId in localStorage for quick retrieval
    this.storeBlobReference(userData.metadata.userId, sealedData.blobId, storageType);

    console.log('[walrus-user-manager] User data stored successfully:', {
      userId: userData.metadata.userId,
      blobId: sealedData.blobId,
      storageType
    });

    return sealedData.blobId;
  }

  /**
   * Retrieve user data from Walrus with fallback to server storage
   */
  async retrieveUserData(userId: string, userKey: string): Promise<WalrusUserData | null> {
    console.log('[walrus-user-manager] Retrieving user data for:', userId);

    // Check cache first
    if (this.cache.has(userId)) {
      console.log('[walrus-user-manager] Returning cached data');
      return this.cache.get(userId) || null;
    }

    try {
      // Get the blobId from localStorage reference
      const blobReference = this.getBlobReference(userId);
      if (!blobReference) {
        console.log('[walrus-user-manager] No blob reference found for user:', userId);
        return null;
      }

      console.log('[walrus-user-manager] Found blob reference:', blobReference);

      let accountData: AccountData;
      
      // Try to retrieve based on storage type
      if (blobReference.storageType?.startsWith('server') || blobReference.blobId.startsWith('server-')) {
        console.log('[walrus-user-manager] Using server storage for retrieval...');
        accountData = await serverAccountManager.retrieveAccount(blobReference.blobId, userKey);
      } else {
        try {
          console.log('[walrus-user-manager] Attempting Walrus retrieval...');
          accountData = await enhancedWalrusManager.retrieveAccount(blobReference.blobId, userKey);
          console.log('[walrus-user-manager] Data retrieved from Walrus');
        } catch (walrusError) {
          console.warn('[walrus-user-manager] Walrus retrieval failed, trying server fallback:', walrusError);
          accountData = await serverAccountManager.retrieveAccount(blobReference.blobId, userKey);
          console.log('[walrus-user-manager] Data retrieved from server (fallback)');
        }
      }

      // Convert back to WalrusUserData format
      const userData: WalrusUserData = {
        zkLoginData: accountData.zkLoginData.userAddress ? accountData.zkLoginData : undefined,
        didData: accountData.didData,
        userSalt: accountData.userSalt,
        metadata: accountData.metadata,
        // Additional data would be stored in metadata or separately
        userRole: undefined,
        theme: undefined,
        language: undefined
      };

      // Cache the retrieved data
      this.cache.set(userId, userData);

      console.log('[walrus-user-manager] User data retrieved successfully:', {
        userId: userData.metadata.userId,
        hasZkLogin: !!userData.zkLoginData,
        hasDID: !!userData.didData
      });
      console.log('[walrus-user-manager] zkLogin Data:', userData.zkLoginData);
      console.log('[walrus-user-manager] DID Data:', userData.didData);

      return userData;

    } catch (error) {
      console.error('[walrus-user-manager] Failed to retrieve user data:', error);
      return null;
    }
  }

  /**
   * Update user data in storage
   */
  async updateUserData(userData: WalrusUserData, userKey: string): Promise<string> {
    console.log('[walrus-user-manager] Updating user data for:', userData.metadata.userId);

    // Update timestamps
    userData.metadata.lastLogin = new Date().toISOString();
    userData.metadata.version = `v${Date.now()}`;

    // Store as new data (immutable updates)
    return await this.storeUserData(userData, userKey);
  }

  /**
   * Store blob reference in localStorage for quick retrieval
   */
  private storeBlobReference(userId: string, blobId: string, storageType: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const reference = {
          blobId,
          storageType,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem(`walrus-ref-${userId}`, JSON.stringify(reference));
      }
    } catch (error) {
      console.warn('[walrus-user-manager] Failed to store blob reference:', error);
    }
  }

  /**
   * Get blob reference from localStorage
   */
  private getBlobReference(userId: string): { blobId: string; storageType: string; timestamp: string } | null {
    try {
      if (typeof localStorage !== 'undefined') {
        const referenceStr = localStorage.getItem(`walrus-ref-${userId}`);
        if (referenceStr) {
          return JSON.parse(referenceStr);
        }
      }
    } catch (error) {
      console.warn('[walrus-user-manager] Failed to get blob reference:', error);
    }
    return null;
  }

  /**
   * Check if user data exists for a user
   */
  async hasUserData(userId: string): Promise<boolean> {
    // Check cache first
    if (this.cache.has(userId)) {
      return true;
    }

    // Check blob reference
    const blobReference = this.getBlobReference(userId);
    return blobReference !== null;
  }

  /**
   * Get user data for quick access (cached version)
   */
  getCachedUserData(userId: string): WalrusUserData | null {
    return this.cache.get(userId) || null;
  }

  /**
   * Helper method to get current user ID from zkLogin data
   */
  getCurrentUserId(): string | null {
    if (typeof localStorage === 'undefined') return null;

    const zkLoginDataStr = localStorage.getItem('zklogin-data');
    if (!zkLoginDataStr) return null;

    try {
      const zkLoginData: ZkLoginData = JSON.parse(zkLoginDataStr);
      return zkLoginData.decodedJwt.sub;
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const walrusUserManager = WalrusUserManager.getInstance();