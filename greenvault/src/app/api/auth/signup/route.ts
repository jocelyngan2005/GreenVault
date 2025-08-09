import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, isValidEmail, isValidPassword, generateToken } from '@/lib/auth';
import { createUser, userExists } from '@/lib/serverUserStore';
import { ensureUserHasDID } from '@/lib/did/didUtils';
import { vaultService } from '@/lib/vault/vault-service';
import { initializeUserVaultSafely, generateVaultKeyFromPassword } from '@/lib/vault/vault-auth';
import type { SignupCredentials, AuthResponse } from '@/types/zklogin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SignupCredentials;
    const { email, password, name } = body;

    console.log('[signup] Sign Up attempt for email:', email);

    // Validate input
    if (!email || !password) {
      console.log('[signup] Missing email or password');
      return NextResponse.json({
        success: false,
        error: 'Email and password are required',
      } as AuthResponse, { status: 400 });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      console.log('[signup] Invalid email format:', email);
      return NextResponse.json({
        success: false,
        error: 'Invalid email format',
      } as AuthResponse, { status: 400 });
    }

    // Validate password
    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      console.log('[signup] Invalid password:', passwordValidation.message);
      return NextResponse.json({
        success: false,
        error: passwordValidation.message,
      } as AuthResponse, { status: 400 });
    }

    // Check if user already exists
    if (userExists(email)) {
      console.log('[signup] User already exists:', email);
      return NextResponse.json({
        success: false,
        error: 'User with this email already exists',
      } as AuthResponse, { status: 409 });
    }

    // Hash password and create user
    console.log('[signup] Creating user with hashed password');
    const passwordHash = hashPassword(password);
    const user = createUser(email, passwordHash, name);
    console.log('[signup] User created:', user.id);

    // Create DID for the new user
    console.log('[signup] Creating DID for new user:', user.email);
    let didInfo;
    let finalUser = user;
    
    try {
      didInfo = await ensureUserHasDID(user);
      // Keep the original user for response, just note DID was processed
      console.log('[signup] DID created successfully:', didInfo.did);
    } catch (didError) {
      console.error('[signup] DID creation failed during signup:', didError);
      // Continue with signup even if DID creation fails
      console.log('[signup] Continuing signup without DID due to error');
    }

    // Generate JWT token
    const token = generateToken({
      id: finalUser.id,
      email: finalUser.email,
      name: finalUser.name,
      createdAt: finalUser.createdAt,
    });

    // Vault will be set up during onboarding
    console.log('[signup] Vault will be set up during onboarding for user:', finalUser.email);

    console.log('[signup] Signup successful for user:', finalUser.email);

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
    console.error('[signup] Signup error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    } as AuthResponse, { status: 500 });
  }
}
