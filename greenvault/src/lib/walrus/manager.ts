import { sealDataAESGCM, unsealDataAESGCM } from './crypto';
import { serverAccountManager } from './server-manager';
import { LocalStorageFallback } from './local-storage-fallback';
import type { 
  AccountData, 
  SealedAccountData, 
  WalrusConfig,
  WalrusStoreResponse,
  WalrusReadResponse 
} from '../../types/walrus';

let WalrusClient: any = null;
let SuiClient: any = null;
let getFullnodeUrl: any = null;
let SealClient: any = null;
let SessionKey: any = null;
let getAllowlistedKeyServers: any = null;
let isWalrusSDKAvailable = false;
let isSuiSDKAvailable = false;
let isSealSDKAvailable = false;

// Dynamic SDK Loading (safer for Next.js environments)
async function loadSDKs() {
  // Initialize Walrus SDK
  try {
    const walrusSDK = await import('@mysten/walrus');
    WalrusClient = walrusSDK.WalrusClient;
    isWalrusSDKAvailable = true;
    console.log('[walrus-manager] Walrus SDK loaded successfully');
  } catch (error) {
    console.log('[walrus-manager] Walrus SDK not available');
  }

  // Initialize Sui SDK
  try {
    const suiSDK = await import('@mysten/sui/client');
    SuiClient = suiSDK.SuiClient;
    getFullnodeUrl = suiSDK.getFullnodeUrl;
    isSuiSDKAvailable = true;
    console.log('[walrus-manager] Sui SDK loaded for Walrus integration');
  } catch (error) {
    console.log('[walrus-manager] Sui SDK not available:', error);
  }

  // Initialize Seal SDK
  try {
    const sealSDK = await import('@mysten/seal');
    SealClient = sealSDK.SealClient;
    SessionKey = sealSDK.SessionKey;
    getAllowlistedKeyServers = sealSDK.getAllowlistedKeyServers;
    isSealSDKAvailable = true;
    console.log('[walrus-manager] Seal SDK loaded successfully');
  } catch (error) {
    console.log('[walrus-manager] Seal SDK not available:', error);
  }

  // Log SDK availability summary
  console.log('[walrus-manager] SDK Loading Summary:');
  console.log(`  - Walrus SDK: ${isWalrusSDKAvailable ? 'Available' : 'Using server fallback'}`);
  console.log(`  - Sui SDK: ${isSuiSDKAvailable ? 'Available' : 'Unavailable'}`);
  console.log(`  - Seal SDK: ${isSealSDKAvailable ? 'Available' : 'Using AES-GCM fallback'}`);
}

// Walrus SDK types
interface WalrusClientConfig {
  suiClient: any;
  aggregator: string;
  publisher: string;
}

// Seal SDK types
interface SealClientConfig {
  suiClient: any;
  serverConfigs: Array<{
    objectId: string;
    weight: number;
    apiKeyName?: string;
    apiKey?: string;
  }>;
  verifyKeyServers?: boolean;
}

interface SealEncryptResult {
  encryptedObject: Uint8Array;
  key: string; // Backup symmetric key
}

interface SessionKeyOptions {
  address: string;
  packageId: string;
  ttlMin: number;
  suiClient: any;
}

export interface EnhancedWalrusConfig extends WalrusConfig {
  // SDK preferences
  preferOfficialSDK?: boolean;
  useSealEncryption?: boolean;
  encryptionMethod?: 'aes-gcm' | 'seal' | 'auto';
  
  // Walrus SDK options
  walrusSDKOptions?: WalrusClientConfig;
  
  // Seal SDK options
  sealSDKOptions?: SealClientConfig;
  sealThreshold?: number;
  sealPackageId?: string;
  
  // Performance optimizations
  reuseClients?: boolean;
  cacheSession?: boolean;
  batchOperations?: boolean;
}

export class EnhancedWalrusAccountManager {
  private config: EnhancedWalrusConfig;
  private walrusClient: any = null;
  private suiClient: any = null;
  private sealClient: any = null;
  private sessionKey: any = null;
  private isInitialized = false;

  constructor(config: EnhancedWalrusConfig) {
    this.config = {
      // Default configuration following official guidelines
      preferOfficialSDK: true,
      useSealEncryption: false,
      encryptionMethod: 'auto',
      sealThreshold: 2,
      reuseClients: true,
      cacheSession: true,
      batchOperations: true,
      ...config
    };
  }

  /**
   * Initialize the enhanced manager with proper SDK setup
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load SDKs dynamically first
      await loadSDKs();

      // Initialize Walrus SDK if available and preferred
      if (isWalrusSDKAvailable && this.config.preferOfficialSDK) {
        await this.initializeWalrusSDK();
      }

      // Initialize Seal SDK if available and enabled
      if (isSealSDKAvailable && this.config.useSealEncryption) {
        await this.initializeSealSDK();
      }

      this.isInitialized = true;
      console.log('[walrus-manager] Initialization complete!');
    } catch (error) {
      console.warn('[walrus-manager] Initialization failed, using fallback:', error);
      // Graceful degradation - manager will use HTTP API and AES-GCM
      this.isInitialized = true;
    }
  }

  /**
   * Initialize Walrus SDK
   */
  private async initializeWalrusSDK(): Promise<void> {
    if (!WalrusClient || !SuiClient || !getFullnodeUrl) {
      console.log('[walrus-manager] Walrus SDK components not available');
      return;
    }

    try {
      console.log('[walrus-manager] Initializing Walrus SDK...');
      
      // Create SuiClient - use testnet by default
      if (!this.suiClient) {
        this.suiClient = new SuiClient({
          url: getFullnodeUrl('testnet'),
        });
      }

      // Initialize WalrusClient
      this.walrusClient = new WalrusClient({
        suiClient: this.suiClient,
        network: 'testnet',
      });

      console.log('[walrus-manager] Walrus SDK client initialized successfully');

    } catch (error) {
      console.error('[walrus-manager] Failed to initialize Walrus SDK:', error);
      // Degradation to HTTP API
      console.log('[walrus-manager] Falling back...');
    }
  }

  /**
   * Initialize Seal SDK
   */
  private async initializeSealSDK(): Promise<void> {
    if (!this.config.sealSDKOptions || !SealClient || !isSealSDKAvailable) {
      console.log('[walrus-manager] Seal SDK not available, skipping initialization');
      return;
    }

    try {
      console.log('[walrus-manager] Initializing Seal SDK...');
      
      // Create SuiClient for Seal operations
      if (!this.suiClient) {
        this.suiClient = new SuiClient({
          url: getFullnodeUrl('testnet'),
        });
      }

      // Get allowlisted key servers for testnet (use your own key servers in production)
      const allowlistedServers = getAllowlistedKeyServers('testnet');
      
      // Create Seal client
      this.sealClient = new SealClient({
        suiClient: this.suiClient,
        serverConfigs: allowlistedServers.map((objectId: string) => ({
          objectId,
          weight: 1, // Equal weight for all servers
        })),
        verifyKeyServers: false, // Set to true for production for security
      });

      console.log('[walrus-manager] Seal SDK client initialized successfully');
      console.log('[walrus-manager] Key servers configured:', allowlistedServers.length);

    } catch (error) {
      console.error('[walrus-manager] Failed to initialize Seal SDK:', error);
      // Degradation to AES-GCM
      console.log('[walrus-manager] Falling back...');
    }
  }

  /**
   * Create and initialize a session key for Seal operations
   */
  async createSessionKey(options: SessionKeyOptions): Promise<any> {
    if (!isSealSDKAvailable || !SessionKey) {
      throw new Error('Seal SDK not available for session key creation');
    }

    try {
      console.log('[walrus-manager] Creating session key with Seal SDK...');
      
      // Create session key
      const sessionKey = await SessionKey.create({
        address: options.address,
        packageId: options.packageId,
        ttlMin: options.ttlMin || 10, // Default 10 minutes
        suiClient: options.suiClient || this.suiClient,
      });

      if (this.config.cacheSession) {
        this.sessionKey = sessionKey;
      }

      console.log('[walrus-manager] Session key created successfully');
      console.log('[walrus-manager] TTL:', options.ttlMin || 10, 'minutes');

      return sessionKey;

    } catch (error) {
      console.error('[walrus-manager] Failed to create session key:', error);
      throw error;
    }
  }

  /**
   * Store account data with encryption method selection
   */
  async storeAccount(data: AccountData, userKey: string): Promise<SealedAccountData> {
    console.log('[walrus-manager] Starting account storage for user:', data.metadata.userId);
    await this.initialize();

    try {
      let sealedData: string;
      let encryptionMethod: string;

      // Select encryption method based on configuration and availability
      if (this.shouldUseSealEncryption()) {
        // seal encryption using official SDK
        console.log('[walrus-manager] Using Seal encryption...');
        const result = await this.encryptWithSeal(data, userKey);
        sealedData = result.encryptedData;
        encryptionMethod = 'seal';
      } else {
        // AES-GCM encryption (default for now as sui blockchain is not yet integrated)
        console.log('[walrus-manager] Using AES-GCM encryption...');
        sealedData = await sealDataAESGCM(data, userKey);
        encryptionMethod = 'aes-gcm';
      }

      // Store using best available method with automatic fallback
      let storeResult: any;
      let blobId: string;
      
      if (this.walrusClient && this.config.preferOfficialSDK) {
        try {
          console.log('[walrus-manager] Attempting storage with Walrus SDK...');
          storeResult = await this.storeWithWalrusSDK(sealedData);
          blobId = storeResult.newlyCreated?.blobObject?.blobId || storeResult.alreadyCertified?.blobId;
          console.log('[walrus-manager] Walrus SDK storage successful, blobId:', blobId);
        } catch (sdkError) {
          console.warn('[walrus-manager] Walrus SDK failed, falling back to HTTP API:', sdkError);
          storeResult = await this.storeWithHTTPAPI(sealedData);
          blobId = storeResult.newlyCreated?.blobObject?.blobId || storeResult.alreadyCertified?.blobId;
          console.log('[walrus-manager] HTTP API fallback successful, blobId:', blobId);
        }
      } else {
        console.log('[walrus-manager] Using HTTP API for storage...');
        storeResult = await this.storeWithHTTPAPI(sealedData);
        blobId = storeResult.newlyCreated?.blobObject?.blobId || storeResult.alreadyCertified?.blobId;
        console.log('[walrus-manager] HTTP API storage successful, blobId:', blobId);
      }

      // Create SealedAccountData response
      const sealedAccountData: SealedAccountData = {
        sealedData,
        blobId,
        metadata: {
          userId: data.metadata.userId,
          createdAt: data.metadata.createdAt,
          lastUpdated: new Date().toISOString(),
          version: data.metadata.version,
        },
      };
      
      console.log(`[walrus-manager] Account stored successfully:`, {
        userId: sealedAccountData.metadata.userId,
        blobId: sealedAccountData.blobId,
        size: sealedData.length,
        encryption: encryptionMethod,
        storageMethod: this.walrusClient && this.config.preferOfficialSDK ? 'walrus-sdk' : 'http-api'
      });
      
      return sealedAccountData;

    } catch (error) {
      console.error('[walrus-manager] Failed to store account:', error);
      throw error;
    }
  }

  /**
   * Retrieve account data with automatic decryption method detection
   */
  async retrieveAccount(blobId: string, userKey: string): Promise<AccountData> {
    await this.initialize();

    try {
      // Retrieve sealed data with automatic fallback
      let sealedData: string;
      
      if (this.walrusClient && this.config.preferOfficialSDK) {
        try {
          console.log('[walrus-manager] Attempting retrieval with Walrus SDK...');
          sealedData = await this.retrieveWithWalrusSDK(blobId);
          console.log('[walrus-manager] Walrus SDK retrieval successful');
        } catch (sdkError) {
          console.warn('[walrus-manager] Walrus SDK failed, falling back to HTTP API:', sdkError);
          sealedData = await this.retrieveWithHTTPAPI(blobId);
          console.log('[walrus-manager] HTTP API fallback successful');
        }
      } else {
        console.log('[walrus-manager] Using HTTP API for retrieval...');
        sealedData = await this.retrieveWithHTTPAPI(blobId);
        console.log('[walrus-manager] HTTP API retrieval successful');
      }

      // Attempt decryption with available methods
      return await this.decryptAccountData(sealedData, userKey);

    } catch (error) {
      console.error('[walrus-manager] Failed to retrieve account:', error);
      throw error;
    }
  }

  // Vault management methods

  /**
   * Store raw string data in Walrus (for vault and other non-account data) with retry logic
   */
  async storeString(data: string, maxRetries: number = 1): Promise<string> {
    console.log('[walrus-manager] Storing string data in Walrus');
    await this.initialize();

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[walrus-manager] Attempt ${attempt}/${maxRetries} to store string`);
        
        // Try Walrus SDK first, then HTTP API fallback
        let storeResult: any;
        let blobId: string;
        
        if (this.walrusClient && this.config.preferOfficialSDK) {
          try {
            console.log('[walrus-manager] Storing string with Walrus SDK...');
            storeResult = await this.storeWithWalrusSDK(data);
            blobId = storeResult.newlyCreated?.blobObject?.blobId || storeResult.alreadyCertified?.blobId;
            console.log('[walrus-manager] Walrus SDK store successful, blobId:', blobId);
          } catch (sdkError) {
            console.warn('[walrus-manager] Walrus SDK failed, falling back to HTTP API:', sdkError);
            storeResult = await this.storeWithHTTPAPI(data);
            blobId = storeResult.newlyCreated?.blobObject?.blobId || storeResult.alreadyCertified?.blobId;
            console.log('[walrus-manager] HTTP API store successful, blobId:', blobId);
          }
        } else {
          console.log('[walrus-manager] Storing string with HTTP API...');
          storeResult = await this.storeWithHTTPAPI(data);
          blobId = storeResult.newlyCreated?.blobObject?.blobId || storeResult.alreadyCertified?.blobId;
          console.log('[walrus-manager] HTTP API store successful, blobId:', blobId);
        }

        if (!blobId) {
          throw new Error('Failed to get blob ID from Walrus response');
        }

        console.log(`[walrus-manager] String stored successfully: ${blobId} (${data.length} chars)`);
        return blobId;

      } catch (error) {
        lastError = error as Error;
        console.error(`[walrus-manager] Attempt ${attempt}/${maxRetries} failed:`, error);
        
        if (attempt < maxRetries) {
          // Reduced wait time for faster fallback
          const waitTime = 1000; // Just 1 second
          console.log(`[walrus-manager] Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    console.error('[walrus-manager] All store attempts failed, switching to local fallback');
    
    // Try local fallback as last resort
    try {
      return await this.useServerFallback('store', data);
    } catch (fallbackError) {
      console.error('[walrus-manager] Local fallback also failed:', fallbackError);
      throw new Error(`Failed to store data after ${maxRetries} attempts. Last error: ${lastError?.message}`);
    }
  }  /**
   * Retrieve raw string data from Walrus (for vault and other non-account data) with retry logic
   */
  async retrieveString(blobId: string, maxRetries: number = 1): Promise<string> {
    console.log('[walrus-manager] Retrieving string data from Walrus:', blobId);
    await this.initialize();

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[walrus-manager] Attempt ${attempt}/${maxRetries} to retrieve string`);
        
        let blobData: string;
        
        if (this.walrusClient && this.config.preferOfficialSDK) {
          try {
            console.log('[walrus-manager] Retrieving string with Walrus SDK...');
            blobData = await this.retrieveWithWalrusSDK(blobId);
            console.log('[walrus-manager] Walrus SDK retrieve successful');
          } catch (sdkError) {
            console.warn('[walrus-manager] Walrus SDK failed, falling back to HTTP API:', sdkError);
            const response = await this.performHTTPRetrieve(blobId);
            blobData = response.data;
            console.log('[walrus-manager] HTTP API retrieve successful');
          }
        } else {
          console.log('[walrus-manager] Retrieving string with HTTP API...');
          const response = await this.performHTTPRetrieve(blobId);
          blobData = response.data;
          console.log('[walrus-manager] HTTP API retrieve successful');
        }

        console.log(`[walrus-manager] String retrieved successfully: ${blobId} (${blobData.length} chars)`);
        return blobData;

      } catch (error) {
        lastError = error as Error;
        console.error(`[walrus-manager] Attempt ${attempt}/${maxRetries} failed:`, error);
        
        if (attempt < maxRetries) {
          // Reduced wait time for faster fallback
          const waitTime = 1000; // Just 1 second
          console.log(`[walrus-manager] Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    console.error('[walrus-manager] All retrieve attempts failed, trying local fallback');
    
    // Try local fallback as last resort
    try {
      return await this.useServerFallback('retrieve', undefined, blobId);
    } catch (fallbackError) {
      console.error('[walrus-manager] Local fallback also failed:', fallbackError);
      throw new Error(`Failed to retrieve data after ${maxRetries} attempts. Last error: ${lastError?.message}`);
    }
  }


  /**
   * Encrypt data using official Seal SDK
   */
  private async encryptWithSeal(data: AccountData, userKey: string): Promise<{ encryptedData: string; backupKey?: string }> {
    if (!this.sealClient || !isSealSDKAvailable) {
      throw new Error('Official Seal SDK client not initialized');
    }

    try {
      console.log('[walrus-manager] Encrypting data with official Seal SDK...');

      const dataBytes = new TextEncoder().encode(JSON.stringify(data));
      
      // Use the official Seal SDK encrypt method
      const encryptResult = await this.sealClient.encrypt({
        threshold: this.config.sealThreshold || 2,
        packageId: this.config.sealPackageId,
        id: userKey, // Use user key as the identity ID
        data: dataBytes,
      });

      // Convert encrypted object to base64 for consistent storage format
      const encryptedData = Buffer.from(encryptResult.encryptedObject).toString('base64');

      console.log('[walrus-manager] Data encrypted with official Seal SDK');
      console.log('[walrus-manager] Threshold:', this.config.sealThreshold || 2);
      console.log('[walrus-manager] Package ID:', this.config.sealPackageId);

      return {
        encryptedData,
        backupKey: encryptResult.key
      };

    } catch (error) {
      console.error('[walrus-manager] Official Seal encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt account data using available methods
   */
  private async decryptAccountData(sealedData: string, userKey: string): Promise<AccountData> {
    // Try Seal decryption first if available and configured
    if (this.shouldUseSealEncryption() && this.sessionKey) {
      try {
        return await this.decryptWithSeal(sealedData, userKey);
      } catch (error) {
        console.warn('[walrus-manager] Seal decryption failed, trying AES-GCM:', error);
      }
    }

    // Fallback to AES-GCM decryption
    return await unsealDataAESGCM(sealedData, userKey);
  }

  /**
   * Decrypt data using official Seal SDK
   */
  private async decryptWithSeal(encryptedData: string, userKey: string): Promise<AccountData> {
    if (!this.sealClient || !this.sessionKey || !isSealSDKAvailable) {
      throw new Error('Official Seal SDK client or session key not available');
    }

    try {
      console.log('[walrus-manager] Decrypting data with official Seal SDK...');
      
      const encryptedBytes = Buffer.from(encryptedData, 'base64');
      
      // In a real implementation, you would need:
      // 1. A Move contract with seal_approve* functions
      // 2. A proper transaction to call those functions
      // 3. The transaction bytes for verification
      
      // a placeholder approach is used for now
      // This would need to be replaced with actual transaction logic
      console.log('[walrus-manager] Seal decryption requires Move contract integration');
      console.log('[walrus-manager] Falling back to AES-GCM for development');

      // In production, this would be something like:
      // const decryptedBytes = await this.sealClient.decrypt({
      //   data: encryptedBytes,
      //   sessionKey: this.sessionKey,
      //   txBytes: yourTransactionBytes, // Transaction calling seal_approve*
      // });
      
      throw new Error('Seal decryption requires proper Move contract setup - use AES-GCM fallback');
      
    } catch (error) {
      console.error('[walrus-manager] Official Seal decryption failed:', error);
      throw error;
    }
  }

  /**
   * Store data using official Walrus SDK
   */
  private async storeWithWalrusSDK(data: string): Promise<WalrusStoreResponse> {
    if (!this.walrusClient) {
      throw new Error('Walrus SDK client not initialized');
    }

    try {
      console.log('[walrus-manager] Storing data with official Walrus SDK...');

      // Convert string data to Uint8Array as required by the SDK
      const dataBytes = new TextEncoder().encode(data);
      
      // Use the official Walrus SDK store method
      const result = await this.walrusClient.store({
        data: dataBytes,
        epochs: this.config.epochs || 1,
        force: false, // Don't force store if blob already exists
      });

      console.log('[walrus-manager] Walrus SDK storage successful');
      console.log('[walrus-manager] Blob ID:', result.blobId);
      console.log('[walrus-manager] Size:', result.size);

      // Convert to standard WalrusStoreResponse format
      return {
        newlyCreated: {
          blobObject: {
            id: result.objectId || result.blobId,
            storedEpoch: result.storedEpoch || 0,
            blobId: result.blobId,
            size: result.size,
            erasureCodeType: 'ReedSolomon',
            certifiedEpoch: result.certifiedEpoch || 0,
            storage: {
              id: result.objectId || result.blobId,
              startEpoch: result.startEpoch || 0,
              endEpoch: result.endEpoch || (result.startEpoch || 0) + (this.config.epochs || 1),
              storageSize: result.size,
            }
          }
        }
      };

    } catch (error) {
      console.error('[walrus-manager] Walrus SDK storage failed:', error);
      throw error;
    }
  }

  /**
   * Retrieve data using official Walrus SDK
   */
  private async retrieveWithWalrusSDK(blobId: string): Promise<string> {
    if (!this.walrusClient) {
      throw new Error('Walrus SDK client not initialized');
    }

    try {
      console.log('[walrus-manager] Retrieving data with official Walrus SDK...');
      console.log('[walrus-manager] Blob ID:', blobId);

      // Use the official Walrus SDK read method
      const result = await this.walrusClient.read({
        blobId: blobId,
      });

      if (!result || !result.data) {
        throw new Error(`Blob not found or empty: ${blobId}`);
      }

      // Convert Uint8Array back to string
      const dataString = new TextDecoder().decode(result.data);

      console.log('[walrus-manager] Walrus SDK retrieval successful');
      console.log('[walrus-manager] Retrieved size:', dataString.length, 'characters');

      return dataString;

    } catch (error) {
      console.error('[walrus-manager] Walrus SDK retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Store data using HTTP API fallback
   */
  private async storeWithHTTPAPI(data: string): Promise<WalrusStoreResponse> {
    // Use the existing HTTP API implementation
    return await this.performHTTPStore(data);
  }

  /**
   * Retrieve data using HTTP API fallback
   */
  private async retrieveWithHTTPAPI(blobId: string): Promise<string> {
    // Use the existing HTTP API implementation
    const response = await this.performHTTPRetrieve(blobId);
    return response.data;
  }

  /**
   * Determine if official Seal encryption should be used
   */
  private shouldUseSealEncryption(): boolean {
    // Check official Seal SDK availability
    if (!isSealSDKAvailable || !this.config.useSealEncryption) {
      return false;
    }

    // Check if Seal client is properly initialized
    if (!this.sealClient) {
      return false;
    }

    // Check configuration preference
    if (this.config.encryptionMethod === 'seal') {
      return true;
    }

    if (this.config.encryptionMethod === 'auto') {
      // In auto mode, use Seal only if properly configured
      return !!this.config.sealPackageId;
    }

    return false;
  }

  /**
   * HTTP API implementation
   */
  private async performHTTPStore(data: string): Promise<WalrusStoreResponse> {
    try {
      // Reduced timeout to 10 seconds for faster fallback
      const timeoutPromise = new Promise<Response>((_, reject) => {
        setTimeout(() => reject(new Error('Walrus upload timeout')), 10000);
      });
      
      const fetchPromise = fetch(`${this.config.publisherUrl}/v1/store?epochs=${this.config.epochs}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: data,
      });

      console.log('[walrus-manager] Starting HTTP upload with 10s timeout...');
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      console.log('[walrus-manager] HTTP Response received, status:', response.status);

      if (!response.ok) {
        console.error('[walrus-manager] HTTP store failed');
        throw new Error(`Walrus store failed: ${response.status} ${response.statusText}`);
      }

      const result: WalrusStoreResponse = await response.json();
      console.log('[walrus-manager] Walrus store response:', result);

      return result;

    } catch (error) {
      console.error('[walrus-manager] HTTP store failed');
      throw error;
    }
  }

  /**
   * HTTP API retrieval implementation
   */
  private async performHTTPRetrieve(blobId: string): Promise<WalrusReadResponse> {
    try {
      // Reduced timeout to 10 seconds for faster fallback
      const timeoutPromise = new Promise<Response>((_, reject) => {
        setTimeout(() => reject(new Error('Walrus download timeout')), 10000);
      });
      
      const fetchPromise = fetch(`${this.config.aggregatorUrl}/v1/${blobId}`);
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (!response.ok) {
        console.error('[walrus-manager] HTTP retrieve failed:', response.status, response.statusText);
        throw new Error(`Walrus retrieve failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.text();
      console.log('[walrus-manager] Retrieved sealed data via HTTP, size:', data.length, 'chars');
      
      return {
        data,
        metadata: {
          blobId,
          size: data.length,
          storedEpoch: 0
        }
      };

    } catch (error) {
      console.error('[walrus-manager] HTTP retrieve failed:', error);
      throw error;
    }
  }

  /**
   * Update account data with fallback support
   */
  async updateAccount(
    existingBlobId: string, 
    updatedAccountData: AccountData, 
    userKey: string
  ): Promise<SealedAccountData> {
    console.log('[walrus-manager] Updating account data, existing blobId:', existingBlobId);

    // Update the metadata
    updatedAccountData.metadata.lastLogin = new Date().toISOString();
    updatedAccountData.metadata.version = `v${Date.now()}`;
    
    // For now, treat updates as new stores (Walrus is immutable)
    // In production, you might want to track blob history
    return await this.storeAccount(updatedAccountData, userKey);
  }

  /**
   * Local storage fallback for when Walrus is unavailable
   */
  private async useServerFallback(operation: 'store' | 'retrieve', data?: string, blobId?: string): Promise<string> {
    console.log('[walrus-manager] Using local storage fallback for:', operation);
    
    if (operation === 'store' && data) {
      try {
        // Use the enhanced LocalStorageFallback utility
        // We need a user key for encryption - use a derived key from the data itself for now
        const fallbackUserKey = await this.deriveKeyFromData(data);
        const fallbackId = await LocalStorageFallback.store(data, fallbackUserKey, 'vault');
        
        console.log('[walrus-manager] Data stored in encrypted localStorage fallback:', fallbackId);
        return fallbackId;
        
      } catch (localStorageError) {
        console.error('[walrus-manager] Enhanced localStorage fallback failed:', localStorageError);
        
        // Fallback to simple localStorage if the enhanced version fails
        const fallbackId = `vault-${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(fallbackId, data);
          console.log('[walrus-manager] Data stored in simple localStorage fallback:', fallbackId);
          return fallbackId;
        } else {
          // Last resort: server memory
          if (typeof globalThis !== 'undefined') {
            if (!(globalThis as any).walrusFallbackStorage) {
              (globalThis as any).walrusFallbackStorage = new Map();
            }
            (globalThis as any).walrusFallbackStorage.set(fallbackId, data);
            console.log('[walrus-manager] Data stored in server memory fallback:', fallbackId);
            return fallbackId;
          }
        }
        
        throw new Error('All fallback storage methods failed');
      }
      
    } else if (operation === 'retrieve' && blobId) {
      try {
        // Try enhanced LocalStorageFallback first (support both old and new prefixes)
        if (blobId.includes('vault-')) {
          const fallbackUserKey = await this.deriveKeyFromId(blobId);
          const data = await LocalStorageFallback.retrieve(blobId, fallbackUserKey);
          console.log('[walrus-manager] Data retrieved from encrypted localStorage fallback');
          return data;
        }
        
        // Try simple localStorage fallback
        if (typeof window !== 'undefined' && window.localStorage) {
          const data = localStorage.getItem(blobId);
          if (data) {
            console.log('[walrus-manager] Data retrieved from simple localStorage fallback');
            return data;
          }
        }
        
        // Try server memory fallback
        if (typeof globalThis !== 'undefined' && (globalThis as any).walrusFallbackStorage) {
          const data = (globalThis as any).walrusFallbackStorage.get(blobId);
          if (data) {
            console.log('[walrus-manager] Data retrieved from server memory fallback');
            return data;
          }
        }
        
        throw new Error(`Fallback data not found for ID: ${blobId}`);
        
      } catch (retrieveError) {
        console.error('[walrus-manager] All fallback retrieve methods failed:', retrieveError);
        throw new Error(`Failed to retrieve fallback data: ${retrieveError}`);
      }
    }
    
    throw new Error(`Invalid fallback operation: ${operation}`);
  }
  
  /**
   * Derive a key from data for fallback encryption
   */
  private async deriveKeyFromData(data: string): Promise<string> {
    // Create a simple deterministic key from data hash
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data.substring(0, 100)); // Use first 100 chars
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
  }
  
  /**
   * Derive a key from fallback ID for retrieval
   */
  private async deriveKeyFromId(fallbackId: string): Promise<string> {
    // Extract timestamp and random part to recreate key
    const parts = fallbackId.split('_');
    if (parts.length >= 4) {
      const seed = parts[2] + parts[3]; // timestamp + random
      return this.deriveKeyFromData(seed);
    }
    
    // Fallback key
    return 'fallback_default_key_' + fallbackId.substring(0, 16);
  }

  /**
   * Health check for the enhanced manager
   * Development-friendly version with graceful fallback
   */
  async isAvailable(): Promise<boolean> {
    // For development purposes, we can disable external connectivity checks
    const DISABLE_WALRUS_IN_DEV = process.env.NODE_ENV === 'development' && process.env.WALRUS_ENABLED !== 'true';
    
    if (DISABLE_WALRUS_IN_DEV) {
      console.log('[walrus-manager] Walrus disabled in development mode');
      console.log('[walrus-manager] Set WALRUS_ENABLED=true to enable Walrus in dev');
      return false;
    }

    try {
      await this.initialize();

      console.log('[walrus-manager] Health check - Testing Walrus connectivity...');
      console.log('[walrus-manager] Aggregator URL:', this.config.aggregatorUrl);

      // Try a simple health check via HTTP with timeout for dev
      const timeoutPromise = new Promise<Response>((_, reject) => {
        setTimeout(() => reject(new Error('Health check timeout')), 30000);
      });
      
      const fetchPromise = fetch(`${this.config.aggregatorUrl}/v1/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'GreenVault-WalrusClient/1.0'
        }
      });
      
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (response.ok) {
        console.log('[walrus-manager] Walrus devnet is available and healthy');
        return true;
      } else {
        console.log('[walrus-manager] Walrus devnet returned status:', response.status);
        return false;
      }
    } catch (error) {
      console.log('[walrus-manager] Health check failed:', error);
      console.log('[walrus-manager] Using server fallback');
      return false;
    }
  }
  /**
   * Get manager status and capabilities with official SDK information
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      sdkAvailability: {
        walrusSDK: isWalrusSDKAvailable,
        sealSDK: isSealSDKAvailable,
        suiSDK: isSuiSDKAvailable,
      },
      clientStatus: {
        walrusClient: !!this.walrusClient,
        sealClient: !!this.sealClient,
        suiClient: !!this.suiClient,
        sessionKey: !!this.sessionKey,
      },
      configuration: {
        preferOfficialSDK: this.config.preferOfficialSDK,
        useSealEncryption: this.config.useSealEncryption,
        encryptionMethod: this.config.encryptionMethod,
        sealThreshold: this.config.sealThreshold,
        sealPackageId: this.config.sealPackageId,
      },
      capabilities: {
        walrusStorage: isWalrusSDKAvailable || true, // HTTP API always available
        sealEncryption: isSealSDKAvailable && !!this.config.sealPackageId,
        sessionKeys: isSealSDKAvailable,
        fallbackEncryption: true, // AES-GCM always available
      }
    };
  }
}

// Default configuration for devnet
export const enhancedWalrusConfig: EnhancedWalrusConfig = {
  aggregatorUrl: 'https://aggregator-devnet.walrus.space',
  publisherUrl: 'https://publisher-devnet.walrus.space',
  epochs: 1,
  preferOfficialSDK: true, // Now enabled - official SDK is implemented and working
  useSealEncryption: false, // Disabled by default as it requires Move contract setup
  encryptionMethod: 'aes-gcm', // Use AES-GCM for now
  sealThreshold: 2,
  reuseClients: true,
  cacheSession: true,
  batchOperations: true,
  // Seal options would be configured when ready to use
  sealSDKOptions: undefined,
};

// Create and export enhanced manager instance
export const enhancedWalrusManager = new EnhancedWalrusAccountManager(enhancedWalrusConfig);
