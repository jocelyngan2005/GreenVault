/**
 * User Data Synchronization Utilities
 * 
 * This module provides utilities to ensure consistent user data handling
 * between email authentication and Google zkLogin authentication.
 */

export interface UnifiedUserData {
  id: string; // User ID (email user's ID or Google sub)
  email: string;
  name?: string;
  walletAddress?: string;
  userAddress?: string; // zkLogin specific
  did?: string;
  createdAt?: string;
  authType: 'email' | 'zklogin';
  provider?: 'google';
}

/**
 * Load user data from localStorage in a unified format
 */
export function loadUnifiedUserData(): UnifiedUserData | null {
  try {
    // Priority 1: Check for unified user-data format
    const userDataStr = localStorage.getItem('user-data');
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        walletAddress: userData.walletAddress || userData.userAddress,
        userAddress: userData.userAddress,
        did: userData.did,
        createdAt: userData.createdAt,
        authType: userData.authType || 'email',
        provider: userData.provider
      };
    }

    // Priority 2: Fallback to legacy zkLogin data
    const zkLoginDataStr = localStorage.getItem('zklogin-data');
    if (zkLoginDataStr) {
      const zkLoginData = JSON.parse(zkLoginDataStr);
      const decodedJwt = zkLoginData.decodedJwt;
      
      if (decodedJwt) {
        return {
          id: decodedJwt.sub,
          email: decodedJwt.email || '',
          name: decodedJwt.name || decodedJwt.given_name,
          walletAddress: zkLoginData.userAddress,
          userAddress: zkLoginData.userAddress,
          did: zkLoginData.did,
          createdAt: new Date().toISOString(),
          authType: 'zklogin',
          provider: 'google'
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error loading unified user data:', error);
    return null;
  }
}

/**
 * Load user data and fetch missing information from server if needed
 */
export async function loadUnifiedUserDataWithServerSync(): Promise<UnifiedUserData | null> {
  try {
    // First try to load from localStorage
    let userData = loadUnifiedUserData();
    
    if (!userData) {
      return null;
    }
    
    // If we have user data but missing DID, try to fetch from server
    if (!userData.did && userData.id && userData.authType) {
      console.log('[user-data-sync] Missing DID, fetching from server...');
      
      try {
        const response = await fetch(`/api/user/info?userId=${encodeURIComponent(userData.id)}&authType=${userData.authType}`);
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.success && result.data.did) {
            // Update localStorage with server data
            userData.did = result.data.did;
            storeUnifiedUserData(userData);
            
            console.log('[user-data-sync] DID fetched from server and stored:', result.data.did);
          }
        }
      } catch (serverError) {
        console.warn('[user-data-sync] Failed to fetch from server:', serverError);
        // Continue with existing data
      }
    }
    
    return userData;
  } catch (error) {
    console.error('Error loading unified user data with server sync:', error);
    return null;
  }
}

/**
 * Store user data in unified format for both email and zkLogin users
 */
export function storeUnifiedUserData(userData: UnifiedUserData): void {
  try {
    localStorage.setItem('user-data', JSON.stringify(userData));
    
    // Also create a consistent auth token
    const authToken = btoa(JSON.stringify({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      authType: userData.authType,
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }));
    localStorage.setItem('auth-token', authToken);
    
    console.log('Unified user data stored:', { 
      id: userData.id, 
      email: userData.email, 
      authType: userData.authType 
    });
  } catch (error) {
    console.error('Error storing unified user data:', error);
  }
}

/**
 * Generate consistent vault key for any user
 */
export function generateVaultKey(userId: string): string {
  return `vault-${userId}-consistent`;
}

/**
 * Get current user ID from stored data
 */
export function getCurrentUserId(): string | null {
  const userData = loadUnifiedUserData();
  return userData?.id || null;
}

/**
 * Get current vault key for the logged-in user
 */
export function getCurrentVaultKey(): string | null {
  const userId = getCurrentUserId();
  return userId ? generateVaultKey(userId) : null;
}

/**
 * Check if current user is authenticated
 */
export function isUserAuthenticated(): boolean {
  const userData = loadUnifiedUserData();
  const authToken = localStorage.getItem('auth-token');
  return !!(userData && authToken);
}

/**
 * Clear all user data (logout)
 */
export function clearUserData(): void {
  localStorage.removeItem('user-data');
  localStorage.removeItem('zklogin-data');
  localStorage.removeItem('auth-token');
  localStorage.removeItem('user-role');
  sessionStorage.clear();
}
