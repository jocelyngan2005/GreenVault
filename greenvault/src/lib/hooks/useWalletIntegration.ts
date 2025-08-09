'use client';

import { useState, useEffect, useCallback } from 'react';

interface WalletData {
  address: string;
  publicKey: string;
  isActivated: boolean;
  balance: number;
  activatedAt?: string;
  lastChecked?: string;
}

interface UseWalletIntegrationProps {
  userId?: string;
  email?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface UseWalletIntegrationReturn {
  wallet: WalletData | null;
  loading: boolean;
  error: string;
  activateWallet: () => Promise<void>;
  refreshWallet: () => Promise<void>;
  isWalletReady: boolean;
  canTransact: boolean;
}

export function useWalletIntegration({
  userId,
  email,
  autoRefresh = false,
  refreshInterval = 30000, // 30 seconds
}: UseWalletIntegrationProps): UseWalletIntegrationReturn {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const getAuthToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }, []);

  const fetchWalletStatus = useCallback(async () => {
    if (!userId && !email) return;

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (email) params.append('email', email);

      const response = await fetch(`/api/activate-wallets?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setWallet(data.wallet);
        setError('');
      } else {
        setError(data.error || 'Failed to fetch wallet status');
      }
    } catch (err) {
      setError('Network error while fetching wallet status');
      console.error('Error fetching wallet status:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, email]);

  const activateWallet = useCallback(async () => {
    if (!userId && !email) {
      setError('User ID or email is required for wallet activation');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setError('Authentication required. Please log in.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/activate-wallets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'activate',
          userId,
          email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setWallet(data.wallet);
        setError('');
      } else {
        setError(data.error || 'Failed to activate wallet');
      }
    } catch (err) {
      setError('Network error while activating wallet');
      console.error('Error activating wallet:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, email, getAuthToken]);

  const refreshWallet = useCallback(async () => {
    if (!userId && !email) return;

    const token = getAuthToken();
    if (!token) {
      // If no token, try to fetch status without authentication
      await fetchWalletStatus();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/activate-wallets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'refresh',
          userId,
          email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setWallet(data.wallet);
        setError('');
      } else {
        setError(data.error || 'Failed to refresh wallet');
      }
    } catch (err) {
      setError('Network error while refreshing wallet');
      console.error('Error refreshing wallet:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, email, getAuthToken, fetchWalletStatus]);

  // Initial fetch
  useEffect(() => {
    fetchWalletStatus();
  }, [fetchWalletStatus]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || (!userId && !email)) return;

    const interval = setInterval(() => {
      refreshWallet();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshWallet, userId, email]);

  const isWalletReady = Boolean(wallet && wallet.isActivated);
  const canTransact = Boolean(wallet && wallet.isActivated && wallet.balance >= 0.001); // Need at least 0.001 SUI for gas

  return {
    wallet,
    loading,
    error,
    activateWallet,
    refreshWallet,
    isWalletReady,
    canTransact,
  };
}

// Helper function to get wallet keypair for transactions
export function getWalletKeypair(privateKeyBase64: string) {
  try {
    const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
    const privateKeyBytes = Buffer.from(privateKeyBase64, 'base64');
    return Ed25519Keypair.fromSecretKey(privateKeyBytes);
  } catch (error) {
    console.error('Failed to create wallet keypair:', error);
    throw new Error('Invalid wallet private key');
  }
}

// Helper function to format addresses consistently
export function formatWalletAddress(address: string, length = 8): string {
  if (address.length <= length) return address;
  return `${address.slice(0, length / 2)}...${address.slice(-length / 2)}`;
}

// Helper function to format balance with appropriate precision
export function formatBalance(balance: number, maxDecimals = 4): string {
  if (balance === 0) return '0';
  if (balance < 0.001) return '<0.001';
  return balance.toFixed(Math.min(maxDecimals, 4));
}
