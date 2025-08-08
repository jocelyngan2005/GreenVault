// Utility functions for Sui address handling and testing
// This file provides helpers for working with Sui addresses in development and testing

/**
 * Validates if a string is a valid Sui address format
 */
export function isValidSuiAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  
  // Remove any whitespace
  address = address.trim();
  
  // Must start with 0x
  if (!address.startsWith('0x')) return false;
  
  // Check if the rest is valid hex and reasonable length
  const hexPart = address.slice(2);
  const hexPattern = /^[a-fA-F0-9]+$/;
  
  return hexPattern.test(hexPart) && hexPart.length > 0 && hexPart.length <= 64;
}

/**
 * Normalizes a Sui address to the standard format (32 bytes, padded with zeros)
 */
export function normalizeSuiAddress(address: string): string {
  if (!address.startsWith('0x')) {
    address = '0x' + address;
  }
  
  // Pad with leading zeros to make it 64 characters (32 bytes)
  const hexPart = address.slice(2);
  const paddedHex = hexPart.padStart(64, '0');
  return '0x' + paddedHex;
}

/**
 * Generates a valid test Sui address for development
 */
export function generateTestSuiAddress(): string {
  // Generate 32 random bytes (64 hex characters)
  const randomBytes = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(randomBytes);
  } else {
    // Fallback for Node.js environment
    for (let i = 0; i < 32; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  
  const hexString = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return '0x' + hexString;
}

/**
 * Shortens a Sui address for display purposes
 */
export function shortenAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address || address.length <= startChars + endChars + 2) {
    return address;
  }
  
  return `${address.slice(0, startChars + 2)}...${address.slice(-endChars)}`;
}

/**
 * Gets a valid user address for testing based on environment
 */
export function getTestUserAddress(): string {
  // Try to get from environment first
  const envAddress = process.env.NEXT_PUBLIC_USER_ADDRESS || process.env.SUI_ADDRESS;
  
  if (envAddress && isValidSuiAddress(envAddress)) {
    return normalizeSuiAddress(envAddress);
  }
  
  // Return a well-known test address if no valid address in env
  return normalizeSuiAddress('0x8bb97d1d0d737546178a54ea333fbb0e119b304d892301c7c0d2e7d2c36791e3');
}

/**
 * Validates and returns contract addresses from environment
 */
export function getContractAddresses() {
  const addresses = {
    packageId: process.env.NEXT_PUBLIC_SUI_PACKAGE_ID,
    projectRegistry: process.env.NEXT_PUBLIC_PROJECT_REGISTRY_ID,
    marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_ID,
    oracleRegistry: process.env.NEXT_PUBLIC_ORACLE_REGISTRY_ID,
    didManager: process.env.NEXT_PUBLIC_DID_MANAGER_ID,
    microSystem: process.env.NEXT_PUBLIC_MICRO_SYSTEM_ID,
  };

  // Validate all addresses
  const errors: string[] = [];
  Object.entries(addresses).forEach(([key, address]) => {
    if (address && !isValidSuiAddress(address)) {
      errors.push(`Invalid ${key}: ${address}`);
    }
  });

  return {
    addresses: Object.fromEntries(
      Object.entries(addresses).map(([key, address]) => [
        key,
        address && isValidSuiAddress(address) ? normalizeSuiAddress(address) : null
      ])
    ),
    errors,
    isValid: errors.length === 0
  };
}

/**
 * Formats Sui amounts for display
 */
export function formatSuiAmount(amount: number | string, decimals = 9): string {
  const numAmount = typeof amount === 'string' ? parseInt(amount) : amount;
  const suiAmount = numAmount / Math.pow(10, decimals);
  
  if (suiAmount < 0.001) {
    return '<0.001 SUI';
  }
  
  return `${suiAmount.toFixed(3)} SUI`;
}

/**
 * Converts SUI to mist (smallest unit)
 */
export function suiToMist(sui: number): number {
  return Math.floor(sui * 1_000_000_000);
}

/**
 * Converts mist to SUI
 */
export function mistToSui(mist: number): number {
  return mist / 1_000_000_000;
}

/**
 * Development helper to log contract configuration
 */
export function logContractConfig() {
  if (process.env.NODE_ENV !== 'development') return;
  
  const config = getContractAddresses();
  
  console.group('🔗 Smart Contract Configuration');
  console.log('Network:', process.env.NEXT_PUBLIC_SUI_NETWORK);
  console.log('Package ID:', config.addresses.packageId);
  console.log('Project Registry:', config.addresses.projectRegistry);
  console.log('Marketplace:', config.addresses.marketplace);
  console.log('Oracle Registry:', config.addresses.oracleRegistry);
  console.log('DID Manager:', config.addresses.didManager);
  console.log('Micro System:', config.addresses.microSystem);
  
  if (config.errors.length > 0) {
    console.warn('⚠️ Configuration errors:', config.errors);
  } else {
    console.log('✅ All addresses are valid');
  }
  
  console.groupEnd();
}

// Export test data for development
export const TEST_DATA = {
  userAddress: getTestUserAddress(),
  testProjects: [
    {
      projectId: 'TEST_FOREST_001',
      name: 'Test Forest Conservation',
      description: 'Test project for forest conservation',
      location: 'Test Location',
      projectType: 0,
      co2ReductionCapacity: 1000,
      oracleDataSource: 'test_oracle',
    },
    {
      projectId: 'TEST_SOLAR_001', 
      name: 'Test Solar Farm',
      description: 'Test solar energy project',
      location: 'Test Desert',
      projectType: 1,
      co2ReductionCapacity: 2000,
      oracleDataSource: 'test_oracle',
    }
  ],
  testCredits: [
    {
      projectId: 'TEST_FOREST_001',
      serialNumber: 'SER_TEST_001',
      vintageYear: 2024,
      quantity: 100,
      methodology: 'VCS-Test',
      metadataUri: 'https://test.metadata.com/1',
      co2DataHash: 'test_hash_001',
    }
  ]
};

/**
 * Generate a valid-looking Sui object ID for testing/development
 * In production, this would come from actual minted objects
 */
export function generateMockSuiObjectId(identifier: string): string {
  // Create a deterministic hash-like ID based on the identifier
  const hash = identifier.split('').reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) & 0xffffffff;
  }, 0);
  
  // Convert to hex and pad to 64 characters (32 bytes)
  const hexHash = Math.abs(hash).toString(16);
  const paddedHash = hexHash.padStart(64, '0');
  
  return `0x${paddedHash}`;
}

/**
 * Check if an object ID is a mock/test ID
 */
export function isMockObjectId(objectId: string): boolean {
  return objectId.includes('credit_') || 
         objectId.startsWith('0x00000000000000000000000000000000000000000000000000000000credit_') ||
         objectId.includes('mock_') ||
         (objectId.startsWith('0x') && objectId.length === 66 && objectId.endsWith('00000000'));
}
