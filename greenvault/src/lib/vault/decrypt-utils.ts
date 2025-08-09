/**
 * Vault Secrets Decryption Utilities
 * Client-side utilities for decrypting vault secrets
 */

export interface DecryptSecretRequest {
  userId: string;
  userKey: string;
  secretId: string;
}

export interface DecryptAllSecretsRequest {
  userId: string;
  userKey: string;
  includePasswords?: boolean;
}

export interface DecryptedSecret {
  id: string;
  title: string;
  username: string;
  password?: string;
  category: string;
  notes?: string;
  url?: string;
  createdAt: string;
  lastModified: string;
  decryptedAt?: string;
}

export interface VaultDecryptionResult {
  success: boolean;
  data?: DecryptedSecret | DecryptedSecret[];
  error?: string;
}

/**
 * Decrypt a specific secret by ID
 */
export async function decryptSecret(params: DecryptSecretRequest): Promise<VaultDecryptionResult> {
  try {
    console.log('[vault-decrypt-util] Decrypting secret:', params.secretId);

    const response = await fetch('/api/vault/secrets/decrypt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const result = await response.json();

    if (!result.success) {
      console.error('[vault-decrypt-util] Failed to decrypt secret:', result.error);
      return {
        success: false,
        error: result.error
      };
    }

    console.log('[vault-decrypt-util] Secret decrypted successfully');
    return {
      success: true,
      data: result.data
    };

  } catch (error) {
    console.error('[vault-decrypt-util] Error decrypting secret:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to decrypt secret'
    };
  }
}

/**
 * Decrypt all secrets for a user
 */
export async function decryptAllSecrets(params: DecryptAllSecretsRequest): Promise<VaultDecryptionResult> {
  try {
    console.log('[vault-decrypt-util] Decrypting all secrets for user:', params.userId);

    const response = await fetch('/api/vault/secrets/decrypt-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const result = await response.json();

    if (!result.success) {
      console.error('[vault-decrypt-util] Failed to decrypt secrets:', result.error);
      return {
        success: false,
        error: result.error
      };
    }

    console.log('[vault-decrypt-util] All secrets decrypted successfully:', {
      count: result.data.totalSecrets
    });
    
    return {
      success: true,
      data: result.data.secrets
    };

  } catch (error) {
    console.error('[vault-decrypt-util] Error decrypting secrets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to decrypt secrets'
    };
  }
}

/**
 * Decrypt secrets with metadata (includes totals, timestamps, etc.)
 */
export async function decryptAllSecretsWithMetadata(params: DecryptAllSecretsRequest) {
  try {
    console.log('[vault-decrypt-util] Decrypting all secrets with metadata for user:', params.userId);

    const response = await fetch('/api/vault/secrets/decrypt-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const result = await response.json();

    if (!result.success) {
      console.error('[vault-decrypt-util] Failed to decrypt secrets with metadata:', result.error);
      return {
        success: false,
        error: result.error
      };
    }

    console.log('[vault-decrypt-util] All secrets with metadata decrypted successfully');
    return {
      success: true,
      data: result.data // Includes secrets, totalSecrets, decryptedAt, version, lastUpdated
    };

  } catch (error) {
    console.error('[vault-decrypt-util] Error decrypting secrets with metadata:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to decrypt secrets with metadata'
    };
  }
}

/**
 * Securely copy decrypted password to clipboard
 */
export async function copyPasswordToClipboard(secret: DecryptedSecret): Promise<boolean> {
  if (!secret.password) {
    console.warn('[vault-decrypt-util] No password to copy');
    return false;
  }

  try {
    await navigator.clipboard.writeText(secret.password);
    console.log('[vault-decrypt-util] Password copied to clipboard for:', secret.title);
    
    // Clear clipboard after 30 seconds for security
    setTimeout(() => {
      navigator.clipboard.writeText('').catch(err => 
        console.warn('[vault-decrypt-util] Failed to clear clipboard:', err)
      );
    }, 30000);
    
    return true;
  } catch (error) {
    console.error('[vault-decrypt-util] Failed to copy password to clipboard:', error);
    return false;
  }
}

/**
 * Generate a secure user key from password and salt
 */
export async function generateUserKey(password: string, salt?: string): Promise<string> {
  const actualSalt = salt || 'greenvault-default-salt';
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password + actualSalt);
  
  // Use Web Crypto API to create a strong key
  const hashBuffer = await crypto.subtle.digest('SHA-256', passwordData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  console.log('[vault-decrypt-util] User key generated');
  return hashHex;
}
