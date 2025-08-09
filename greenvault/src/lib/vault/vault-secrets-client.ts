import type { VaultSecret, VaultSecretsData } from '@/app/api/vault/secrets/route';

export interface AddSecretRequest {
  title: string;
  username: string;
  password: string;
  category?: string;
  notes?: string;
  url?: string;
}

export interface UpdateSecretRequest {
  title?: string;
  username?: string;
  password?: string;
  category?: string;
  notes?: string;
  url?: string;
}

export class VaultSecretsClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/vault/secrets';
  }

  /**
   * Get all secrets for a user
   */
  async getSecrets(userId: string, userKey: string): Promise<VaultSecretsData> {
    try {
      const response = await fetch(`${this.baseUrl}?userId=${encodeURIComponent(userId)}&userKey=${encodeURIComponent(userKey)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get secrets: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get secrets');
      }

      return result.data;
    } catch (error) {
      console.error('[vault-secrets-client] Failed to get secrets:', error);
      throw error;
    }
  }

  /**
   * Add a new secret
   */
  async addSecret(userId: string, userKey: string, secret: AddSecretRequest): Promise<{ secret: VaultSecret; totalSecrets: number }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          userKey,
          secret,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add secret: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add secret');
      }

      return result.data;
    } catch (error) {
      console.error('[vault-secrets-client] Failed to add secret:', error);
      throw error;
    }
  }

  /**
   * Update an existing secret
   */
  async updateSecret(userId: string, userKey: string, secretId: string, updates: UpdateSecretRequest): Promise<{ secret: VaultSecret; totalSecrets: number }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          userKey,
          secretId,
          updates,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update secret: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update secret');
      }

      return result.data;
    } catch (error) {
      console.error('[vault-secrets-client] Failed to update secret:', error);
      throw error;
    }
  }

  /**
   * Delete a secret
   */
  async deleteSecret(userId: string, userKey: string, secretId: string): Promise<{ deletedSecret: VaultSecret; totalSecrets: number }> {
    try {
      const response = await fetch(`${this.baseUrl}?userId=${encodeURIComponent(userId)}&userKey=${encodeURIComponent(userKey)}&secretId=${encodeURIComponent(secretId)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete secret: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete secret');
      }

      return result.data;
    } catch (error) {
      console.error('[vault-secrets-client] Failed to delete secret:', error);
      throw error;
    }
  }

  /**
   * Search secrets by category
   */
  searchSecretsByCategory(secrets: VaultSecret[], category: string): VaultSecret[] {
    if (!category || category === 'All') {
      return secrets;
    }
    return secrets.filter(secret => secret.category === category);
  }

  /**
   * Search secrets by title or username
   */
  searchSecretsByText(secrets: VaultSecret[], searchText: string): VaultSecret[] {
    if (!searchText) {
      return secrets;
    }
    
    const lowerSearchText = searchText.toLowerCase();
    return secrets.filter(secret => 
      secret.title.toLowerCase().includes(lowerSearchText) ||
      secret.username.toLowerCase().includes(lowerSearchText) ||
      (secret.notes && secret.notes.toLowerCase().includes(lowerSearchText))
    );
  }

  /**
   * Get unique categories from secrets
   */
  getCategories(secrets: VaultSecret[]): string[] {
    const categories = new Set(secrets.map(secret => secret.category));
    return Array.from(categories).sort();
  }

  /**
   * Generate a secure password
   */
  generateSecurePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }

  /**
   * Validate secret data
   */
  validateSecret(secret: AddSecretRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!secret.title || secret.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (!secret.username || secret.username.trim().length === 0) {
      errors.push('Username is required');
    }

    if (!secret.password || secret.password.trim().length === 0) {
      errors.push('Password is required');
    }

    if (secret.title && secret.title.length > 100) {
      errors.push('Title must be less than 100 characters');
    }

    if (secret.username && secret.username.length > 100) {
      errors.push('Username must be less than 100 characters');
    }

    if (secret.password && secret.password.length > 500) {
      errors.push('Password must be less than 500 characters');
    }

    if (secret.notes && secret.notes.length > 1000) {
      errors.push('Notes must be less than 1000 characters');
    }

    if (secret.url && secret.url.length > 500) {
      errors.push('URL must be less than 500 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const vaultSecretsClient = new VaultSecretsClient();
