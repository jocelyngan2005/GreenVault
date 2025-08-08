import { NextRequest, NextResponse } from 'next/server';
import { enhancedWalrusManager } from '@/lib/walrus/manager';
import { serverAccountManager } from '@/lib/walrus/server-manager';

export async function POST(request: NextRequest) {
  try {
    console.log('[walrus-store] Storing account data...');
    
    const { accountData, userKey } = await request.json();

    if (!accountData || !userKey) {
      return NextResponse.json(
        { success: false, error: 'Missing accountData or userKey' },
        { status: 400 }
      );
    }

    let sealedAccountData;
    let storageType = 'unknown';

    try {
      if (await enhancedWalrusManager.isAvailable()) {
        console.log('[walrus-store] Walrus is available, using Walrus storage...');
        sealedAccountData = await enhancedWalrusManager.storeAccount(accountData, userKey);
        storageType = 'walrus-enhanced';
        console.log('[walrus-store] Account stored in Walrus:', sealedAccountData.blobId);
      } else {
        console.log('[walrus-store] Walrus unavailable, using server storage fallback...');
        sealedAccountData = await serverAccountManager.storeAccount(accountData, userKey);
        storageType = 'server';
        console.log('[walrus-store] Account stored in server storage:', sealedAccountData.blobId);
      }
    } catch (walrusError) {
      console.error('[walrus-store] Walrus failed, falling back to server storage:', walrusError);
      sealedAccountData = await serverAccountManager.storeAccount(accountData, userKey);
      storageType = 'server-fallback';
      console.log('[walrus-store] Account stored in server storage (fallback):', sealedAccountData.blobId);
    }

    console.log('[walrus-store] Account stored successfully:', {
      userId: sealedAccountData.metadata.userId,
      blobId: sealedAccountData.blobId,
      storageType
    });

    return NextResponse.json({
      success: true,
      data: { ...sealedAccountData, storageType },
    });

  } catch (error) {
    console.error('[walrus-store] Failed to store account:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to store account',
      },
      { status: 500 }
    );
  }
}
