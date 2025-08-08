import { NextRequest, NextResponse } from 'next/server';
import { enhancedWalrusManager } from '@/lib/walrus/manager';
import { serverAccountManager } from '@/lib/walrus/server-manager';

export async function GET(request: NextRequest) {
  try {
    console.log('[walrus-retrieve] Retrieving account data...');
    
    const { searchParams } = new URL(request.url);
    const blobId = searchParams.get('blobId');
    const userKey = searchParams.get('userKey');

    if (!blobId || !userKey) {
      return NextResponse.json(
        { success: false, error: 'Missing blobId or userKey' },
        { status: 400 }
      );
    }

    let accountData;
    let storageType = 'unknown';

    // Check if this is a server blob ID
    if (blobId.startsWith('server-')) {
      console.log('[walrus-retrieve] Detected server blob ID, using server storage');
      accountData = await serverAccountManager.retrieveAccount(blobId, userKey);
      storageType = 'server';
    } else {
      // Try Enhanced Walrus Manager first
      try {
        console.log('[walrus-retrieve] Attempting retrieval...');
        accountData = await enhancedWalrusManager.retrieveAccount(blobId, userKey);
        storageType = 'walrus-enhanced';
        console.log('[walrus-retrieve] Account retrieved');
      } catch (walrusError) {
        console.error('[walrus-retrieve] Walrus retrieval failed, trying server storage fallback:', walrusError);
        accountData = await serverAccountManager.retrieveAccount(blobId, userKey);
        storageType = 'server-fallback';
        console.log('[walrus-retrieve] Account retrieved from server storage (fallback)');
      }
    }

    console.log('[walrus-retrieve] Account retrieved successfully:', {
      userId: accountData.metadata.userId,
      blobId,
      storageType
    });

    return NextResponse.json({
      success: true,
      data: { ...accountData, storageType },
    });

  } catch (error) {
    console.error('[walrus-retrieve] Failed to retrieve account:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve account',
      },
      { status: 500 }
    );
  }
}
