import { createHash, randomBytes } from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import type { User, AuthToken } from '@/types/zklogin';

// In production, this should be a secure random string from environment variables
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Hash a password with salt
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(32).toString('hex');
  const hash = createHash('sha256').update(password + salt).digest('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against its hash
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(':');
  const passwordHash = createHash('sha256').update(password + salt).digest('hex');
  return hash === passwordHash;
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: Omit<User, 'passwordHash'>): string {
  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name,
  };

  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: '7d' });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): AuthToken | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as unknown as AuthToken;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' };
  }
  
  if (password.length > 128) {
    return { valid: false, message: 'Password must be less than 128 characters long' };
  }
  
  // Add more password requirements if needed
  return { valid: true };
}
