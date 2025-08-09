import { NextRequest, NextResponse } from 'next/server';
import { getAllUnifiedUsers, getUserStats } from '@/lib/zklogin/unifiedUserStore';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('[user]Getting all users with unified format');
    
    const users = getAllUnifiedUsers();
    const stats = getUserStats();
    
    // Remove sensitive information for the response
    const safeUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      authType: user.authType,
      
      // Auth-specific fields (non-sensitive)
      walletAddress: user.walletAddress,
      userAddress: user.userAddress,
      provider: user.provider,
      
      // DID information
      did: user.did,
      didCreatedAt: user.didCreatedAt,
      hasDID: !!user.did,
      
      // Document metadata only (not full document)
      didDocumentType: user.didDocument?.['@context']?.[0] || null,
      didVerificationMethods: user.didDocument?.verificationMethod?.length || 0,
    }));
    
    console.log('[user] Retrieved unified user data:', {
      totalUsers: users.length,
      emailAuth: stats.emailAuth,
      zkLogin: stats.zkLogin,
      withDID: stats.withDID
    });
    
    return NextResponse.json({
      success: true,
      data: {
        users: safeUsers,
        stats: stats,
        unified: true,
      }
    });
    
  } catch (error) {
    console.error('[user] Failed to get users:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve users',
    }, { status: 500 });
  }
}
