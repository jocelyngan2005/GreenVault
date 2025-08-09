import { NextRequest, NextResponse } from 'next/server';
import { vaultService } from '@/lib/vault/vault-service';

/**
 * Vault API Endpoints
 * 
 * POST /api/vault - Initialize a new vault for user
 * GET /api/vault?blobId=xxx&userKey=xxx - Get all credentials
 * PUT /api/vault - Add new credential
 * DELETE /api/vault - Remove credential
 */

// Initialize user vault
export async function POST(request: NextRequest) {
  try {
    const { userId, userKey } = await request.json();

    if (!userId || !userKey) {
      return NextResponse.json({
        success: false,
        message: 'userId and userKey are required'
      }, { status: 400 });
    }

    console.log('[vault-api] Initializing vault for user:', userId);

    const result = await vaultService.initializeUserVault(userId, userKey);

    return NextResponse.json({
      success: true,
      message: 'Vault initialized successfully',
      data: {
        blobId: result.blobId,
        isNew: result.isNew
      }
    }, { status: 201 });

  } catch (error) {
    console.error('[vault-api] Failed to initialize vault:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to initialize vault',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Get all credentials from vault
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blobId = searchParams.get('blobId');
    const userKey = searchParams.get('userKey');
    const search = searchParams.get('search');
    const favorite = searchParams.get('favorite');

    if (!blobId || !userKey) {
      return NextResponse.json({
        success: false,
        message: 'blobId and userKey are required'
      }, { status: 400 });
    }

    console.log('[vault-api] Retrieving credentials from vault:', blobId);

    let credentials;

    // Handle search queries
    if (search || favorite) {
      const query: any = {};
      if (search) {
        query.title = search;
      }
      if (favorite === 'true') {
        query.favorite = true;
      }
      credentials = await vaultService.searchCredentials(blobId, userKey, query);
    } else {
      credentials = await vaultService.getAllCredentials(blobId, userKey);
    }

    // Remove passwords from response for security (frontend will decrypt as needed)
    const safeCredentials = credentials.map(cred => ({
      ...cred,
      password: '***ENCRYPTED***'
    }));

    return NextResponse.json({
      success: true,
      message: 'Credentials retrieved successfully',
      data: {
        credentials: safeCredentials,
        count: credentials.length
      }
    }, { status: 200 });

  } catch (error) {
    console.error('[vault-api] Failed to retrieve credentials:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve credentials',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Add new credential
export async function PUT(request: NextRequest) {
  try {
    const { blobId, userKey, credential } = await request.json();

    if (!blobId || !userKey || !credential) {
      return NextResponse.json({
        success: false,
        message: 'blobId, userKey, and credential are required'
      }, { status: 400 });
    }

    if (!credential.title || !credential.username || !credential.password) {
      return NextResponse.json({
        success: false,
        message: 'credential.title, credential.username, and credential.password are required'
      }, { status: 400 });
    }

    console.log('[vault-api] Adding credential to vault:', {
      blobId,
      title: credential.title,
      username: credential.username
    });

    const result = await vaultService.addCredential(blobId, userKey, credential);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Credential added successfully',
        data: {
          entryId: result.entryId
        }
      }, { status: 201 });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to add credential'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[vault-api] Failed to add credential:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to add credential',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Remove credential
export async function DELETE(request: NextRequest) {
  try {
    const { blobId, userKey, entryId } = await request.json();

    if (!blobId || !userKey || !entryId) {
      return NextResponse.json({
        success: false,
        message: 'blobId, userKey, and entryId are required'
      }, { status: 400 });
    }

    console.log('[vault-api] Removing credential from vault:', {
      blobId,
      entryId
    });

    const result = await vaultService.removeCredential(blobId, userKey, entryId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Credential removed successfully'
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to remove credential'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[vault-api] Failed to remove credential:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to remove credential',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
