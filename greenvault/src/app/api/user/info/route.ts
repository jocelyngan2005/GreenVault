import { NextRequest, NextResponse } from 'next/server';
import { findZkLoginUserBySub, findUserByEmail, findUserById } from '@/lib/zklogin/unifiedUserStore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const authType = searchParams.get('authType');

    if (!userId && !email) {
      return NextResponse.json({
        success: false,
        error: 'Either userId or email is required'
      }, { status: 400 });
    }

    let userData = null;

    if (userId && authType === 'zklogin') {
      // Look up zkLogin user by Google sub
      userData = findZkLoginUserBySub(userId);
    } else if (email && authType === 'email') {
      // Look up email user
      userData = findUserByEmail(email);
    } else if (userId) {
      // Fallback: try to find by unified ID
      userData = findUserById(userId);
    }

    if (!userData) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Return safe user data (no passwords or private keys)
    const safeUserData = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      createdAt: userData.createdAt,
      authType: userData.authType,
      walletAddress: userData.walletAddress,
      userAddress: userData.userAddress,
      did: userData.did,
      didDocument: userData.didDocument,
      didCreatedAt: userData.didCreatedAt,
      provider: userData.provider
    };

    return NextResponse.json({
      success: true,
      data: safeUserData
    });

  } catch (error) {
    console.error('[user-info] Failed to fetch user info:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
