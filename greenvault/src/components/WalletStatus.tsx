'use client';

import { useState, useEffect } from 'react';
import { Wallet, CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react';

interface WalletData {
  address?: string;
  userAddress?: string;
  publicKey?: string;
  isActivated: boolean;
  balance: number;
  activatedAt?: string;
  lastChecked?: string;
}

interface WalletStatusProps {
  userId?: string;
  email?: string;
  className?: string;
  showFullAddress?: boolean;
}

export default function WalletStatus({ 
  userId, 
  email, 
  className = '', 
  showFullAddress = false 
}: WalletStatusProps) {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  };

  const fetchWalletStatus = async () => {
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
        setMessage(data.message);
      } else {
        setError(data.error || 'Failed to fetch wallet status');
      }
    } catch (err) {
      setError('Network error while fetching wallet status');
      console.error('Error fetching wallet status:', err);
    } finally {
      setLoading(false);
    }
  };

  const activateWallet = async () => {
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
        setMessage(data.message);
      } else {
        setError(data.error || 'Failed to activate wallet');
      }
    } catch (err) {
      setError('Network error while activating wallet');
      console.error('Error activating wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshWallet = async () => {
    if (!wallet) {
      await fetchWalletStatus();
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
          action: 'refresh',
          userId,
          email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setWallet(data.wallet);
        setMessage(data.message);
      } else {
        setError(data.error || 'Failed to refresh wallet');
      }
    } catch (err) {
      setError('Network error while refreshing wallet');
      console.error('Error refreshing wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletStatus();
  }, [userId, email]);

  const formatAddress = (address?: string) => {
    if (!address) return '';
    if (showFullAddress) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance?: number) => {
    if (typeof balance !== 'number' || isNaN(balance)) return '0.0000';
    return balance.toFixed(4);
  };

  return (
    <div className={`bg-white rounded-lg border shadow-sm p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Sui Wallet</h3>
        </div>
        <button
          onClick={refreshWallet}
          disabled={loading}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          title="Refresh wallet status"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {wallet ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Status:</span>
            <div className="flex items-center gap-2">
              {wallet.isActivated ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${
                wallet.isActivated ? 'text-green-700' : 'text-red-700'
              }`}>
                {wallet.isActivated ? 'Activated' : 'Not Activated'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Address:</span>
            <span className="text-sm font-mono text-gray-900" title={wallet.address || wallet.userAddress}>
              {formatAddress(wallet.address || wallet.userAddress)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Balance:</span>
            <span className="text-sm font-medium text-gray-900">
              {formatBalance(wallet.balance)} SUI
            </span>
          </div>

          {wallet.activatedAt && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Activated:</span>
              <span className="text-sm text-gray-700">
                {new Date(wallet.activatedAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      ) : !loading && !error ? (
        <div className="text-center py-6">
          <p className="text-gray-600 mb-4">No wallet found. Create one to start trading carbon credits.</p>
          <button
            onClick={activateWallet}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Creating Wallet...' : 'Create & Activate Wallet'}
          </button>
        </div>
      ) : loading ? (
        <div className="text-center py-6">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
          <p className="text-gray-600">Loading wallet status...</p>
        </div>
      ) : null}

      {wallet?.lastChecked && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Last updated: {new Date(wallet.lastChecked).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
