import { verifyToken } from '@/lib/auth';

/**
 * Client-side authentication check
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth-token');
}

/**
 * Client-side user data retrieval
 */
export function getUserData(): any | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const userData = localStorage.getItem('user-data');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Failed to parse user data:', error);
    return null;
  }
}

/**
 * Check if user is authenticated (client-side)
 */
export function isAuthenticated(): boolean {
  const token = getAuthToken();
  if (!token) return false;
  
  try {
    const decoded = verifyToken(token);
    return !!decoded && decoded.exp > Math.floor(Date.now() / 1000);
  } catch (error) {
    return false;
  }
}

/**
 * Logout user (clear tokens and redirect)
 */
export function logout(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('auth-token');
  localStorage.removeItem('user-data');
  localStorage.removeItem('zklogin-data');
  localStorage.removeItem('zklogin-user-salt');
  sessionStorage.clear();
  
  window.location.href = '/login';
}

/**
 * Redirect to login if not authenticated
 */
export function requireAuth(): boolean {
  if (typeof window === 'undefined') return false;
  
  if (!isAuthenticated()) {
    window.location.href = '/login';
    return false;
  }
  
  return true;
}
