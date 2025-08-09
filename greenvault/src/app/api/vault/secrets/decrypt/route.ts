import { NextRequest, NextResponse } from 'next/server';
import { vaultService } from '@/lib/vault/vault-service';
import { enhancedWalrusManager } from '@/lib/walrus/manager';
import { unsealStringAESGCM } from '@/lib/walrus/crypto';

export interface DecryptSecretRequest {
  userId: string;
  userKey: string;
  secretId: string;
}

export interface DecryptSecretResponse {
  success: boolean;
  data?: {
    id: string;
    title: string;
    username: string;
    password: string;
    category: string;
    notes?: string;
    url?: string;
    createdAt: string;
    lastModified: string;
    decryptedAt: string;
  };
  error?: string;
}

// POST - Decrypt a specific secret
export async function POST(request: NextRequest) {
  try {
    const body: DecryptSecretRequest = await request.json();
    const { userId, userKey, secretId } = body;

    if (!userId || !userKey || !secretId) {
      return NextResponse.json({
        success: false,
        error: 'userId, userKey, and secretId are required'
      }, { status: 400 });
    }

    console.log('[vault-decrypt] Decrypting secret for user:', userId, 'secretId:', secretId);

    // Get user's vault
    const vaultData = await vaultService.getUserVault(userId, userKey);
    
    if (!vaultData || !vaultData.secretsBlobId) {
      return NextResponse.json({
        success: false,
        error: 'No vault found for user'
      }, { status: 404 });
    }

    // Retrieve encrypted secrets data with fallback handling
    let encryptedSecretsData: string;
    try {
      encryptedSecretsData = await enhancedWalrusManager.retrieveString(vaultData.secretsBlobId);
    } catch (retrievalError) {
      console.error('[vault-decrypt] Failed to retrieve secrets data:', retrievalError);
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
      console.error('[vault-decrypt] Failed to decrypt secrets data:', decryptError);
      return NextResponse.json({
        success: false,
        error: 'Failed to decrypt vault secrets. Invalid user key or corrupted data.'
      }, { status: 400 });
    }

    // Find the specific secret
    const secret = secretsData.secrets.find((s: any) => s.id === secretId);
    if (!secret) {
      return NextResponse.json({
        success: false,
        error: 'Secret not found'
      }, { status: 404 });
    }

    console.log('[vault-decrypt] Secret decrypted successfully:', {
      userId,
      secretId,
      title: secret.title
    });

    const response: DecryptSecretResponse = {
      success: true,
      data: {
        ...secret,
        decryptedAt: new Date().toISOString()
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[vault-decrypt] Failed to decrypt secret:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to decrypt secret'
    }, { status: 500 });
  }
}
