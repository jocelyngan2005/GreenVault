import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { normalizeSuiAddress } from '@mysten/sui/utils';

// Contract package ID (will be set after deployment)
const PACKAGE_ID = process.env.SUI_PACKAGE_ID || '0x0';
const NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK as 'devnet' | 'testnet' | 'mainnet' || 'devnet';

// Initialize Sui client
const suiClient = new SuiClient({
  url: getFullnodeUrl(NETWORK),
});

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
  projectType: number;
  co2ReductionCapacity: number;
  beneficiaryCommunity?: string;
  oracleDataSource: string;
  didAnchor?: string;
}

export class SuiContractClient {
  private client: SuiClient;
  private packageId: string;

  constructor() {
    this.client = suiClient;
    this.packageId = PACKAGE_ID;
  }

  /**
   * Register a new carbon offset project
   */
  async registerProject(
    projectData: ProjectData,
    signerKeyPair: Ed25519Keypair
  ) {
    try {
      const tx = new Transaction();
      
      // Get shared objects (registry)
      const registryObjects = await this.getSharedObjects('ProjectRegistry');
      if (registryObjects.length === 0) {
        throw new Error('ProjectRegistry not found');
      }

      const registryId = registryObjects[0].data?.objectId;
      if (!registryId) {
        throw new Error('Registry object ID not found');
      }

      tx.moveCall({
        target: `${this.packageId}::carbon_credit::register_project`,
        arguments: [
          tx.object(registryId),
          tx.pure.string(projectData.projectId),
          tx.pure.string(projectData.name),
          tx.pure.string(projectData.description),
          tx.pure.string(projectData.location),
          tx.pure.u8(projectData.projectType),
          tx.pure.u64(projectData.co2ReductionCapacity),
          tx.pure.option('string', projectData.beneficiaryCommunity),
          tx.pure.string(projectData.oracleDataSource),
          tx.pure.option('string', projectData.didAnchor),
        ],
      });

      const result = await this.client.signAndExecuteTransaction({
        signer: signerKeyPair,
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      return {
        success: true,
        txDigest: result.digest,
        events: result.events,
      };
    } catch (error) {
      console.error('Error registering project:', error);
      throw error;
    }
  }

  /**
   * Mint carbon credit NFT
   */
  async mintCarbonCredit(
    creditData: CarbonCreditData,
    signerKeyPair: Ed25519Keypair
  ) {
    try {
      const tx = new Transaction();
      
      // Get shared objects (registry)
      const registryObjects = await this.getSharedObjects('ProjectRegistry');
      if (registryObjects.length === 0) {
        throw new Error('ProjectRegistry not found');
      }

      const registryId = registryObjects[0].data?.objectId;
      if (!registryId) {
        throw new Error('Registry object ID not found');
      }

      tx.moveCall({
        target: `${this.packageId}::carbon_credit::mint_carbon_credit`,
        arguments: [
          tx.object(registryId),
          tx.pure.string(creditData.projectId),
          tx.pure.string(creditData.serialNumber),
          tx.pure.u16(creditData.vintageYear),
          tx.pure.u64(creditData.quantity),
          tx.pure.string(creditData.methodology),
          tx.pure.string(creditData.metadataUri),
          tx.pure.vector('u8', Array.from(Buffer.from(creditData.co2DataHash, 'hex'))),
          tx.pure.option('string', creditData.didAnchor),
        ],
      });

      const result = await this.client.signAndExecuteTransaction({
        signer: signerKeyPair,
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
      });

      return {
        success: true,
        txDigest: result.digest,
        events: result.events,
        objectChanges: result.objectChanges,
      };
    } catch (error) {
      console.error('Error minting carbon credit:', error);
      throw error;
    }
  }

  /**
   * List carbon credit for sale
   */
  async listCreditForSale(
    creditObjectId: string,
    price: number,
    reservedForCommunity: boolean,
    signerKeyPair: Ed25519Keypair
  ) {
    try {
      const tx = new Transaction();
      
      // Get marketplace
      const marketplaceObjects = await this.getSharedObjects('Marketplace');
      if (marketplaceObjects.length === 0) {
        throw new Error('Marketplace not found');
      }

      const marketplaceId = marketplaceObjects[0].data?.objectId;
      if (!marketplaceId) {
        throw new Error('Marketplace object ID not found');
      }

      tx.moveCall({
        target: `${this.packageId}::carbon_credit::list_credit_for_sale`,
        arguments: [
          tx.object(marketplaceId),
          tx.object(creditObjectId),
          tx.pure.u64(price),
          tx.pure.bool(reservedForCommunity),
        ],
      });

      const result = await this.client.signAndExecuteTransaction({
        signer: signerKeyPair,
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      return {
        success: true,
        txDigest: result.digest,
        events: result.events,
      };
    } catch (error) {
      console.error('Error listing credit for sale:', error);
      throw error;
    }
  }

  /**
   * Buy carbon credit
   */
  async buyCarbonCredit(
    creditId: string,
    paymentAmount: number,
    signerKeyPair: Ed25519Keypair
  ) {
    try {
      const tx = new Transaction();
      
      // Get marketplace
      const marketplaceObjects = await this.getSharedObjects('Marketplace');
      if (marketplaceObjects.length === 0) {
        throw new Error('Marketplace not found');
      }

      const marketplaceId = marketplaceObjects[0].data?.objectId;
      if (!marketplaceId) {
        throw new Error('Marketplace object ID not found');
      }

      // Split coin for payment
      const [paymentCoin] = tx.splitCoins(tx.gas, [paymentAmount]);

      tx.moveCall({
        target: `${this.packageId}::carbon_credit::buy_credit`,
        arguments: [
          tx.object(marketplaceId),
          tx.pure.id(creditId),
          paymentCoin,
        ],
      });

      const result = await this.client.signAndExecuteTransaction({
        signer: signerKeyPair,
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      return {
        success: true,
        txDigest: result.digest,
        events: result.events,
      };
    } catch (error) {
      console.error('Error buying carbon credit:', error);
      throw error;
    }
  }

  /**
   * Retire carbon credit
   */
  async retireCarbonCredit(
    creditObjectId: string,
    retirementReason: string,
    signerKeyPair: Ed25519Keypair
  ) {
    try {
      const tx = new Transaction();
      
      // Get registry
      const registryObjects = await this.getSharedObjects('ProjectRegistry');
      if (registryObjects.length === 0) {
        throw new Error('ProjectRegistry not found');
      }

      const registryId = registryObjects[0].data?.objectId;
      if (!registryId) {
        throw new Error('Registry object ID not found');
      }

      tx.moveCall({
        target: `${this.packageId}::carbon_credit::retire_credit`,
        arguments: [
          tx.object(registryId),
          tx.object(creditObjectId),
          tx.pure.string(retirementReason),
        ],
      });

      const result = await this.client.signAndExecuteTransaction({
        signer: signerKeyPair,
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      return {
        success: true,
        txDigest: result.digest,
        events: result.events,
      };
    } catch (error) {
      console.error('Error retiring carbon credit:', error);
      throw error;
    }
  }

  /**
   * Verify project (admin function)
   */
  async verifyProject(
    projectId: string,
    signerKeyPair: Ed25519Keypair
  ) {
    try {
      const tx = new Transaction();
      
      const registryObjects = await this.getSharedObjects('ProjectRegistry');
      if (registryObjects.length === 0) {
        throw new Error('ProjectRegistry not found');
      }

      const registryId = registryObjects[0].data?.objectId;
      if (!registryId) {
        throw new Error('Registry object ID not found');
      }

      tx.moveCall({
        target: `${this.packageId}::carbon_credit::verify_project`,
        arguments: [
          tx.object(registryId),
          tx.pure.string(projectId),
        ],
      });

      const result = await this.client.signAndExecuteTransaction({
        signer: signerKeyPair,
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      return {
        success: true,
        txDigest: result.digest,
        events: result.events,
      };
    } catch (error) {
      console.error('Error verifying project:', error);
      throw error;
    }
  }

  /**
   * Add verified issuer (admin function)
   */
  async addVerifiedIssuer(
    issuerAddress: string,
    signerKeyPair: Ed25519Keypair
  ) {
    try {
      const tx = new Transaction();
      
      const registryObjects = await this.getSharedObjects('ProjectRegistry');
      if (registryObjects.length === 0) {
        throw new Error('ProjectRegistry not found');
      }

      const registryId = registryObjects[0].data?.objectId;
      if (!registryId) {
        throw new Error('Registry object ID not found');
      }

      tx.moveCall({
        target: `${this.packageId}::carbon_credit::add_verified_issuer`,
        arguments: [
          tx.object(registryId),
          tx.pure.address(normalizeSuiAddress(issuerAddress)),
        ],
      });

      const result = await this.client.signAndExecuteTransaction({
        signer: signerKeyPair,
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      return {
        success: true,
        txDigest: result.digest,
        events: result.events,
      };
    } catch (error) {
      console.error('Error adding verified issuer:', error);
      throw error;
    }
  }

  /**
   * Get marketplace statistics
   */
  async getMarketplaceStats() {
    try {
      const marketplaceObjects = await this.getSharedObjects('Marketplace');
      if (marketplaceObjects.length === 0) {
        throw new Error('Marketplace not found');
      }

      const marketplaceId = marketplaceObjects[0].data?.objectId;
      if (!marketplaceId) {
        throw new Error('Marketplace object ID not found');
      }

      const marketplace = await this.client.getObject({
        id: marketplaceId,
        options: { showContent: true },
      });

      return marketplace;
    } catch (error) {
      console.error('Error getting marketplace stats:', error);
      throw error;
    }
  }

  /**
   * Get registry statistics
   */
  async getRegistryStats() {
    try {
      const registryObjects = await this.getSharedObjects('ProjectRegistry');
      if (registryObjects.length === 0) {
        throw new Error('ProjectRegistry not found');
      }

      const registryId = registryObjects[0].data?.objectId;
      if (!registryId) {
        throw new Error('Registry object ID not found');
      }

      const registry = await this.client.getObject({
        id: registryId,
        options: { showContent: true },
      });

      return registry;
    } catch (error) {
      console.error('Error getting registry stats:', error);
      throw error;
    }
  }

  /**
   * Helper method to get shared objects by type
   */
  private async getSharedObjects(structName: string) {
    try {
      const objects = await this.client.getOwnedObjects({
        owner: normalizeSuiAddress('0x0'), // Shared objects
        filter: {
          StructType: `${this.packageId}::carbon_credit::${structName}`,
        },
        options: {
          showType: true,
          showContent: true,
        },
      });

      return objects.data;
    } catch (error) {
      console.error(`Error getting ${structName} objects:`, error);
      return [];
    }
  }

  /**
   * Get user's carbon credits
   */
  async getUserCarbonCredits(userAddress: string) {
    try {
      const objects = await this.client.getOwnedObjects({
        owner: normalizeSuiAddress(userAddress),
        filter: {
          StructType: `${this.packageId}::carbon_credit::CarbonCredit`,
        },
        options: {
          showType: true,
          showContent: true,
        },
      });

      return objects.data;
    } catch (error) {
      console.error('Error getting user carbon credits:', error);
      throw error;
    }
  }
}

export const suiContractClient = new SuiContractClient();

// Export individual functions for easier use in API routes
export const mintCarbonCredit = (data: CarbonCreditData, signer: Ed25519Keypair) => 
  suiContractClient.mintCarbonCredit(data, signer);

export const registerProject = (data: ProjectData, signer: Ed25519Keypair) => 
  suiContractClient.registerProject(data, signer);

export const listCreditForSale = (creditId: string, price: number, reserved: boolean, signer: Ed25519Keypair) => 
  suiContractClient.listCreditForSale(creditId, price, reserved, signer);

export const buyCarbonCredit = (creditId: string, amount: number, signer: Ed25519Keypair) => 
  suiContractClient.buyCarbonCredit(creditId, amount, signer);

export const retireCarbonCredit = (creditId: string, reason: string, signer: Ed25519Keypair) => 
  suiContractClient.retireCarbonCredit(creditId, reason, signer);
