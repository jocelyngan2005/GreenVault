import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/unifiedUserStore';
import { getUserDIDStatus } from '@/lib/didUtils';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('[did health] DID health check');
    
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
      console.error('[did health] Token verification failed:', error);
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired token',
      }, { status: 401 });
    }

    // Find user
    const user = findUserByEmail(userPayload.email);
    if (!user) {
      console.error('[did health] User not found:', userPayload.email);
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    // Get DID status
    const didStatus = await getUserDIDStatus(user);

    console.log('[did health] DID status retrieved:', {
      email: user.email,
      hasDID: didStatus.hasDID,
      isValid: didStatus.isValid,
      did: didStatus.did
    });

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        didStatus: didStatus
      }
    });

  } catch (error) {
    console.error('[did health] DID health check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[did health] DID repair');
    
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
      console.error('[did health] Token verification failed:', error);
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired token',
      }, { status: 401 });
    }

    // Find user
    const user = findUserByEmail(userPayload.email);
    if (!user) {
      console.error('[did health] User not found:', userPayload.email);
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    // Force DID creation/repair
    const { ensureUserHasDID } = await import('@/lib/didUtils');
    
    try {
      const didInfo = await ensureUserHasDID(user);

      console.log('[did health] DID repaired successfully:', {
        email: user.email,
        did: didInfo.did,
        wasNew: didInfo.isNew
      });

      return NextResponse.json({
        success: true,
        data: {
          userId: user.id,
          email: user.email,
          did: didInfo.did,
          isNew: didInfo.isNew,
          message: didInfo.isNew ? 'New DID created' : 'Existing DID verified'
        }
      });
      
    } catch (didError) {
      console.error('[did health] DID repair failed:', didError);
      return NextResponse.json({
        success: false,
        error: `DID repair failed: ${didError instanceof Error ? didError.message : 'Unknown error'}`,
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[did health] DID repair error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
