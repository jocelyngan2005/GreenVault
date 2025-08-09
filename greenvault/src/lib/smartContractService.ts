// Smart Contract Service Layer
// This service provides a clean interface between frontend components and the smart contract API

export interface SmartContractResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  txDigest?: string;
  events?: any[];
  objectChanges?: any[];
}

export interface ProjectData {
  projectId: string;
  name: string;
  description: string;
  location: string;
  projectType: number;
  co2ReductionCapacity: number;
  beneficiaryCommunity?: string;
  oracleDataSource: string;
  didAnchor?: string;
}

export interface CarbonCreditData {
  projectId: string;
  serialNumber: string;
  vintageYear: number;
  quantity: number;
  methodology: string;
  metadataUri: string;
  co2DataHash: string;
  didAnchor?: string;
}

export interface ListCreditData {
  creditId: string;
  price: number;
  reservedForCommunity: boolean;
}

export interface BuyCreditData {
  creditId: string;
  paymentAmount: number;
}

export interface RetireCreditData {
  creditId: string;
  retirementReason: string;
}

export interface FractionalCreditData {
  creditId: string;
  totalFractions: number;
  pricePerFraction: number;
  minPurchase: number;
  treasuryCapId: string;
}

// Helper function to validate Sui address on client side
function isValidSuiAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  
  // Remove any whitespace
  address = address.trim();
  
  // Check if it starts with 0x
  if (!address.startsWith('0x')) return false;
  
  // Check if the rest is valid hex and reasonable length
  const hexPart = address.slice(2);
  const hexPattern = /^[a-fA-F0-9]+$/;
  
  return hexPattern.test(hexPart) && hexPart.length > 0 && hexPart.length <= 64;
}

class SmartContractService {
  private baseUrl = '/api/smart-contract';

  /**
   * Make a request to the smart contract API
   */
  private async makeRequest<T>(
    action: string,
    data: any,
    privateKey?: string
  ): Promise<SmartContractResponse<T>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          data,
          privateKey, // Let the API handle the fallback to ADMIN_PRIVATE_KEY
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || `Request failed with status ${response.status}`,
        };
      }

      return {
        success: true,
        data: result,
        txDigest: result.txDigest,
        events: result.events,
        objectChanges: result.objectChanges,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get user's carbon credits
   */
  async getUserCredits(userAddress: string): Promise<SmartContractResponse> {
    // Validate address format before making request
    if (!userAddress || !isValidSuiAddress(userAddress)) {
      return {
        success: false,
        error: 'Invalid user address. Please provide a valid Sui address starting with 0x',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}?address=${encodeURIComponent(userAddress)}`, {
        method: 'GET',
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to fetch user credits',
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  /**
   * Get general stats
   */
  async getStats(): Promise<SmartContractResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to fetch stats',
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get available credits for sale in marketplace
   */
  async getAvailableCredits(): Promise<SmartContractResponse> {
    try {
      const response = await fetch(`${this.baseUrl}?action=available_credits`);
      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to fetch available credits',
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  /**
   * Get minted credits for a specific user/project owner
   */
  async getMintedCredits(ownerAddress: string): Promise<SmartContractResponse> {
    if (!ownerAddress || !isValidSuiAddress(ownerAddress)) {
      return {
        success: false,
        error: 'Invalid owner address. Please provide a valid Sui address starting with 0x',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}?action=minted_credits&owner=${encodeURIComponent(ownerAddress)}`);
      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to fetch minted credits',
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  /**
   * Get registered projects for a specific user/project owner
   */
  async getRegisteredProjects(ownerAddress: string): Promise<SmartContractResponse> {
    if (!ownerAddress || !isValidSuiAddress(ownerAddress)) {
      return {
        success: false,
        error: 'Invalid owner address. Please provide a valid Sui address starting with 0x',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}?action=registered_projects&owner=${encodeURIComponent(ownerAddress)}`);
      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to fetch registered projects',
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  // === Carbon Credit Operations ===

  /**
   * Register a new carbon credit project
   */
  async registerProject(
    projectData: ProjectData,
    privateKey?: string
  ): Promise<SmartContractResponse> {
    return this.makeRequest('register_project', projectData, privateKey);
  }

  /**
   * Mint a new carbon credit
   */
  async mintCarbonCredit(
    creditData: CarbonCreditData,
    privateKey?: string
  ): Promise<SmartContractResponse> {
    return this.makeRequest('mint_credit', creditData, privateKey);
  }

  /**
   * List a carbon credit for sale
   */
  async listCreditForSale(
    listData: ListCreditData,
    privateKey?: string
  ): Promise<SmartContractResponse> {
    return this.makeRequest('list_credit', listData, privateKey);
  }

  /**
   * Buy a carbon credit
   */
  async buyCarbonCredit(
    buyData: BuyCreditData,
    privateKey?: string
  ): Promise<SmartContractResponse> {
    return this.makeRequest('buy_credit', buyData, privateKey);
  }

  /**
   * Retire a carbon credit
   */
  async retireCarbonCredit(
    retireData: RetireCreditData,
    privateKey?: string
  ): Promise<SmartContractResponse> {
    return this.makeRequest('retire_credit', retireData, privateKey);
  }

  /**
   * Verify a project
   */
  async verifyProject(
    projectId: string,
    privateKey?: string
  ): Promise<SmartContractResponse> {
    return this.makeRequest('verify_project', { projectId }, privateKey);
  }

  /**
   * Add a verified issuer
   */
  async addVerifiedIssuer(
    issuerAddress: string,
    privateKey?: string
  ): Promise<SmartContractResponse> {
    return this.makeRequest('add_issuer', { issuerAddress }, privateKey);
  }

  // === Fractional Credits Operations ===

  /**
   * Fractionalize a carbon credit
   */
  async fractionalizeCredit(
    fractionalData: FractionalCreditData,
    privateKey?: string
  ): Promise<SmartContractResponse> {
    return this.makeRequest('fractionalize_credit', fractionalData, privateKey);
  }

  /**
   * Purchase fractions of a carbon credit
   */
  async purchaseFractions(
    poolId: string,
    fractionsToBuy: number,
    paymentAmount: number,
    privateKey?: string
  ): Promise<SmartContractResponse> {
    return this.makeRequest(
      'purchase_fractions',
      { poolId, fractionsToBuy, paymentAmount },
      privateKey
    );
  }

  /**
   * Claim micro credits for sustainable actions
   */
  async claimMicroCredits(
    microSystemId: string,
    actionType: string,
    evidenceHash: string,
    treasuryCapId: string,
    privateKey?: string
  ): Promise<SmartContractResponse> {
    return this.makeRequest(
      'claim_micro_credits',
      { microSystemId, actionType, evidenceHash, treasuryCapId },
      privateKey
    );
  }

  /**
   * Retire fractions of carbon credits
   */
  async retireFractions(
    fractionsCoinId: string,
    retirementReason: string,
    treasuryCapId: string,
    privateKey?: string
  ): Promise<SmartContractResponse> {
    return this.makeRequest(
      'retire_fractions',
      { fractionsCoinId, retirementReason, treasuryCapId },
      privateKey
    );
  }

  // === DID Manager Operations ===

  /**
   * Create a new identity
   */
  async createIdentity(
    didManagerId: string,
    did: string,
    encryptedAttributes: string[],
    attributeKeys: string[],
    privacyHash: string,
    communityContext?: string,
    privateKey?: string
  ): Promise<SmartContractResponse> {
    return this.makeRequest(
      'create_identity',
      {
        didManagerId,
        did,
        encryptedAttributes,
        attributeKeys,
        privacyHash,
        communityContext,
      },
      privateKey
    );
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(
    didManagerId: string,
    publicProfile: boolean,
    shareReputation: boolean,
    allowCommunityVerification: boolean,
    dataRetentionDays: number,
    privateKey?: string
  ): Promise<SmartContractResponse> {
    return this.makeRequest(
      'update_privacy_settings',
      {
        didManagerId,
        publicProfile,
        shareReputation,
        allowCommunityVerification,
        dataRetentionDays,
      },
      privateKey
    );
  }

  /**
   * Record a sustainability action
   */
  async recordSustainabilityAction(
    didManagerId: string,
    actionType: string,
    creditsEarned: number,
    evidenceHash: string,
    privateKey?: string
  ): Promise<SmartContractResponse> {
    return this.makeRequest(
      'record_sustainability_action',
      { didManagerId, actionType, creditsEarned, evidenceHash },
      privateKey
    );
  }

  // === Oracle Integration Operations ===

  /**
   * Register an oracle
   */
  async registerOracle(
    oracleRegistryId: string,
    oracleAddress: string,
    stakeAmount: number,
    privateKey?: string
  ): Promise<SmartContractResponse> {
    return this.makeRequest(
      'register_oracle',
      { oracleRegistryId, oracleAddress, stakeAmount },
      privateKey
    );
  }

  /**
   * Request CO2 verification
   */
  async requestCO2Verification(
    projectId: string,
    measurementType: string,
    value: number,
    unit: string,
    locationHash: string,
    methodology: string,
    privateKey?: string
  ): Promise<SmartContractResponse> {
    return this.makeRequest(
      'request_co2_verification',
      { projectId, measurementType, value, unit, locationHash, methodology },
      privateKey
    );
  }

  /**
   * Submit oracle verification
   */
  async submitOracleVerification(
    oracleRegistryId: string,
    requestId: string,
    verifiedValue: number,
    confidence: number,
    evidenceHash: string,
    privateKey?: string
  ): Promise<SmartContractResponse> {
    return this.makeRequest(
      'submit_oracle_verification',
      { oracleRegistryId, requestId, verifiedValue, confidence, evidenceHash },
      privateKey
    );
  }

  // === Integration Bridge Operations ===

  /**
   * Initialize the integration hub
   */
  async initializeHub(
    carbonRegistryId: string,
    marketplaceId: string,
    oracleRegistryId: string,
    didManagerId: string,
    microSystemId: string,
    privateKey?: string
  ): Promise<SmartContractResponse> {
    return this.makeRequest(
      'initialize_hub',
      {
        carbonRegistryId,
        marketplaceId,
        oracleRegistryId,
        didManagerId,
        microSystemId,
      },
      privateKey
    );
  }

  /**
   * Register a verified project through the integration bridge
   */
  async registerVerifiedProject(
    hubId: string,
    registryId: string,
    oracleRegistryId: string,
    projectData: ProjectData & { measurementMethodology: string },
    privateKey?: string
  ): Promise<SmartContractResponse> {
    return this.makeRequest(
      'register_verified_project',
      { hubId, registryId, oracleRegistryId, ...projectData },
      privateKey
    );
  }

  /**
   * Onboard a community member
   */
  async onboardCommunityMember(
    hubId: string,
    didManagerId: string,
    microSystemId: string,
    did: string,
    encryptedAttributes: string[],
    attributeKeys: string[],
    privacyHash: string,
    communityContext?: string,
    privateKey?: string
  ): Promise<SmartContractResponse> {
    return this.makeRequest(
      'onboard_community_member',
      {
        hubId,
        didManagerId,
        microSystemId,
        did,
        encryptedAttributes,
        attributeKeys,
        privacyHash,
        communityContext,
      },
      privateKey
    );
  }

  /**
   * Generate an impact report
   */
  async generateImpactReport(
    hubId: string,
    registryId: string,
    marketplaceId: string,
    projectId: string,
    privateKey?: string
  ): Promise<SmartContractResponse> {
    return this.makeRequest(
      'generate_impact_report',
      { hubId, registryId, marketplaceId, projectId },
      privateKey
    );
  }
}

// Export a singleton instance
export const smartContractService = new SmartContractService();

// Export the class for custom instances
export default SmartContractService;
