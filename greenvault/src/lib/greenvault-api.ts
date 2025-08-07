// Frontend utility for calling smart contract and oracle APIs
import type { 
  SmartContractRequest, 
  OracleRequest, 
  SuiTransactionResult,
  ProjectData,
  CarbonCreditData,
  OracleVerificationRequest,
  ExternalDataRequest 
} from '@/types/sui';

const API_BASE = '/api';

/**
 * Smart Contract API calls
 */
export class GreenVaultAPI {
  
  /**
   * Register a new carbon offset project
   */
  static async registerProject(
    projectData: ProjectData, 
    privateKey: string
  ): Promise<SuiTransactionResult> {
    const request: SmartContractRequest = {
      action: 'register_project',
      data: projectData,
      privateKey,
    };

    const response = await fetch(`${API_BASE}/smart-contract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    return response.json();
  }

  /**
   * Mint carbon credit NFT
   */
  static async mintCarbonCredit(
    creditData: CarbonCreditData, 
    privateKey: string
  ): Promise<SuiTransactionResult> {
    const request: SmartContractRequest = {
      action: 'mint_credit',
      data: creditData,
      privateKey,
    };

    const response = await fetch(`${API_BASE}/smart-contract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    return response.json();
  }

  /**
   * List carbon credit for sale
   */
  static async listCreditForSale(
    creditId: string,
    price: number,
    reservedForCommunity: boolean,
    privateKey: string
  ): Promise<SuiTransactionResult> {
    const request: SmartContractRequest = {
      action: 'list_credit',
      data: { creditId, price, reservedForCommunity },
      privateKey,
    };

    const response = await fetch(`${API_BASE}/smart-contract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    return response.json();
  }

  /**
   * Buy carbon credit
   */
  static async buyCarbonCredit(
    creditId: string,
    paymentAmount: number,
    privateKey: string
  ): Promise<SuiTransactionResult> {
    const request: SmartContractRequest = {
      action: 'buy_credit',
      data: { creditId, paymentAmount },
      privateKey,
    };

    const response = await fetch(`${API_BASE}/smart-contract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    return response.json();
  }

  /**
   * Retire carbon credit
   */
  static async retireCarbonCredit(
    creditId: string,
    retirementReason: string,
    privateKey: string
  ): Promise<SuiTransactionResult> {
    const request: SmartContractRequest = {
      action: 'retire_credit',
      data: { creditId, retirementReason },
      privateKey,
    };

    const response = await fetch(`${API_BASE}/smart-contract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    return response.json();
  }

  /**
   * Verify project (admin function)
   */
  static async verifyProject(
    projectId: string,
    privateKey: string
  ): Promise<SuiTransactionResult> {
    const request: SmartContractRequest = {
      action: 'verify_project',
      data: { projectId },
      privateKey,
    };

    const response = await fetch(`${API_BASE}/smart-contract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    return response.json();
  }

  /**
   * Add verified issuer (admin function)
   */
  static async addVerifiedIssuer(
    issuerAddress: string,
    privateKey: string
  ): Promise<SuiTransactionResult> {
    const request: SmartContractRequest = {
      action: 'add_issuer',
      data: { issuerAddress },
      privateKey,
    };

    const response = await fetch(`${API_BASE}/smart-contract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    return response.json();
  }

  /**
   * Get marketplace and registry statistics
   */
  static async getStats(): Promise<any> {
    const response = await fetch(`${API_BASE}/smart-contract?action=stats`, {
      method: 'GET',
    });

    return response.json();
  }

  /**
   * Get user's carbon credits
   */
  static async getUserCredits(address: string): Promise<any> {
    const response = await fetch(`${API_BASE}/smart-contract?address=${address}`, {
      method: 'GET',
    });

    return response.json();
  }
}

/**
 * Oracle API calls
 */
export class OracleAPI {
  
  /**
   * Request CO2 verification from oracle
   */
  static async requestVerification(
    verificationData: OracleVerificationRequest,
    privateKey: string
  ): Promise<SuiTransactionResult> {
    const request: OracleRequest = {
      action: 'request_verification',
      data: verificationData,
      privateKey,
    };

    const response = await fetch(`${API_BASE}/oracle/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    return response.json();
  }

  /**
   * Submit oracle verification data
   */
  static async submitVerification(
    requestId: string,
    verifiedValue: number,
    confidence: number,
    evidenceHash: string,
    privateKey: string
  ): Promise<SuiTransactionResult> {
    const request: OracleRequest = {
      action: 'submit_oracle_data',
      data: { requestId, verifiedValue, confidence, evidenceHash },
      privateKey,
    };

    const response = await fetch(`${API_BASE}/oracle/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    return response.json();
  }

  /**
   * Register oracle
   */
  static async registerOracle(
    oracleAddress: string,
    stakeAmount: number,
    privateKey: string
  ): Promise<SuiTransactionResult> {
    const request: OracleRequest = {
      action: 'register_oracle',
      data: { oracleAddress, stakeAmount },
      privateKey,
    };

    const response = await fetch(`${API_BASE}/oracle/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    return response.json();
  }

  /**
   * Fetch external CO2 data
   */
  static async fetchExternalData(
    source: 'verra' | 'gold_standard' | 'oasis' | 'satellite',
    projectId: string,
    options?: { dataType?: string; location?: string }
  ): Promise<any> {
    const request: OracleRequest = {
      action: 'fetch_external_data',
      data: {
        source,
        projectId,
        ...options,
      },
    };

    const response = await fetch(`${API_BASE}/oracle/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    return response.json();
  }

  /**
   * Get oracle statistics
   */
  static async getOracleStats(): Promise<any> {
    const response = await fetch(`${API_BASE}/oracle/verify?action=oracle_stats`, {
      method: 'GET',
    });

    return response.json();
  }

  /**
   * Get data feeds
   */
  static async getDataFeeds(): Promise<any> {
    const response = await fetch(`${API_BASE}/oracle/verify?action=data_feeds`, {
      method: 'GET',
    });

    return response.json();
  }

  /**
   * Get pending verifications
   */
  static async getPendingVerifications(): Promise<any> {
    const response = await fetch(`${API_BASE}/oracle/verify?action=pending_verifications`, {
      method: 'GET',
    });

    return response.json();
  }
}

/**
 * Utility functions
 */
export class GreenVaultUtils {
  
  /**
   * Generate a sample project for testing
   */
  static generateSampleProject(): ProjectData {
    const projectId = `PROJ_${Date.now()}`;
    return {
      projectId,
      name: `Reforestation Project ${projectId}`,
      description: 'Community-led reforestation initiative in rural areas',
      location: 'Kenya, East Africa',
      projectType: 0, // Reforestation
      co2ReductionCapacity: 1000, // 1000 tons CO2 per year
      beneficiaryCommunity: 'Local farming community',
      oracleDataSource: 'satellite_imagery',
      didAnchor: undefined,
    };
  }

  /**
   * Generate sample carbon credit data
   */
  static generateSampleCarbonCredit(projectId: string): CarbonCreditData {
    const serialNumber = `CC_${Date.now()}`;
    return {
      projectId,
      serialNumber,
      vintageYear: 2024,
      quantity: 100, // 100 tons CO2
      methodology: 'VCS-v4.0',
      metadataUri: `https://metadata.greenvault.org/${serialNumber}`,
      co2DataHash: Buffer.from(`co2_data_${serialNumber}`).toString('hex'),
      didAnchor: undefined,
    };
  }

  /**
   * Generate sample oracle verification request
   */
  static generateSampleVerificationRequest(projectId: string): OracleVerificationRequest {
    return {
      projectId,
      measurementType: 'co2_sequestered',
      value: 1000,
      unit: 'tons_co2_per_year',
      locationHash: Buffer.from(`location_${projectId}`).toString('hex'),
      methodology: 'satellite_forest_monitoring',
    };
  }
}

// Export everything for easy importing
export {
  type SmartContractRequest,
  type OracleRequest,
  type SuiTransactionResult,
  type ProjectData,
  type CarbonCreditData,
  type OracleVerificationRequest,
  type ExternalDataRequest,
};
