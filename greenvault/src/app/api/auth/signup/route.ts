import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, isValidEmail, isValidPassword, generateToken } from '@/lib/auth';
import { createUser, userExists } from '@/lib/serverUserStore';
import type { SignupCredentials, AuthResponse } from '@/types/zklogin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SignupCredentials;
    const { email, password, name } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required',
      } as AuthResponse, { status: 400 });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format',
      } as AuthResponse, { status: 400 });
    }

    // Validate password
    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json({
        success: false,
        error: passwordValidation.message,
      } as AuthResponse, { status: 400 });
    }

    // Check if user already exists
    if (userExists(email)) {
      return NextResponse.json({
        success: false,
        error: 'User with this email already exists',
      } as AuthResponse, { status: 409 });
    }

    // Hash password and create user
    const passwordHash = hashPassword(password);
    const user = createUser(email, passwordHash, name);

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
    console.error('Signup error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    } as AuthResponse, { status: 500 });
  }
}
