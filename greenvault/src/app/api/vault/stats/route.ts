import { NextRequest, NextResponse } from 'next/server';
import { vaultService } from '@/lib/vault/vault-service';

/**
 * Vault Statistics API Endpoint
 * 
 * GET /api/vault/stats?blobId=xxx&userKey=xxx - Get vault statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blobId = searchParams.get('blobId');
    const userKey = searchParams.get('userKey');

    if (!blobId || !userKey) {
      return NextResponse.json({
        success: false,
        message: 'blobId and userKey are required'
      }, { status: 400 });
    }

    console.log('[vault-stats-api] Getting vault statistics:', blobId);

    const stats = await vaultService.getVaultStatistics(blobId, userKey);

    return NextResponse.json({
      success: true,
      message: 'Vault statistics retrieved successfully',
      data: stats
    }, { status: 200 });

  } catch (error) {
    console.error('[vault-stats-api] Failed to get statistics:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve vault statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    message: 'Method not allowed. Use GET to retrieve statistics.'
  }, { status: 405 });
}
