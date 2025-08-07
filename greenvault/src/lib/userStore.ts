import type { User } from '@/types/zklogin';
import { generateWallet } from '@/lib/walletUtils';

// In-memory store with localStorage fallback

interface UserStore {
  [email: string]: User;
}

// Initialize from localStorage if available (client-side only)
let userStore: UserStore = {};

if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('greenvault-users');
    if (stored) {
      userStore = JSON.parse(stored);
    }
  } catch (error) {
    console.error('[userStore] Failed to load users from localStorage:', error);
  }
}

/**
 * Save users to localStorage (client-side only)
 */
function saveUsers() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('greenvault-users', JSON.stringify(userStore));
    } catch (error) {
      console.error('[userStore] Failed to save users to localStorage:', error);
    }
  }
}

/**
 * Create a new user with wallet address
 */
export function createUser(email: string, passwordHash: string, name?: string): User {
  const userId = generateUserId();

  console.log('[userStore] Creating user with email:', email.toLowerCase());
  console.log('[userStore] Generated userId:', userId);

  // Generate wallet for the user
  const wallet = generateWallet(email, userId);
  console.log('Generated wallet address:', wallet.address);
  
  const user: User = {
    id: userId,
    email: email.toLowerCase(),
    passwordHash,
    name,
    createdAt: new Date().toISOString(),
    walletAddress: wallet.address,
    walletPrivateKey: wallet.privateKey, // In production, this should be encrypted
  };

  userStore[email.toLowerCase()] = user;
  console.log('[userStore] User stored in userStore');
  console.log('[userStore] Current userStore keys:', Object.keys(userStore));

  saveUsers();
  console.log('[userStore] User saved to localStorage');

  return user;
}

/**
 * Find a user by email
 */
export function findUserByEmail(email: string): User | null {
  console.log('[userStore] Finding user by email:', email.toLowerCase());
  console.log('[userStore] Available users:', Object.keys(userStore));
  const user = userStore[email.toLowerCase()] || null;
  console.log('[userStore] Found user:', !!user);
  return user;
}

/**
 * Find a user by ID
 */
export function findUserById(id: string): User | null {
  return Object.values(userStore).find(user => user.id === id) || null;
}

/**
 * Check if user exists
 */
export function userExists(email: string): boolean {
  return !!userStore[email.toLowerCase()];
}

/**
 * Generate a unique user ID
 */
function generateUserId(): string {
  return 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

/**
 * Get all users (for debugging - remove in production)
 */
export function getAllUsers(): User[] {
  return Object.values(userStore);
}

/**
 * Clear all users (for debugging - remove in production)
 */
export function clearAllUsers(): void {
  userStore = {};
  saveUsers();
}
