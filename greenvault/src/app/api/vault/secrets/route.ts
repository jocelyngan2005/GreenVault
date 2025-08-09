import { NextRequest, NextResponse } from 'next/server';
import { vaultService } from '@/lib/vault/vault-service';
import { enhancedWalrusManager } from '@/lib/walrus/manager';
import { sealStringAESGCM, unsealStringAESGCM } from '@/lib/walrus/crypto';

export interface VaultSecret {
  id: string;
  title: string;
  username: string;
  password: string;
  category: string;
  notes?: string;
  url?: string;
  createdAt: string;
  lastModified: string;
}

export interface VaultSecretsData {
  secrets: VaultSecret[];
  version: string;
  lastUpdated: string;
}

// GET - Retrieve all secrets for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userKey = searchParams.get('userKey');

    if (!userId || !userKey) {
      return NextResponse.json({
        success: false,
        error: 'userId and userKey are required'
      }, { status: 400 });
    }

    console.log('[vault-secrets] Retrieving secrets for user:', userId);

    // Get user's vault blob ID, creating one if it doesn't exist
    let vaultData = await vaultService.getUserVault(userId, userKey);
    
    if (!vaultData || !vaultData.blobId) {
      // No vault exists yet, initialize one for the user
      console.log('[vault-secrets] No vault found, initializing new vault for user:', userId);
      const initResult = await vaultService.initializeUserVault(userId, userKey, 'email');
      
      if (!initResult || !initResult.blobId) {
        console.error('[vault-secrets] Failed to initialize vault for user:', userId);
        return NextResponse.json({
          success: false,
          error: 'Failed to initialize user vault'
        }, { status: 500 });
      }

      // Get the newly created vault data
      vaultData = await vaultService.getUserVault(userId, userKey);
    }
    
    if (!vaultData || !vaultData.secretsBlobId) {
      // No secrets stored yet
      return NextResponse.json({
        success: true,
        data: {
          secrets: [],
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
      console.error('[vault-secrets] Failed to retrieve secrets data:', retrievalError);
      
      // If we can't retrieve the secrets, return empty array but don't fail
      console.warn('[vault-secrets] Could not retrieve secrets data, returning empty array');
      return NextResponse.json({
        success: true,
        data: {
          secrets: [],
          version: '1.0',
          lastUpdated: new Date().toISOString()
        }
      });
    }
    
    // Decrypt the secrets data
    const secretsData: VaultSecretsData = JSON.parse(await unsealStringAESGCM(encryptedSecretsData, userKey));

    console.log('[vault-secrets] Retrieved secrets successfully:', {
      userId,
      secretCount: secretsData.secrets.length,
      version: secretsData.version
    });

    return NextResponse.json({
      success: true,
      data: secretsData
    });

  } catch (error) {
    console.error('[vault-secrets] Failed to retrieve secrets:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve secrets'
    }, { status: 500 });
  }
}

// POST - Add a new secret
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userKey, secret } = body;

    if (!userId || !userKey || !secret) {
      return NextResponse.json({
        success: false,
        error: 'userId, userKey, and secret are required'
      }, { status: 400 });
    }

    console.log('[vault-secrets] Adding new secret for user:', userId);

    // Validate secret data
    if (!secret.title || !secret.username || !secret.password) {
      return NextResponse.json({
        success: false,
        error: 'title, username, and password are required'
      }, { status: 400 });
    }

    // Get or create user's vault
    const vaultData = await vaultService.getUserVault(userId, userKey);
    
    let secretsData: VaultSecretsData;
    
    if (vaultData && vaultData.secretsBlobId) {
      // Retrieve existing secrets with fallback handling
      try {
        const encryptedSecretsData = await enhancedWalrusManager.retrieveString(vaultData.secretsBlobId);
        secretsData = JSON.parse(await unsealStringAESGCM(encryptedSecretsData, userKey));
        console.log('[vault-secrets] Retrieved existing secrets:', secretsData.secrets.length);
      } catch (retrievalError) {
        console.warn('[vault-secrets] Failed to retrieve existing secrets, starting fresh:', retrievalError);
        // Start with empty secrets data if we can't retrieve existing ones
        secretsData = {
          secrets: [],
          version: '1.0',
          lastUpdated: new Date().toISOString()
        };
      }
    } else {
      // Create new secrets data
      secretsData = {
        secrets: [],
        version: '1.0',
        lastUpdated: new Date().toISOString()
      };
      console.log('[vault-secrets] Creating new secrets data structure');
    }

    // Add new secret
    const newSecret: VaultSecret = {
      id: `secret_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: secret.title,
      username: secret.username,
      password: secret.password,
      category: secret.category || 'General',
      notes: secret.notes,
      url: secret.url,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    secretsData.secrets.push(newSecret);
    secretsData.lastUpdated = new Date().toISOString();

    // Encrypt and store updated secrets data with fallback handling
    let secretsBlobId: string;
    try {
      const newEncryptedSecretsData = await sealStringAESGCM(JSON.stringify(secretsData), userKey);
      secretsBlobId = await enhancedWalrusManager.storeString(newEncryptedSecretsData);
      console.log('[vault-secrets] Secrets data stored successfully:', secretsBlobId);
    } catch (storageError) {
      console.error('[vault-secrets] Failed to store secrets data:', storageError);
      return NextResponse.json({
        success: false,
        error: 'Failed to store secrets data'
      }, { status: 500 });
    }

    // Update vault with new secrets blob ID
    try {
      await vaultService.updateUserVault(userId, userKey, {
        ...vaultData,
        secretsBlobId,
        lastUpdated: new Date().toISOString()
      });
    } catch (updateError) {
      console.error('[vault-secrets] Failed to update vault registry:', updateError);
      // Don't fail the request if registry update fails, but log it
      console.warn('[vault-secrets] Registry update failed but secret was stored:', secretsBlobId);
    }

    console.log('[vault-secrets] Secret added successfully:', {
      userId,
      secretId: newSecret.id,
      secretCount: secretsData.secrets.length
    });

    return NextResponse.json({
      success: true,
      data: {
        secret: newSecret,
        totalSecrets: secretsData.secrets.length
      }
    });

  } catch (error) {
    console.error('[vault-secrets] Failed to add secret:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add secret'
    }, { status: 500 });
  }
}

// PUT - Update an existing secret
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userKey, secretId, updates } = body;

    if (!userId || !userKey || !secretId || !updates) {
      return NextResponse.json({
        success: false,
        error: 'userId, userKey, secretId, and updates are required'
      }, { status: 400 });
    }

    console.log('[vault-secrets] Updating secret for user:', userId, 'secretId:', secretId);

    // Get user's vault
    const vaultData = await vaultService.getUserVault(userId, userKey);
    
    if (!vaultData || !vaultData.secretsBlobId) {
      return NextResponse.json({
        success: false,
        error: 'No vault found for user'
      }, { status: 404 });
    }

    // Retrieve existing secrets
    const encryptedSecretsData = await enhancedWalrusManager.retrieveString(vaultData.secretsBlobId);
    const secretsData: VaultSecretsData = JSON.parse(await unsealStringAESGCM(encryptedSecretsData, userKey));

    // Find and update the secret
    const secretIndex = secretsData.secrets.findIndex(s => s.id === secretId);
    if (secretIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Secret not found'
      }, { status: 404 });
    }

    // Update the secret
    secretsData.secrets[secretIndex] = {
      ...secretsData.secrets[secretIndex],
      ...updates,
      lastModified: new Date().toISOString()
    };

    secretsData.lastUpdated = new Date().toISOString();

    // Encrypt and store updated secrets data
    const newEncryptedSecretsData = await sealStringAESGCM(JSON.stringify(secretsData), userKey);
    const secretsBlobId = await enhancedWalrusManager.storeString(newEncryptedSecretsData);

    // Update vault with new secrets blob ID
    await vaultService.updateUserVault(userId, userKey, {
      ...vaultData,
      secretsBlobId,
      lastUpdated: new Date().toISOString()
    });

    console.log('[vault-secrets] Secret updated successfully:', {
      userId,
      secretId,
      secretCount: secretsData.secrets.length
    });

    return NextResponse.json({
      success: true,
      data: {
        secret: secretsData.secrets[secretIndex],
        totalSecrets: secretsData.secrets.length
      }
    });

  } catch (error) {
    console.error('[vault-secrets] Failed to update secret:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update secret'
    }, { status: 500 });
  }
}

// DELETE - Delete a secret
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userKey = searchParams.get('userKey');
    const secretId = searchParams.get('secretId');

    if (!userId || !userKey || !secretId) {
      return NextResponse.json({
        success: false,
        error: 'userId, userKey, and secretId are required'
      }, { status: 400 });
    }

    console.log('[vault-secrets] Deleting secret for user:', userId, 'secretId:', secretId);

    // Get user's vault
    const vaultData = await vaultService.getUserVault(userId, userKey);
    
    if (!vaultData || !vaultData.secretsBlobId) {
      return NextResponse.json({
        success: false,
        error: 'No vault found for user'
      }, { status: 404 });
    }

    // Retrieve existing secrets
    const encryptedSecretsData = await enhancedWalrusManager.retrieveString(vaultData.secretsBlobId);
    const secretsData: VaultSecretsData = JSON.parse(await unsealStringAESGCM(encryptedSecretsData, userKey));

    // Find and remove the secret
    const secretIndex = secretsData.secrets.findIndex(s => s.id === secretId);
    if (secretIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Secret not found'
      }, { status: 404 });
    }

    const deletedSecret = secretsData.secrets[secretIndex];
    secretsData.secrets.splice(secretIndex, 1);
    secretsData.lastUpdated = new Date().toISOString();

    // Encrypt and store updated secrets data
    const newEncryptedSecretsData = await sealStringAESGCM(JSON.stringify(secretsData), userKey);
    const secretsBlobId = await enhancedWalrusManager.storeString(newEncryptedSecretsData);

    // Update vault with new secrets blob ID
    await vaultService.updateUserVault(userId, userKey, {
      ...vaultData,
      secretsBlobId,
      lastUpdated: new Date().toISOString()
    });

    console.log('[vault-secrets] Secret deleted successfully:', {
      userId,
      secretId,
      secretCount: secretsData.secrets.length
    });

    return NextResponse.json({
      success: true,
      data: {
        deletedSecret,
        totalSecrets: secretsData.secrets.length
      }
    });

  } catch (error) {
    console.error('[vault-secrets] Failed to delete secret:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete secret'
    }, { status: 500 });
  }
}
