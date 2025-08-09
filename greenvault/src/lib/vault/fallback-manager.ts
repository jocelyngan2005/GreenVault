/**
 * Frontend Local Storage Fallback Management
 * 
 * Provides UI utilities to manage local storage fallback data
 */

import { getLocalFallbackStats, listLocalFallbackItems, clearLocalFallbackData } from '@/lib/walrus/local-storage-fallback';

export interface FallbackDataSummary {
  isActive: boolean;
  totalItems: number;
  totalSize: number;
  types: Record<string, number>;
  lastUpdated?: string;
  storageUsage: string;
}

/**
 * Get summary of local fallback data for UI display
 */
export function getFallbackSummary(): FallbackDataSummary {
  try {
    const stats = getLocalFallbackStats();
    const items = listLocalFallbackItems();
    
    return {
      isActive: stats.totalItems > 0,
      totalItems: stats.totalItems,
      totalSize: stats.totalSize,
      types: stats.byType,
      lastUpdated: stats.newestItem,
      storageUsage: formatBytes(stats.totalSize)
    };
  } catch (error) {
    console.error('[fallback-manager] Failed to get summary:', error);
    return {
      isActive: false,
      totalItems: 0,
      totalSize: 0,
      types: {},
      storageUsage: '0 B'
    };
  }
}

/**
 * Check if user has any data in local fallback storage
 */
export function hasLocalFallbackData(): boolean {
  const summary = getFallbackSummary();
  return summary.isActive;
}

/**
 * Get a user-friendly message about fallback status
 */
export function getFallbackStatusMessage(): string {
  const summary = getFallbackSummary();
  
  if (!summary.isActive) {
    return "All your vault data is stored on the Walrus network.";
  }
  
  const typeList = Object.entries(summary.types)
    .map(([type, count]) => `${count} ${type} item${count > 1 ? 's' : ''}`)
    .join(', ');
  
  return `You have ${summary.totalItems} item${summary.totalItems > 1 ? 's' : ''} stored locally (${summary.storageUsage}) due to network connectivity issues: ${typeList}. This data will be synced to Walrus when connectivity is restored.`;
}

/**
 * Clear all local fallback data (with confirmation)
 */
export function clearAllFallbackData(): { success: boolean; message: string; itemsCleared: number } {
  try {
    const summary = getFallbackSummary();
    const itemsCleared = summary.totalItems;
    
    if (itemsCleared === 0) {
      return {
        success: true,
        message: "No fallback data to clear.",
        itemsCleared: 0
      };
    }
    
    clearLocalFallbackData();
    
    return {
      success: true,
      message: `Successfully cleared ${itemsCleared} local storage items.`,
      itemsCleared
    };
  } catch (error) {
    console.error('[fallback-manager] Failed to clear data:', error);
    return {
      success: false,
      message: `Failed to clear fallback data: ${error}`,
      itemsCleared: 0
    };
  }
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Estimate when local data might sync to Walrus
 */
export async function testWalrusConnectivity(): Promise<{ 
  isOnline: boolean; 
  canReachWalrus: boolean; 
  latency?: number;
  message: string;
}> {
  if (!navigator.onLine) {
    return {
      isOnline: false,
      canReachWalrus: false,
      message: "No internet connection detected."
    };
  }
  
  try {
    const startTime = Date.now();
    const response = await fetch('https://aggregator-devnet.walrus.space/v1/health', {
      method: 'HEAD',
      mode: 'no-cors',
      signal: AbortSignal.timeout(5000)
    });
    const latency = Date.now() - startTime;
    
    return {
      isOnline: true,
      canReachWalrus: true,
      latency,
      message: `Walrus network is reachable (${latency}ms). Local data can be synced.`
    };
  } catch (error) {
    return {
      isOnline: true,
      canReachWalrus: false,
      message: "Walrus network is currently unreachable. Using local storage fallback."
    };
  }
}

/**
 * React hook for fallback status (if using React)
 * Note: Import useState and useEffect from 'react' to use this hook
 */
/*
export function useFallbackStatus() {
  const [summary, setSummary] = useState<FallbackDataSummary | null>(null);
  const [connectivity, setConnectivity] = useState<any>(null);
  
  useEffect(() => {
    const updateStatus = () => {
      setSummary(getFallbackSummary());
    };
    
    const checkConnectivity = async () => {
      const result = await testWalrusConnectivity();
      setConnectivity(result);
    };
    
    updateStatus();
    checkConnectivity();
    
    // Update every 30 seconds
    const interval = setInterval(() => {
      updateStatus();
      checkConnectivity();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  return {
    summary,
    connectivity,
    hasLocalData: summary?.isActive || false,
    statusMessage: summary ? getFallbackStatusMessage() : '',
    clearData: clearAllFallbackData
  };
}
*/

// Example usage in React components:
// import { useState, useEffect } from 'react';
// Then uncomment the hook above
