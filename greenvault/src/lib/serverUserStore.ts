import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { User } from '@/types/zklogin';
import { generateTraditionalWallet as generateWallet } from '@/lib/walletUtils';

// Server-side storage file path
const STORAGE_FILE = join(process.cwd(), 'data', 'users.json');

interface UserStore {
  [email: string]: User;
}

/**
 * Ensure the data directory exists
 */
function ensureDataDirectory() {
  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) {
    const { mkdirSync } = require('fs');
    mkdirSync(dataDir, { recursive: true });
  }
}

/**
 * Load users from file
 */
function loadUsers(): UserStore {
  try {
    ensureDataDirectory();
    if (existsSync(STORAGE_FILE)) {
      const data = readFileSync(STORAGE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load users from file:', error);
  }
  return {};
}

/**
 * Save users to file
 */
function saveUsers(users: UserStore) {
  try {
    ensureDataDirectory();
    writeFileSync(STORAGE_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Failed to save users to file:', error);
  }
}

/**
 * Create a new user with wallet address
 */
export function createUser(email: string, passwordHash: string, name?: string): User {
  const userId = generateUserId();
  const users = loadUsers();
  
  // Generate wallet for the user
  const wallet = generateWallet(email, userId);
  
  const user: User = {
    id: userId,
    email: email.toLowerCase(),
    passwordHash,
    name,
    createdAt: new Date().toISOString(),
    walletAddress: wallet.address,
    walletPrivateKey: wallet.privateKey, // In production, this should be encrypted
  };

  console.log('Creating user:', {
    email: user.email,
    id: user.id,
    hasWallet: !!user.walletAddress
  });

  users[email.toLowerCase()] = user;
  saveUsers(users);
  
  console.log('User stored in server-side storage');
  console.log('Current users:', Object.keys(users));
  
  return user;
}

/**
 * Find a user by email
 */
export function findUserByEmail(email: string): User | null {
  console.log('Finding user by email:', email);
  const users = loadUsers();
  console.log('Available users:', Object.keys(users));
  
  const user = users[email.toLowerCase()] || null;
  console.log('Found user:', !!user);
  
  return user;
}

/**
 * Find a user by ID
 */
export function findUserById(id: string): User | null {
  const users = loadUsers();
  return Object.values(users).find(user => user.id === id) || null;
}

/**
 * Check if user exists
 */
export function userExists(email: string): boolean {
  const users = loadUsers();
  return !!users[email.toLowerCase()];
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
  const users = loadUsers();
  return Object.values(users);
}

/**
 * Clear all users (for debugging - remove in production)
 */
export function clearAllUsers(): void {
  saveUsers({});
}
