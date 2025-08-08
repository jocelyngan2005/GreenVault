import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, isValidEmail, generateToken } from '@/lib/auth';
import { findUserByEmail } from '@/lib/zklogin/unifiedUserStore';
import { ensureUserHasDID } from '@/lib/did/didUtils';
import { vaultService } from '@/lib/vault/vault-service';
import { initializeUserVaultSafely, generateVaultKeyFromPassword } from '@/lib/vault/vault-auth';
import type { LoginCredentials, AuthResponse } from '@/types/zklogin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as LoginCredentials;
    const { email, password } = body;

    console.log('[login] Login attempt for email:', email);

    // Validate input
    if (!email || !password) {
      console.log('[login] Missing email or password');
      return NextResponse.json({
        success: false,
        error: 'Email and password are required',
      } as AuthResponse, { status: 400 });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      console.log('[login] Invalid email format:', email);
      return NextResponse.json({
        success: false,
        error: 'Invalid email format',
      } as AuthResponse, { status: 400 });
    }

    // Find user
    console.log('[login] Looking for user with email:', email.toLowerCase());
    const user = findUserByEmail(email);
    console.log('[login] User found:', !!user);
    
    if (!user) {
      console.log('[login] User not found in store');
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password',
      } as AuthResponse, { status: 401 });
    }

    // Verify password
    console.log('[login] Verifying password for user:', user.id);

    // Check if user has password hash (email auth)
    if (!user.passwordHash) {
      console.log('[login] User has no password hash - not an email auth user');
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password',
      } as AuthResponse, { status: 401 });
    }
    
    const passwordValid = verifyPassword(password, user.passwordHash);
    console.log('[login] Password valid:', passwordValid);
    console.log('[login] User wallet address:', user.walletAddress);

    if (!passwordValid) {
      console.log('Password verification failed');
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password',
      } as AuthResponse, { status: 401 });
    }

    // Check if user has a DID associated
    console.log('[login] Checking DID for user:', user.email);
    let didInfo;
    let finalUser = user;
    
    try {
      didInfo = await ensureUserHasDID(user);
      // Keep the original user for response, just note DID was processed
      
      if (didInfo.isNew) {
        console.log('[login] New DID created during login:', didInfo.did);
      } else {
        console.log('[login] Existing DID found:', didInfo.did);
      }
    } catch (didError) {
      console.error('[login] DID operation failed:', didError);
      // Continue with login even if DID creation fails
      console.log('[login] Continuing login without DID due to error');
    }

    // Generate JWT token
    const token = generateToken({
      id: finalUser.id,
      email: finalUser.email,
      name: finalUser.name,
      createdAt: finalUser.createdAt,
    });

    // Vault will be checked/created on the frontend after login
    console.log('[login] Vault will be checked on frontend for user:', finalUser.email);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: finalUser.id,
          email: finalUser.email,
          name: finalUser.name,
          createdAt: finalUser.createdAt,
          walletAddress: finalUser.walletAddress,
          did: finalUser.did || (didInfo?.did), // Include DID in response
        },
        token,
        didInfo: didInfo ? {
          did: didInfo.did,
          isNew: didInfo.isNew
        } : undefined
      },
    } as AuthResponse);

  } catch (error) {
    console.error('[login] Login error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    } as AuthResponse, { status: 500 });
  }
}
