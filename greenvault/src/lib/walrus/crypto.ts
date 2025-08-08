import { AccountData } from '@/types/walrus';
//import { VaultData } from '@/types/vault';

/**
 * Cryptographic configuration
 */
export const CRYPTO_CONFIG = {
  AES_GCM: {
    algorithm: 'AES-GCM' as const,
    keyLength: 256, // bits
    ivLength: 12,   // bytes (96 bits for GCM)
    tagLength: 16,  // bytes (128 bits)
  },
  KDF: {
    algorithm: 'PBKDF2' as const,
    iterations: 100000,
    saltLength: 16, // bytes
    hashFunction: 'SHA-256' as const,
  }
} as const;

/**
 * Derive encryption key from user key using PBKDF2
 */
async function deriveKey(userKey: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(userKey),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: CRYPTO_CONFIG.KDF.algorithm,
      salt: new Uint8Array(salt),
      iterations: CRYPTO_CONFIG.KDF.iterations,
      hash: CRYPTO_CONFIG.KDF.hashFunction,
    },
    keyMaterial,
    {
      name: CRYPTO_CONFIG.AES_GCM.algorithm,
      length: CRYPTO_CONFIG.AES_GCM.keyLength,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Seal account data using AES-GCM authenticated encryption
 */
export async function sealDataAESGCM(data: AccountData, userKey: string): Promise<string> {
  console.log('[walrus-crypto] Sealing account data...');
  console.log('[walrus-crypto] Account data for user:', data.metadata.userId);

  try {
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(CRYPTO_CONFIG.KDF.saltLength));
    const iv = crypto.getRandomValues(new Uint8Array(CRYPTO_CONFIG.AES_GCM.ivLength));
    
    // Derive encryption key
    const key = await deriveKey(userKey, salt);
    
    // Prepare data for encryption
    const jsonData = JSON.stringify(data);
    const dataBytes = new TextEncoder().encode(jsonData);
    
    // Encrypt with AES-GCM
    const encrypted = await crypto.subtle.encrypt(
      {
        name: CRYPTO_CONFIG.AES_GCM.algorithm,
        iv: iv,
      },
      key,
      dataBytes
    );
    
    // Combine salt + iv + encrypted data
    const encryptedBytes = new Uint8Array(encrypted);
    const combined = new Uint8Array(
      salt.length + iv.length + encryptedBytes.length
    );
    
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(encryptedBytes, salt.length + iv.length);
    
    const sealedData = btoa(String.fromCharCode(...combined));
    
    console.log('[walrus-crypto] Sealed data size:', sealedData.length, 'chars');
    console.log('[walrus-crypto] Encryption details:', {
      algorithm: CRYPTO_CONFIG.AES_GCM.algorithm,
      keyLength: CRYPTO_CONFIG.AES_GCM.keyLength,
      ivLength: CRYPTO_CONFIG.AES_GCM.ivLength,
      saltLength: CRYPTO_CONFIG.KDF.saltLength,
      iterations: CRYPTO_CONFIG.KDF.iterations,
    });
    console.log('[walrus-crypto] Data sealed successfully!');
    
    return sealedData;
  } catch (error) {
    console.error('[walrus-crypto] Failed to seal data:', error);
    throw new Error('Failed to seal account data with AES-GCM');
  }
}

/**
 * Unseal account data using AES-GCM authenticated decryption
 */
export async function unsealDataAESGCM(sealedData: string, userKey: string): Promise<AccountData> {
  console.log('[walrus-crypto] Unsealing account data...');

  try {
    // Decode base64 data
    const combined = new Uint8Array(
      atob(sealedData).split('').map(c => c.charCodeAt(0))
    );
    
    // Extract salt, IV, and encrypted data
    const saltLength = CRYPTO_CONFIG.KDF.saltLength;
    const ivLength = CRYPTO_CONFIG.AES_GCM.ivLength;
    
    const salt = combined.slice(0, saltLength);
    const iv = combined.slice(saltLength, saltLength + ivLength);
    const encryptedData = combined.slice(saltLength + ivLength);
    
    // Derive decryption key
    const key = await deriveKey(userKey, salt);
    
    // Decrypt with AES-GCM
    const decrypted = await crypto.subtle.decrypt(
      {
        name: CRYPTO_CONFIG.AES_GCM.algorithm,
        iv: iv,
      },
      key,
      encryptedData
    );
    
    // Parse decrypted data
    const jsonData = new TextDecoder().decode(decrypted);
    const data = JSON.parse(jsonData) as AccountData;

    console.log('[walrus-crypto] Account data for user:', data.metadata.userId);
    console.log('[walrus-crypto] Data unsealed successfully!');

    return data;
  } catch (error) {
    console.error('[walrus-crypto] Failed to unseal data:', error);

    // More specific error messages for debugging
    if (error instanceof DOMException) {
      if (error.name === 'OperationError') {
        throw new Error('Failed to decrypt data');
      }
      if (error.name === 'InvalidAccessError') {
        throw new Error('Invalid encryption parameters');
      }
    }
    
    throw new Error('Failed to unseal account data with AES-GCM');
  }
}

/**
 * Validate sealed data format for AES-GCM
 * Ensures the data has the expected structure: salt(16) + iv(12) + encrypted_data + auth_tag
 */
export function validateAESGCMFormat(sealedData: string): boolean {
  try {
    const combined = new Uint8Array(
      atob(sealedData).split('').map(c => c.charCodeAt(0))
    );
    
    // AES-GCM format should have at least: salt(16) + iv(12) + some_data + auth_tag(16) = 44+ bytes
    const minimumAESGCMLength = CRYPTO_CONFIG.KDF.saltLength + 
                                CRYPTO_CONFIG.AES_GCM.ivLength + 
                                CRYPTO_CONFIG.AES_GCM.tagLength + 
                                10; // minimum data length
    
    return combined.length >= minimumAESGCMLength;
  } catch {
    return false;
  }
}


// seal and unseal for vault


// /**
//  * Vault-specific encryption functions
//  */
// export async function sealVaultDataAESGCM(vaultData: VaultData, userKey: string): Promise<string> {
//   const dataString = JSON.stringify(vaultData);
//   const encoder = new TextEncoder();
//   const data = encoder.encode(dataString);

//   // Generate random salt and IV
//   const salt = crypto.getRandomValues(new Uint8Array(CRYPTO_CONFIG.KDF.saltLength));
//   const iv = crypto.getRandomValues(new Uint8Array(CRYPTO_CONFIG.AES_GCM.ivLength));

//   // Derive key from user key and salt
//   const key = await deriveKey(userKey, salt);

//   try {
//     // Encrypt data with AES-GCM
//     const encrypted = await crypto.subtle.encrypt(
//       {
//         name: CRYPTO_CONFIG.AES_GCM.algorithm,
//         iv: iv,
//         tagLength: CRYPTO_CONFIG.AES_GCM.tagLength * 8 // bits
//       },
//       key,
//       data
//     );

//     // Combine salt + iv + encrypted data (includes auth tag)
//     const encryptedArray = new Uint8Array(encrypted);
//     const combined = new Uint8Array(salt.length + iv.length + encryptedArray.length);
//     combined.set(salt, 0);
//     combined.set(iv, salt.length);
//     combined.set(encryptedArray, salt.length + iv.length);

//     // Return base64 encoded result
//     return btoa(String.fromCharCode.apply(null, Array.from(combined)));
//   } catch (error) {
//     console.error('[crypto] Vault encryption failed:', error);
//     throw new Error(`Vault encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
//   }
// }

// export async function unsealVaultDataAESGCM(sealedData: string, userKey: string): Promise<VaultData> {
//   try {
//     // Decode base64
//     const combined = new Uint8Array(
//       atob(sealedData).split('').map(c => c.charCodeAt(0))
//     );

//     // Extract components
//     const salt = combined.slice(0, CRYPTO_CONFIG.KDF.saltLength);
//     const iv = combined.slice(CRYPTO_CONFIG.KDF.saltLength, CRYPTO_CONFIG.KDF.saltLength + CRYPTO_CONFIG.AES_GCM.ivLength);
//     const encrypted = combined.slice(CRYPTO_CONFIG.KDF.saltLength + CRYPTO_CONFIG.AES_GCM.ivLength);

//     // Derive key from user key and salt
//     const key = await deriveKey(userKey, salt);

//     // Decrypt data
//     const decrypted = await crypto.subtle.decrypt(
//       {
//         name: CRYPTO_CONFIG.AES_GCM.algorithm,
//         iv: iv,
//         tagLength: CRYPTO_CONFIG.AES_GCM.tagLength * 8 // bits
//       },
//       key,
//       encrypted
//     );

//     const decoder = new TextDecoder();
//     const dataString = decoder.decode(decrypted);
//     const vaultData = JSON.parse(dataString) as VaultData;

//     return vaultData;
//   } catch (error) {
//     console.error('[crypto] Vault decryption failed:', error);
//     throw new Error(`Vault decryption failed: ${error instanceof Error ? error.message : 'Invalid password or corrupted data'}`);
//   }
// }

// /**
//  * Simple string encryption functions for individual secrets
//  */
// export async function sealStringAESGCM(data: string, userKey: string): Promise<string> {
//   const encoder = new TextEncoder();
//   const dataBytes = encoder.encode(data);

//   // Generate random salt and IV
//   const salt = crypto.getRandomValues(new Uint8Array(CRYPTO_CONFIG.KDF.saltLength));
//   const iv = crypto.getRandomValues(new Uint8Array(CRYPTO_CONFIG.AES_GCM.ivLength));

//   // Derive key from user key and salt
//   const key = await deriveKey(userKey, salt);

//   try {
//     // Encrypt data with AES-GCM
//     const encrypted = await crypto.subtle.encrypt(
//       {
//         name: CRYPTO_CONFIG.AES_GCM.algorithm,
//         iv: iv,
//         tagLength: CRYPTO_CONFIG.AES_GCM.tagLength * 8 // bits
//       },
//       key,
//       dataBytes
//     );

//     // Combine salt + iv + encrypted data (includes auth tag)
//     const encryptedArray = new Uint8Array(encrypted);
//     const combined = new Uint8Array(salt.length + iv.length + encryptedArray.length);
//     combined.set(salt, 0);
//     combined.set(iv, salt.length);
//     combined.set(encryptedArray, salt.length + iv.length);

//     // Return base64 encoded result
//     return btoa(String.fromCharCode.apply(null, Array.from(combined)));
//   } catch (error) {
//     console.error('[crypto] String encryption failed:', error);
//     throw new Error(`String encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
//   }
// }

// export async function unsealStringAESGCM(sealedData: string, userKey: string): Promise<string> {
//   try {
//     // Decode base64
//     const combined = new Uint8Array(
//       atob(sealedData).split('').map(c => c.charCodeAt(0))
//     );

//     // Extract components
//     const salt = combined.slice(0, CRYPTO_CONFIG.KDF.saltLength);
//     const iv = combined.slice(CRYPTO_CONFIG.KDF.saltLength, CRYPTO_CONFIG.KDF.saltLength + CRYPTO_CONFIG.AES_GCM.ivLength);
//     const encrypted = combined.slice(CRYPTO_CONFIG.KDF.saltLength + CRYPTO_CONFIG.AES_GCM.ivLength);

//     // Derive key from user key and salt
//     const key = await deriveKey(userKey, salt);

//     // Decrypt data
//     const decrypted = await crypto.subtle.decrypt(
//       {
//         name: CRYPTO_CONFIG.AES_GCM.algorithm,
//         iv: iv,
//         tagLength: CRYPTO_CONFIG.AES_GCM.tagLength * 8 // bits
//       },
//       key,
//       encrypted
//     );

//     const decoder = new TextDecoder();
//     return decoder.decode(decrypted);
//   } catch (error) {
//     console.error('[crypto] String decryption failed:', error);
//     throw new Error(`String decryption failed: ${error instanceof Error ? error.message : 'Invalid password or corrupted data'}`);
//   }
// }
