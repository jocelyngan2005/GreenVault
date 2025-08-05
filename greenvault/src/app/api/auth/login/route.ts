import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, isValidEmail, generateToken } from '@/lib/auth';
import { findUserByEmail } from '@/lib/serverUserStore';
import type { LoginCredentials, AuthResponse } from '@/types/zklogin';

export async function POST(request: NextRequest) {
  try {
    console.log('Login API called');
    const body = await request.json() as LoginCredentials;
    const { email, password } = body;

    console.log('Login attempt for email:', email);

    // Validate input
    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json({
        success: false,
        error: 'Email and password are required',
      } as AuthResponse, { status: 400 });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      console.log('Invalid email format:', email);
      return NextResponse.json({
        success: false,
        error: 'Invalid email format',
      } as AuthResponse, { status: 400 });
    }

    // Find user
    console.log('Looking for user with email:', email.toLowerCase());
    const user = findUserByEmail(email);
    console.log('User found:', !!user);
    
    if (!user) {
      console.log('User not found in store');
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password',
      } as AuthResponse, { status: 401 });
    }

    // Verify password
    console.log('Verifying password for user:', user.id);
    const passwordValid = verifyPassword(password, user.passwordHash);
    console.log('Password valid:', passwordValid);
    console.log('User wallet address:', user.walletAddress);
    
    if (!passwordValid) {
      console.log('Password verification failed');
      return NextResponse.json({
        success: false,
        error: 'Invalid email or password',
      } as AuthResponse, { status: 401 });
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          walletAddress: user.walletAddress,
        },
        token,
      },
    } as AuthResponse);

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    } as AuthResponse, { status: 500 });
  }
}
