import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { User } from '@/types/zklogin';
import { generateWallet as generateWallet } from '@/lib/walletUtils';

// Server-side storage file paths
const EMAIL_USERS_FILE = join(process.cwd(), 'data', 'users.json');
const ZKLOGIN_USERS_FILE = join(process.cwd(), 'data', 'zklogin_users.json');
const UNIFIED_USERS_FILE = join(process.cwd(), 'data', 'all_users.json');

interface EmailUserStore {
  [email: string]: User;
}

interface ZkLoginUser {
  id: string; // Google sub
  email: string;
  name?: string;
  createdAt: string;
  userAddress: string; // zkLogin generated address
  provider: 'google';
  did?: string;
  didDocument?: any;
  didCreatedAt?: string;
}

interface ZkLoginUserStore {
  [googleSub: string]: ZkLoginUser;
}

interface UnifiedUser {
  id: string; // user ID or Google sub
  email: string;
  name?: string;
  createdAt: string;
  authType: 'email' | 'zklogin';
  
  // Email auth specific
  passwordHash?: string;
  walletAddress?: string;
  walletPrivateKey?: string;
  
  // zkLogin specific
  userAddress?: string; // zkLogin generated address
  provider?: 'google';
  
  // Common DID fields
  did?: string;
  didDocument?: any;
  didCreatedAt?: string;
}

interface UnifiedUserStore {
  [identifier: string]: UnifiedUser; // email for email users, googleSub for zkLogin users
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
 * Load unified users from file
 */
function loadUnifiedUsers(): UnifiedUserStore {
  try {
    ensureDataDirectory();
    if (existsSync(UNIFIED_USERS_FILE)) {
      const data = readFileSync(UNIFIED_USERS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[unifiedUserStore] Failed to load unified users from file:', error);
  }
  return {};
}

/**
 * Save unified users to file
 */
function saveUnifiedUsers(users: UnifiedUserStore) {
  try {
    ensureDataDirectory();
    writeFileSync(UNIFIED_USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('[unifiedUserStore] Failed to save unified users to file:', error);
  }
}

/**
 * Migrate existing users to unified format
 */
function migrateToUnifiedFormat() {
  console.log('[unifiedUserStore] Checking if migration is needed...');

  const unifiedUsers = loadUnifiedUsers();
  let migrationNeeded = false;
  
  // Migrate email users
  if (existsSync(EMAIL_USERS_FILE)) {
    try {
      const emailUsers: EmailUserStore = JSON.parse(readFileSync(EMAIL_USERS_FILE, 'utf8'));
      
      for (const [email, user] of Object.entries(emailUsers)) {
        if (!unifiedUsers[email] || unifiedUsers[email].authType !== 'email') {
          unifiedUsers[email] = {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
            authType: 'email',
            passwordHash: user.passwordHash,
            walletAddress: user.walletAddress,
            walletPrivateKey: user.walletPrivateKey,
            did: user.did,
            didDocument: user.didDocument,
            didCreatedAt: user.didCreatedAt,
          };
          migrationNeeded = true;
        }
      }
      
      if (migrationNeeded) {
        console.log('[unifiedUserStore] Migrated email users to unified format');
      }
    } catch (error) {
      console.error('[unifiedUserStore] Failed to migrate email users:', error);
    }
  }
  
  // Migrate zkLogin users if they exist
  if (existsSync(ZKLOGIN_USERS_FILE)) {
    try {
      const zkLoginUsers: ZkLoginUserStore = JSON.parse(readFileSync(ZKLOGIN_USERS_FILE, 'utf8'));
      
      for (const [googleSub, user] of Object.entries(zkLoginUsers)) {
        if (!unifiedUsers[googleSub] || unifiedUsers[googleSub].authType !== 'zklogin') {
          unifiedUsers[googleSub] = {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
            authType: 'zklogin',
            userAddress: user.userAddress,
            provider: user.provider,
            did: user.did,
            didDocument: user.didDocument,
            didCreatedAt: user.didCreatedAt,
          };
          migrationNeeded = true;
        }
      }
      
      if (migrationNeeded) {
        console.log('[unifiedUserStore] Migrated zkLogin users to unified format');
      }
    } catch (error) {
      console.error('[unifiedUserStore] Failed to migrate zkLogin users:', error);
    }
  }
  
  if (migrationNeeded) {
    saveUnifiedUsers(unifiedUsers);
    console.log('[unifiedUserStore] Unified user format migration complete');
  }
  
  return unifiedUsers;
}

/**
 * Create or update zkLogin user with DID
 */
export function createOrUpdateZkLoginUser(
  googleSub: string, 
  email: string, 
  name: string | undefined, 
  userAddress: string,
  did: string,
  didDocument: any
): UnifiedUser {
  console.log('[unifiedUserStore] Creating/updating zkLogin user:', { googleSub, email, did });

  const users = migrateToUnifiedFormat();
  
  const user: UnifiedUser = {
    id: googleSub,
    email: email.toLowerCase(),
    name,
    createdAt: users[googleSub]?.createdAt || new Date().toISOString(),
    authType: 'zklogin',
    userAddress,
    provider: 'google',
    did,
    didDocument,
    didCreatedAt: new Date().toISOString(),
  };
  
  users[googleSub] = user;
  saveUnifiedUsers(users);

  console.log('[unifiedUserStore] zkLogin user created/updated with DID');
  return user;
}

/**
 * Update email user with DID information (maintaining backward compatibility)
 */
export function updateEmailUserWithDID(email: string, did: string, didDocument: any): UnifiedUser | null {
  console.log('[unifiedUserStore] Updating email user with DID:', { email, did });
  
  const users = migrateToUnifiedFormat();
  const user = users[email.toLowerCase()];
  
  if (!user || user.authType !== 'email') {
    console.error('[unifiedUserStore] Email user not found for DID update:', email);
    return null;
  }
  
  user.did = did;
  user.didDocument = didDocument;
  user.didCreatedAt = new Date().toISOString();
  
  users[email.toLowerCase()] = user;
  saveUnifiedUsers(users);
  
  // Also update the legacy email users file for backward compatibility
  try {
    if (existsSync(EMAIL_USERS_FILE)) {
      const emailUsers: EmailUserStore = JSON.parse(readFileSync(EMAIL_USERS_FILE, 'utf8'));
      if (emailUsers[email.toLowerCase()]) {
        emailUsers[email.toLowerCase()].did = did;
        emailUsers[email.toLowerCase()].didDocument = didDocument;
        emailUsers[email.toLowerCase()].didCreatedAt = new Date().toISOString();
        writeFileSync(EMAIL_USERS_FILE, JSON.stringify(emailUsers, null, 2));
      }
    }
  } catch (error) {
    console.error('[unifiedUserStore] Failed to update legacy email users file:', error);
  }

  console.log('[unifiedUserStore] Email user updated with DID');
  return user;
}

/**
 * Find user by email (works for both auth types)
 */
export function findUserByEmail(email: string): UnifiedUser | null {
  console.log('[unifiedUserStore] Finding user by email:', email);
  const users = migrateToUnifiedFormat();
  
  const normalizedEmail = email.toLowerCase();
  
  // First try to find by email (email auth users)
  let user = users[normalizedEmail];
  if (user) {
    console.log('[unifiedUserStore] Found email auth user:', user.authType);
    return user;
  }
  
  // If not found, search through all users for matching email (zkLogin users)
  for (const [key, userData] of Object.entries(users)) {
    if (userData.email.toLowerCase() === normalizedEmail) {
      console.log('[unifiedUserStore] Found zkLogin user by email:', userData.authType);
      return userData;
    }
  }

  console.log('[unifiedUserStore] User not found by email:', email);
  return null;
}

/**
 * Find zkLogin user by Google sub
 */
export function findZkLoginUserBySub(googleSub: string): UnifiedUser | null {
  console.log('[unifiedUserStore] Finding zkLogin user by Google sub:', googleSub);
  const users = migrateToUnifiedFormat();
  
  const user = users[googleSub];
  if (user && user.authType === 'zklogin') {
    console.log('[unifiedUserStore] Found zkLogin user');
    return user;
  }

  console.log('[unifiedUserStore] zkLogin user not found by sub:', googleSub);
  return null;
}

/**
 * Find user by ID (works for both auth types)
 */
export function findUserById(id: string): UnifiedUser | null {
  console.log('[unifiedUserStore] Finding user by ID:', id);
  const users = migrateToUnifiedFormat();
  
  // Search through all users
  for (const [key, user] of Object.entries(users)) {
    if (user.id === id) {
      console.log('[unifiedUserStore] Found user by ID:', user.authType);
      return user;
    }
  }

  console.log('[unifiedUserStore] User not found by ID:', id);
  return null;
}

/**
 * Get all users (unified format)
 */
export function getAllUnifiedUsers(): UnifiedUser[] {
  const users = migrateToUnifiedFormat();
  return Object.values(users);
}

/**
 * Get user statistics
 */
export function getUserStats() {
  const users = migrateToUnifiedFormat();
  const allUsers = Object.values(users);
  
  return {
    total: allUsers.length,
    emailAuth: allUsers.filter(u => u.authType === 'email').length,
    zkLogin: allUsers.filter(u => u.authType === 'zklogin').length,
    withDID: allUsers.filter(u => u.did).length,
    withoutDID: allUsers.filter(u => !u.did).length,
  };
}

// Export legacy functions for backward compatibility
export * from '../serverUserStore';
