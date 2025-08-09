// Vault tag categories
export type VaultTag = 'personal' | 'development' | 'financial' | 'social';

export const VAULT_TAGS: readonly VaultTag[] = ['personal', 'development', 'financial', 'social'] as const;

export interface VaultEntry {
  id: string;
  title: string; // e.g., "Google", "GitHub", "Microsoft", etc.
  username: string; // or email
  password: string;
  createdAt: string;
  updatedAt: string;
  tags?: VaultTag[];
}

export interface VaultData {
  entries: VaultEntry[];
  metadata: {
    userId: string;
    totalEntries: number;
    createdAt: string;
    lastUpdated: string;
    version: string;
  };
}

export interface SealedVaultData {
  sealedData: string;
  blobId: string;
  metadata: {
    userId: string;
    totalEntries: number;
    createdAt: string;
    lastUpdated: string;
    version: string;
  };
}

export interface VaultEntryInput {
  title: string;
  username: string;
  password: string;
  tags?: VaultTag[];
}

export interface VaultSearchQuery {
  title?: string;
  username?: string;
  tags?: VaultTag[];
}

export interface VaultStats {
  totalEntries: number;
  recentEntries: number;
  uniqueTags: VaultTag[];
  lastUpdated: string;
}

// Utility functions for tag validation
export function isValidVaultTag(tag: string): tag is VaultTag {
  return VAULT_TAGS.includes(tag as VaultTag);
}

export function validateVaultTags(tags: string[]): VaultTag[] {
  return tags.filter(isValidVaultTag);
}

export function getTagDisplayName(tag: VaultTag): string {
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}
