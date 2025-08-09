import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { suiContractClient } from '@/lib/sui-contract';

const NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK as 'devnet' | 'testnet' | 'mainnet') || 'devnet';

export interface WalletTransaction {
  success: boolean;
  txDigest?: string;
  error?: string;
  events?: any[];
  objectChanges?: any[];
}

export class WalletIntegratedSuiClient {
  private client: SuiClient;

  constructor() {
    this.client = new SuiClient({
      url: getFullnodeUrl(NETWORK),
    });
  }

  /**
   * Get wallet keypair from private key
   */
  private getKeypair(privateKeyBase64: string): Ed25519Keypair {
    try {
      const privateKeyBytes = Buffer.from(privateKeyBase64, 'base64');
      return Ed25519Keypair.fromSecretKey(privateKeyBytes);
    } catch (error) {
      console.error('Failed to create keypair:', error);
      throw new Error('Invalid private key format');
    }
  }

  /**
   * Check if wallet has sufficient balance for transaction
   */
  async checkBalance(
    address: string, 
    requiredAmount: number = 0.001 // minimum SUI for gas
  ): Promise<{ hasBalance: boolean; balance: number; formattedBalance: string }> {
    try {
      const balance = await this.client.getBalance({ owner: address });
      const balanceInSui = parseInt(balance.totalBalance) / 1_000_000_000;
      
      return {
        hasBalance: balanceInSui >= requiredAmount,
        balance: balanceInSui,
        formattedBalance: balanceInSui.toFixed(4)
      };
    } catch (error) {
      console.error('Error checking balance:', error);
      return {
        hasBalance: false,
        balance: 0,
        formattedBalance: '0.0000'
      };
    }
  }

  /**
   * Purchase a carbon credit using the user's wallet
   */
  async purchaseCarbonCredit(
    privateKeyBase64: string,
    creditId: string,
    paymentAmountSui: number
  ): Promise<WalletTransaction> {
    try {
      const keypair = this.getKeypair(privateKeyBase64);
      const address = keypair.toSuiAddress();

      // Check balance first
      const balanceCheck = await this.checkBalance(address, paymentAmountSui + 0.01); // Add gas buffer
      if (!balanceCheck.hasBalance) {
        return {
          success: false,
          error: `Insufficient balance. Required: ${paymentAmountSui + 0.01} SUI, Available: ${balanceCheck.formattedBalance} SUI`
        };
      }

      // Convert SUI to MIST for payment
      const paymentAmountMist = Math.floor(paymentAmountSui * 1_000_000_000);

      const result = await suiContractClient.buyCarbonCredit(
        creditId,
        paymentAmountMist,
        keypair
      );

      return {
        success: result.success,
        txDigest: result.txDigest,
        events: result.events || [],
      };
    } catch (error) {
      console.error('Error purchasing carbon credit:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed'
      };
    }
  }

  /**
   * List a carbon credit for sale
   */
  async listCarbonCredit(
    privateKeyBase64: string,
    creditData: {
      projectId: string;
      co2Amount: number;
      price: number;
      location: string;
      projectType: string;
      description: string;
      methodology?: string;
      metadataUri?: string;
    }
  ): Promise<WalletTransaction> {
    try {
      const keypair = this.getKeypair(privateKeyBase64);
      const address = keypair.toSuiAddress();

      // Check balance for gas
      const balanceCheck = await this.checkBalance(address, 0.01);
      if (!balanceCheck.hasBalance) {
        return {
          success: false,
          error: `Insufficient balance for gas fees. Available: ${balanceCheck.formattedBalance} SUI`
        };
      }

      // First, mint the carbon credit
      const mintResult = await suiContractClient.mintCarbonCredit({
        projectId: creditData.projectId,
        serialNumber: `GV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        vintageYear: new Date().getFullYear(),
        quantity: creditData.co2Amount,
        methodology: creditData.methodology || 'GreenVault Standard v1.0',
        metadataUri: creditData.metadataUri || '',
        co2DataHash: Buffer.from(JSON.stringify(creditData)).toString('hex'),
        didAnchor: address, // Use wallet address as DID anchor
      }, keypair);

      if (!mintResult.success) {
        return {
          success: false,
          error: 'Failed to mint carbon credit'
        };
      }

      // Get the minted credit object ID from events
      const creditObjectId = this.extractCreditObjectId(mintResult.events || []);
      if (!creditObjectId) {
        return {
          success: false,
          error: 'Failed to extract credit object ID from mint transaction'
        };
      }

      // List the credit for sale
      const priceInMist = Math.floor(creditData.price * 1_000_000_000);
      const listResult = await suiContractClient.listCreditForSale(
        creditObjectId,
        priceInMist,
        false, // not reserved for community
        keypair
      );

      return {
        success: listResult.success,
        txDigest: listResult.txDigest,
        events: listResult.events || [],
      };
    } catch (error) {
      console.error('Error listing carbon credit:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed'
      };
    }
  }

  /**
   * Get user's owned carbon credits
   */
  async getUserCarbonCredits(address: string): Promise<any[]> {
    try {
      const objects = await this.client.getOwnedObjects({
        owner: address,
        filter: {
          StructType: `${process.env.SUI_PACKAGE_ID || '0x0'}::carbon_credit::CarbonCredit`
        },
        options: {
          showContent: true,
          showType: true,
        }
      });

      return objects.data.map(obj => ({
        id: obj.data?.objectId,
        ...obj.data?.content,
      }));
    } catch (error) {
      console.error('Error fetching user carbon credits:', error);
      return [];
    }
  }

  /**
   * Get transaction history for a wallet
   */
  async getTransactionHistory(
    address: string, 
    limit: number = 10
  ): Promise<any[]> {
    try {
      const txs = await this.client.queryTransactionBlocks({
        filter: {
          FromAddress: address,
        },
        limit,
        order: 'descending',
        options: {
          showEffects: true,
          showEvents: true,
          showInput: true,
        }
      });

      return txs.data.map(tx => ({
        digest: tx.digest,
        timestamp: tx.timestampMs,
        effects: tx.effects,
        events: tx.events,
      }));
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }

  /**
   * Helper method to extract credit object ID from events
   */
  private extractCreditObjectId(events: any[]): string | null {
    for (const event of events) {
      if (event.type?.includes('CarbonCreditMinted') || event.type?.includes('carbon_credit::CarbonCredit')) {
        return event.parsedJson?.object_id || event.parsedJson?.id || null;
      }
    }
    return null;
  }

  /**
   * Estimate gas cost for a transaction
   */
  async estimateGasCost(
    privateKeyBase64: string,
    transactionType: 'buy' | 'list' | 'mint'
  ): Promise<{ estimatedGas: number; formattedGas: string }> {
    try {
      // Return rough estimates based on transaction type
      const gasEstimates = {
        buy: 0.005, // 5 millionths of SUI
        list: 0.008, // 8 millionths of SUI  
        mint: 0.01,  // 10 millionths of SUI
      };

      const estimated = gasEstimates[transactionType] || 0.005;
      
      return {
        estimatedGas: estimated,
        formattedGas: estimated.toFixed(6)
      };
    } catch (error) {
      return {
        estimatedGas: 0.01,
        formattedGas: '0.010000'
      };
    }
  }
}

export const walletIntegratedSuiClient = new WalletIntegratedSuiClient();
