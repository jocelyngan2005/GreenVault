import { NextRequest, NextResponse } from 'next/server';
import { WalrusUserManager } from '@/lib/walrus/user-manager';

/**
 * GET /api/zklogin/userdata - Retrieve user data from Walrus storage
 * 
 * Query parameters:
 * - userId: The user's Google sub ID
 * - userKey: The encryption key (typically the user's salt)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userKey = searchParams.get('userKey');

    if (!userId || !userKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: userId and userKey'
      }, { status: 400 });
    }

    console.log('[userdata] Retrieving user data from Walrus for userId:', userId);

    const walrusManager = WalrusUserManager.getInstance();
    await walrusManager.initialize();

    const userData = await walrusManager.retrieveUserData(userId, userKey);

    if (!userData) {
      console.log('[userdata] No user data found for userId:', userId);
      return NextResponse.json({
        success: false,
        error: 'User data not found'
      }, { status: 404 });
    }

    console.log('[userdata] ✅ User data retrieved successfully:', {
      userId,
      hasZkLogin: !!userData.zkLoginData,
      hasDID: !!userData.didData,
      lastLogin: userData.metadata.lastLogin
    });

    return NextResponse.json({
      success: true,
      data: userData
    });

  } catch (error) {
    console.error('[userdata] Error retrieving user data:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve user data'
    }, { status: 500 });
  }
}

/**
 * PUT /api/zklogin/userdata - Update user data in Walrus storage
 * 
 * Body:
 * - userData: WalrusUserData object
 * - userKey: The encryption key
 */
export async function PUT(request: NextRequest) {
  try {
    const { userData, userKey } = await request.json();

    if (!userData || !userKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: userData and userKey'
      }, { status: 400 });
    }

    console.log('[userdata] Updating user data in Walrus for userId:', userData.metadata.userId);

    const walrusManager = WalrusUserManager.getInstance();
    await walrusManager.initialize();

    // Update the lastLogin timestamp
    userData.metadata.lastLogin = new Date().toISOString();
    userData.metadata.updatedAt = new Date().toISOString();

    const blobId = await walrusManager.storeUserData(userData, userKey);

    console.log('[userdata] ✅ User data updated successfully:', {
      userId: userData.metadata.userId,
      blobId,
      timestamp: userData.metadata.lastLogin
    });

    return NextResponse.json({
      success: true,
      data: {
        blobId,
        timestamp: userData.metadata.lastLogin
      }
    });

  } catch (error) {
    console.error('[userdata] Error updating user data:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user data'
    }, { status: 500 });
  }
}
