import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/serverUserStore';
import { verifyToken } from '@/lib/auth';
import { didManager } from '@/lib/did-manager';

export async function GET(request: NextRequest) {
  try {
    console.log('[did info] DID info API called');
    
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify token
    let userPayload;
    try {
      userPayload = verifyToken(token);
      if (!userPayload) {
        throw new Error('Token verification returned null');
      }
    } catch (error) {
      console.error('[did info] Token verification failed:', error);
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired token',
      }, { status: 401 });
    }

    // Find user
    const user = findUserByEmail(userPayload.email);
    if (!user) {
      console.error('[did info] User not found:', userPayload.email);
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    // Get DID information
    const didInfo = {
      hasDID: !!(user.did && user.didDocument),
      did: user.did || null,
      createdAt: user.didCreatedAt || null,
      document: user.didDocument || null,
    };

    // If user has a DID, try to resolve it to verify it's still valid
    let isResolvable = false;
    if (user.did) {
      try {
        const resolvedDocument = await didManager.resolveDID(user.did);
        isResolvable = !!resolvedDocument;
      } catch (error) {
        console.warn('[did info] DID resolution failed:', error);
        isResolvable = false;
      }
    }

    console.log('[did info] DID info retrieved:', {
      email: user.email,
      hasDID: didInfo.hasDID,
      did: didInfo.did,
      isResolvable
    });

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        did: didInfo,
        isResolvable
      }
    });

  } catch (error) {
    console.error('[did info] DID info error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
