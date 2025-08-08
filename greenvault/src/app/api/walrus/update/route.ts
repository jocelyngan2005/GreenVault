import { NextRequest, NextResponse } from 'next/server';
import { enhancedWalrusManager } from '@/lib/walrus/manager';
import { serverAccountManager } from '@/lib/walrus/server-manager';

export async function PUT(request: NextRequest) {
  try {
    console.log('[walrus-update] Updating account data...');

    const { blobId, accountData, userKey } = await request.json();

    if (!blobId || !accountData || !userKey) {
      return NextResponse.json(
        { success: false, error: 'Missing blobId, accountData, or userKey' },
        { status: 400 }
      );
    }

    let updatedSealedData;
    let storageType = 'unknown';

    // Check if this is a server blob ID or should fallback to server storage
    if (blobId.startsWith('server-') || blobId.startsWith('local-')) {
      console.log('[walrus-update] Using server storage for update (detected server/local blob ID)');
      updatedSealedData = await serverAccountManager.updateAccount(blobId, accountData, userKey);
      storageType = 'server';
    } else {
      try {
        // Try Enhanced Walrus Manager first
        if (await enhancedWalrusManager.isAvailable()) {
          console.log('[walrus-update] Walrus is available, using Walrus storage for update...');
          updatedSealedData = await enhancedWalrusManager.updateAccount(blobId, accountData, userKey);
          storageType = 'walrus-enhanced';
          console.log('[walrus-update] Account updated in Walrus:', updatedSealedData.blobId);
        } else {
          console.log('[walrus-update] Walrus unavailable, using server storage fallback for update...');
          updatedSealedData = await serverAccountManager.updateAccount(blobId, accountData, userKey);
          storageType = 'server';
          console.log('[walrus-update] Account updated in server storage:', updatedSealedData.blobId);
        }
      } catch (walrusError) {
        console.error('[walrus-update] Walrus update failed, falling back to server storage:', walrusError);
        updatedSealedData = await serverAccountManager.updateAccount(blobId, accountData, userKey);
        storageType = 'server-fallback';
        console.log('[walrus-update] Account updated in server storage (fallback):', updatedSealedData.blobId);
      }
    }

    console.log('[walrus-update] Account updated successfully:', {
      userId: updatedSealedData.metadata.userId,
      oldBlobId: blobId,
      newBlobId: updatedSealedData.blobId,
      storageType
    });

    return NextResponse.json({
      success: true,
      data: { ...updatedSealedData, storageType },
    });

  } catch (error) {
    console.error('[walrus-update] Failed to update account:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update account',
      },
      { status: 500 }
    );
  }
}
