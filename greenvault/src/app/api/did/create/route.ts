import { NextRequest, NextResponse } from 'next/server';
import { didManager } from '@/lib/did/did-manager';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email } = body;

    console.log('[did-create] Creating DID for user:', { userId, email });

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Create DID for the user
    const didInfo = await didManager.createOrUpdateDIDForUser({
      id: userId,
      email: email
    });

    console.log('[did-create] DID created successfully:', didInfo.did);

    return NextResponse.json({
      success: true,
      data: {
        did: didInfo.did,
        isNew: didInfo.isNew
      }
    });

  } catch (error) {
    console.error('[did-create] Failed to create DID:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create DID'
    }, { status: 500 });
  }
}
