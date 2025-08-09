/**
 * Local Storage Fallback Utility
 * 
 * Provides encrypted local storage fallback when Walrus network is unavailable.
 * This ensures users can continue using the vault even during network issues.
 */

import { sealStringAESGCM, unsealStringAESGCM } from './crypto';

export interface FallbackStorageItem {
  id: string;
  encryptedData: string;
  timestamp: string;
  userKey: string;
  type: 'vault' | 'registry' | 'secrets' | 'account';
}

export class LocalStorageFallback {
  private static readonly STORAGE_PREFIX = '';
  private static readonly MAX_ITEMS = 100; // Prevent localStorage from growing too large
  
  /**
   * Store data in encrypted local storage
   */
  static async store(data: string, userKey: string, type: 'vault' | 'registry' | 'secrets' | 'account' = 'vault'): Promise<string> {
    try {
      const fallbackId = `${this.STORAGE_PREFIX}${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || !window.localStorage) {
        // We're on server-side, throw error to trigger simpler fallback
        throw new Error('localStorage not available - server side environment');
      }
      
      // Encrypt the data before storing
      const encryptedData = await sealStringAESGCM(data, userKey);
      
      const storageItem: FallbackStorageItem = {
        id: fallbackId,
        encryptedData,
        timestamp: new Date().toISOString(),
        userKey: userKey.substring(0, 8) + '...', // Store hint of key for debugging
        type
      };
      
      // Clean up old items before storing new ones
      await this.cleanupOldItems();
      
      localStorage.setItem(fallbackId, JSON.stringify(storageItem));
      console.log('[local-fallback] Data stored in localStorage:', {
        id: fallbackId,
        type,
        size: data.length,
        encrypted: true
      });
      
      // Store in index for easier management
      this.addToIndex(fallbackId, type);
      
      return fallbackId;
    } catch (error) {
      console.error('[local-fallback] Failed to store in localStorage');
      throw new Error(`Local storage fallback failed: ${error}`);
    }
  }
  
  /**
   * Retrieve and decrypt data from local storage
   */
  static async retrieve(fallbackId: string, userKey: string): Promise<string> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedItem = localStorage.getItem(fallbackId);
        
        if (!storedItem) {
          throw new Error(`Fallback data not found: ${fallbackId}`);
        }
        
        const storageItem: FallbackStorageItem = JSON.parse(storedItem);
        
        // Decrypt the data
        const decryptedData = await unsealStringAESGCM(storageItem.encryptedData, userKey);
        
        console.log('[local-fallback] Data retrieved from localStorage:', {
          id: fallbackId,
          type: storageItem.type,
          timestamp: storageItem.timestamp,
          size: decryptedData.length
        });
        
        return decryptedData;
      } else {
        throw new Error('localStorage not available');
      }
    } catch (error) {
      console.error('[local-fallback] Failed to retrieve from localStorage:', error);
      throw new Error(`Local storage retrieval failed: ${error}`);
    }
  }
  
  /**
   * List all fallback items for debugging
   */
  static listFallbackItems(): { id: string; type: string; timestamp: string; size: number }[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }
    
    const items: { id: string; type: string; timestamp: string; size: number }[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.STORAGE_PREFIX)) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          items.push({
            id: key,
            type: item.type || 'unknown',
            timestamp: item.timestamp || 'unknown',
            size: (item.encryptedData || '').length
          });
        } catch (e) {
          console.warn('[local-fallback] Failed to parse item:', key);
        }
      }
    }
    
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  /**
   * Clean up old fallback items to prevent localStorage from growing too large
   */
  static async cleanupOldItems(): Promise<void> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    
    const items = this.listFallbackItems();
    
    if (items.length > this.MAX_ITEMS) {
      console.log(`[local-fallback] Cleaning up ${items.length - this.MAX_ITEMS} old items`);
      
      // Remove oldest items
      const itemsToRemove = items.slice(this.MAX_ITEMS);
      for (const item of itemsToRemove) {
        localStorage.removeItem(item.id);
        this.removeFromIndex(item.id);
      }
      
      console.log(`[local-fallback] Cleanup complete, ${items.length - itemsToRemove.length} items remaining`);
    }
  }
  
  /**
   * Clear all fallback data (for testing/debugging)
   */
  static clearAllFallbackData(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    localStorage.removeItem(this.STORAGE_PREFIX + 'index');
    
    console.log(`[local-fallback] Cleared ${keysToRemove.length} fallback items`);
  }
  
  /**
   * Get storage usage statistics
   */
  static getStorageStats(): { 
    totalItems: number; 
    totalSize: number; 
    byType: Record<string, number>;
    oldestItem?: string;
    newestItem?: string;
  } {
    const items = this.listFallbackItems();
    const byType: Record<string, number> = {};
    let totalSize = 0;
    
    items.forEach(item => {
      byType[item.type] = (byType[item.type] || 0) + 1;
      totalSize += item.size;
    });
    
    return {
      totalItems: items.length,
      totalSize,
      byType,
      oldestItem: items.length > 0 ? items[items.length - 1].timestamp : undefined,
      newestItem: items.length > 0 ? items[0].timestamp : undefined
    };
  }
  
  /**
   * Add item to index for easier management
   */
  private static addToIndex(fallbackId: string, type: string): void {
    try {
      const indexKey = this.STORAGE_PREFIX + 'index';
      const index = JSON.parse(localStorage.getItem(indexKey) || '{}');
      
      if (!index[type]) {
        index[type] = [];
      }
      
      index[type].push({
        id: fallbackId,
        timestamp: new Date().toISOString()
      });
      
      localStorage.setItem(indexKey, JSON.stringify(index));
    } catch (e) {
      console.warn('[local-fallback] Failed to update index:', e);
    }
  }
  
  /**
   * Remove item from index
   */
  private static removeFromIndex(fallbackId: string): void {
    try {
      const indexKey = this.STORAGE_PREFIX + 'index';
      const index = JSON.parse(localStorage.getItem(indexKey) || '{}');
      
      Object.keys(index).forEach(type => {
        index[type] = index[type].filter((item: any) => item.id !== fallbackId);
      });
      
      localStorage.setItem(indexKey, JSON.stringify(index));
    } catch (e) {
      console.warn('[local-fallback] Failed to update index:', e);
    }
  }
}

// Export convenience functions
export const storeInLocalFallback = LocalStorageFallback.store;
export const retrieveFromLocalFallback = LocalStorageFallback.retrieve;
export const listLocalFallbackItems = LocalStorageFallback.listFallbackItems;
export const clearLocalFallbackData = LocalStorageFallback.clearAllFallbackData;
export const getLocalFallbackStats = LocalStorageFallback.getStorageStats;
