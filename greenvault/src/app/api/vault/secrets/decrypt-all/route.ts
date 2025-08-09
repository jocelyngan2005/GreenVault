import { NextRequest, NextResponse } from 'next/server';
import { vaultService } from '@/lib/vault/vault-service';
import { enhancedWalrusManager } from '@/lib/walrus/manager';
import { unsealStringAESGCM } from '@/lib/walrus/crypto';

export interface DecryptAllSecretsRequest {
  userId: string;
  userKey: string;
  includePasswords?: boolean; // Optional flag to include/exclude passwords
}

export interface DecryptedSecret {
  id: string;
  title: string;
  username: string;
  password?: string; // Optional based on includePasswords flag
  category: string;
  notes?: string;
  url?: string;
  createdAt: string;
  lastModified: string;
}

export interface DecryptAllSecretsResponse {
  success: boolean;
  data?: {
    secrets: DecryptedSecret[];
    totalSecrets: number;
    decryptedAt: string;
    version: string;
    lastUpdated: string;
  };
  error?: string;
}

// POST - Decrypt all secrets for a user
export async function POST(request: NextRequest) {
  try {
    const body: DecryptAllSecretsRequest = await request.json();
    const { userId, userKey, includePasswords = true } = body;

    if (!userId || !userKey) {
      return NextResponse.json({
        success: false,
        error: 'userId and userKey are required'
      }, { status: 400 });
    }

    console.log('[vault-decrypt-all] Decrypting all secrets for user:', userId, 'includePasswords:', includePasswords);

    // Get user's vault
    const vaultData = await vaultService.getUserVault(userId, userKey);
    
    if (!vaultData || !vaultData.secretsBlobId) {
      return NextResponse.json({
        success: true,
        data: {
          secrets: [],
          totalSecrets: 0,
          decryptedAt: new Date().toISOString(),
          version: '1.0',
          lastUpdated: new Date().toISOString()
        }
      });
    }

    // Retrieve encrypted secrets data with fallback handling
    let encryptedSecretsData: string;
    try {
      encryptedSecretsData = await enhancedWalrusManager.retrieveString(vaultData.secretsBlobId);
    } catch (retrievalError) {
      console.error('[vault-decrypt-all] Failed to retrieve secrets data:', retrievalError);
      return NextResponse.json({
        success: false,
        error: 'Failed to retrieve vault secrets'
      }, { status: 500 });
    }
    
    // Decrypt the secrets data
    let secretsData;
    try {
      secretsData = JSON.parse(await unsealStringAESGCM(encryptedSecretsData, userKey));
    } catch (decryptError) {
      console.error('[vault-decrypt-all] Failed to decrypt secrets data:', decryptError);
      return NextResponse.json({
        success: false,
        error: 'Failed to decrypt vault secrets. Invalid user key or corrupted data.'
      }, { status: 400 });
    }

    // Process secrets based on includePasswords flag
    const processedSecrets: DecryptedSecret[] = secretsData.secrets.map((secret: any) => {
      const processedSecret: DecryptedSecret = {
        id: secret.id,
        title: secret.title,
        username: secret.username,
        category: secret.category,
        notes: secret.notes,
        url: secret.url,
        createdAt: secret.createdAt,
        lastModified: secret.lastModified
      };

      // Only include password if requested
      if (includePasswords) {
        processedSecret.password = secret.password;
      }

      return processedSecret;
    });

    console.log('[vault-decrypt-all] All secrets decrypted successfully:', {
      userId,
      secretCount: processedSecrets.length,
      includePasswords
    });

    const response: DecryptAllSecretsResponse = {
      success: true,
      data: {
        secrets: processedSecrets,
        totalSecrets: processedSecrets.length,
        decryptedAt: new Date().toISOString(),
        version: secretsData.version,
        lastUpdated: secretsData.lastUpdated
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[vault-decrypt-all] Failed to decrypt secrets:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to decrypt secrets'
    }, { status: 500 });
  }
}
