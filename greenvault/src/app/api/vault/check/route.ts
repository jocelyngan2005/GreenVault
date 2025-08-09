import { NextRequest, NextResponse } from 'next/server';
import { vaultService } from '@/lib/vault/vault-service';
import { findUserByEmail, findUserById } from '@/lib/zklogin/unifiedUserStore';
import { generateVaultKeyFromPassword } from '@/lib/vault/vault-auth';

/**
 * Vault Check API Endpoint
 * 
 * POST /api/vault/check - Check if user has vault, create if not
 */

export async function POST(request: NextRequest) {
  try {
    const { userId, userKey, authType = 'email' } = await request.json();

    if (!userId || !userKey) {
      return NextResponse.json({
        success: false,
        message: 'userId and userKey are required'
      }, { status: 400 });
    }

    console.log('[vault-check] Checking vault for user:', { userId, authType, userKey });

    // Find user to verify they exist
    let user;
    if (authType === 'email') {
      user = findUserByEmail(userId); // userId is email for email auth
    } else {
      user = findUserById(userId);
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Try to initialize vault - this will create a new vault if one doesn't exist
    const result = await vaultService.initializeUserVault(userId, userKey, authType);

    return NextResponse.json({
      success: true,
      message: result.isNew ? 'Vault created successfully' : 'Vault found',
      data: {
        blobId: result.blobId,
        isNew: result.isNew,
        userId: userId,
        initialized: true,
        timestamp: new Date().toISOString()
      }
    }, { status: 200 });

  } catch (error) {
    console.error('[vault-check] Failed to check/create vault:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to check/create vault',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
