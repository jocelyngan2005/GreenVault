import { NextRequest, NextResponse } from 'next/server';
import { vaultService } from '@/lib/vault/vault-service';

/**
 * Vault Management API Endpoints
 * 
 * GET /api/vault/validate?blobId=xxx&userKey=xxx - Validate vault integrity
 * POST /api/vault/export - Export vault data
 */

// Validate vault integrity
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

    console.log('[vault-validate-api] Validating vault integrity:', blobId);

    const validation = await vaultService.validateVault(blobId, userKey);

    return NextResponse.json({
      success: true,
      message: 'Vault validation completed',
      data: {
        isValid: validation.isValid,
        issues: validation.issues,
        validationTime: new Date().toISOString()
      }
    }, { status: 200 });

  } catch (error) {
    console.error('[vault-validate-api] Failed to validate vault:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to validate vault',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Export vault data
export async function POST(request: NextRequest) {
  try {
    const { blobId, userKey, includePasswords = false } = await request.json();

    if (!blobId || !userKey) {
      return NextResponse.json({
        success: false,
        message: 'blobId and userKey are required'
      }, { status: 400 });
    }

    console.log('[vault-export-api] Exporting vault data:', {
      blobId,
      includePasswords
    });

    const exportData = await vaultService.exportVaultData(blobId, userKey, includePasswords);

    // Set appropriate headers for file download
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Content-Disposition', `attachment; filename="vault-export-${Date.now()}.json"`);

    return new NextResponse(JSON.stringify({
      success: true,
      message: 'Vault data exported successfully',
      data: exportData
    }, null, 2), { 
      status: 200,
      headers 
    });

  } catch (error) {
    console.error('[vault-export-api] Failed to export vault:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to export vault data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
