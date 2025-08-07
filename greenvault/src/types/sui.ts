// Types for Sui smart contract interactions
export interface SuiTransactionResult {
  success: boolean;
  txDigest?: string;
  events?: any[];
  objectChanges?: any[];
  error?: string;
  details?: string;
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

export interface ProjectData {
  projectId: string;
  name: string;
  description: string;
  location: string;
  projectType: number; // 0: Reforestation, 1: Clean Cooking, 2: Renewable Energy, etc.
  co2ReductionCapacity: number;
  beneficiaryCommunity?: string;
  oracleDataSource: string;
  didAnchor?: string;
}

export interface ListingData {
  creditId: string;
  price: number;
  reservedForCommunity: boolean;
}

export interface PurchaseData {
  creditId: string;
  paymentAmount: number;
}

export interface RetirementData {
  creditId: string;
  retirementReason: string;
}

export interface VerificationData {
  projectId: string;
}

export interface IssuerData {
  issuerAddress: string;
}

// Oracle types
export interface OracleVerificationRequest {
  projectId: string;
  measurementType: string;
  value: number;
  unit: string;
  locationHash: string;
  methodology: string;
}

export interface OracleSubmission {
  requestId: string;
  verifiedValue: number;
  confidence: number;
  evidenceHash: string;
}

export interface OracleRegistration {
  oracleAddress: string;
  stakeAmount: number;
}

export interface DataFeedUpdate {
  feedId: string;
  dataType: number;
  value: number;
  sourceHash: string;
}

export interface ExternalDataRequest {
  source: 'verra' | 'gold_standard' | 'oasis' | 'satellite';
  projectId: string;
  dataType?: string;
  location?: string;
}

export interface VerraData {
  projectId: string;
  co2Sequestered: number;
  verificationDate: string;
  methodology: string;
  vintage: number;
  status: string;
}

export interface GoldStandardData {
  projectId: string;
  emissionReductions: number;
  verificationDate: string;
  methodology: string;
  vintage: number;
  status: string;
}

export interface SatelliteData {
  projectId: string;
  forestCoverage: number;
  co2Absorption: number;
  measurementDate: string;
  satellite: string;
  resolution: string;
  confidence: number;
}

export interface OracleStats {
  totalOracles: number;
  activeOracles: number;
  totalVerifications: number;
  averageConfidence: number;
  dataFeeds: DataFeed[];
}

export interface DataFeed {
  id: string;
  value: number;
  timestamp: number;
}

export interface PendingVerification {
  id: string;
  projectId: string;
  measurementType: string;
  value: number;
  status: 'pending' | 'verified' | 'rejected';
  requiredConfirmations: number;
  currentConfirmations: number;
}

// Contract interaction requests
export interface SmartContractRequest {
  action: 'register_project' | 'mint_credit' | 'list_credit' | 'buy_credit' | 'retire_credit' | 'verify_project' | 'add_issuer' | 'get_stats';
  data: ProjectData | CarbonCreditData | ListingData | PurchaseData | RetirementData | VerificationData | IssuerData;
  privateKey: string;
}

export interface OracleRequest {
  action: 'request_verification' | 'submit_oracle_data' | 'register_oracle' | 'update_data_feed' | 'get_verification_status' | 'fetch_external_data';
  data: OracleVerificationRequest | OracleSubmission | OracleRegistration | DataFeedUpdate | { requestId: string } | ExternalDataRequest;
  privateKey?: string;
}
