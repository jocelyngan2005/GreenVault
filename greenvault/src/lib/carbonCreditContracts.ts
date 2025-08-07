// Carbon Credit Contract Integration
// This file exports the mock implementation to avoid blockchain dependency errors

// Re-export everything from the mock implementation
export * from './mockCarbonCreditContracts';

// Also export with the expected name for compatibility
export { MockCarbonCreditContractClient as CarbonCreditContractClient } from './mockCarbonCreditContracts';
