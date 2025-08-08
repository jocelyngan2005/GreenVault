// src/lib/oasis-client.ts
import { JsonRpcProvider, Wallet, Contract, formatEther, parseEther } from 'ethers';

export class OasisClient {
  private provider: JsonRpcProvider;
  private wallet: Wallet | null = null;
  private contract: Contract | null = null;

  constructor() {
    const rpcUrl = process.env.OASIS_RPC_URL || 'https://testnet.sapphire.oasis.io';
    
    // Create provider for Oasis Sapphire network
    this.provider = new JsonRpcProvider(rpcUrl);
    
    // Initialize wallet if private key is provided
    if (process.env.OASIS_PRIVATE_KEY) {
      this.wallet = new Wallet(process.env.OASIS_PRIVATE_KEY, this.provider);
    }

    // Initialize contract if address and wallet are available
    if (process.env.OASIS_CONTRACT_ADDRESS && this.wallet) {
      this.initializeContract();
    }
  }

  private initializeContract() {
    if (!this.wallet || !process.env.OASIS_CONTRACT_ADDRESS) return;

    // Oracle Contract ABI (based on your integration script)
    const oracleABI = [
      "function submitCO2Data(string projectId, uint256 co2Amount, bytes32 dataHash, uint256 timestamp) external",
      "function getCO2Data(string projectId) external view returns (uint256, bytes32, uint256)",
      "function verifyDataIntegrity(bytes32 dataHash, bytes signature) external view returns (bool)",
      "function updateOracle(address newOracle) external",
      "function owner() external view returns (address)",
      "function lastUpdated() external view returns (uint256)",
      "event CO2DataSubmitted(string indexed projectId, uint256 amount, address oracle)",
      "event OracleUpdated(address oldOracle, address newOracle)"
    ];

    this.contract = new Contract(
      process.env.OASIS_CONTRACT_ADDRESS,
      oracleABI,
      this.wallet
    );
  }

  /**
   * Query blockchain data directly from Oasis node
   */
  async queryBlockchainData(options: {
    method: string;
    params?: any[];
    blockTag?: string | number;
  }) {
    try {
      const result = await this.provider.send(options.method, options.params || []);
      return {
        success: true,
        data: result,
        source: 'oasis_node',
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Oasis node query error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'oasis_node'
      };
    }
  }

  /**
   * Get CO2 data from deployed oracle contract
   */
  async getCO2DataFromContract(projectId: string) {
    if (!this.contract) {
      throw new Error('Oracle contract not initialized');
    }

    try {
      const [amount, dataHash, timestamp] = await this.contract.getCO2Data(projectId);
      
      return {
        success: true,
        data: {
          projectId,
          co2Amount: Number(formatEther(amount)), // Convert from wei if needed
          dataHash,
          timestamp: Number(timestamp),
          verificationDate: new Date(Number(timestamp) * 1000).toISOString()
        },
        source: 'oasis_contract'
      };
    } catch (error) {
      console.error('Contract query error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Contract query failed',
        source: 'oasis_contract'
      };
    }
  }

  /**
   * Submit CO2 data to oracle contract
   */
  async submitCO2Data(projectId: string, co2Amount: number, dataHash: string) {
    if (!this.contract || !this.wallet) {
      throw new Error('Oracle contract or wallet not initialized');
    }

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const amountWei = parseEther(co2Amount.toString());
      
      const tx = await this.contract.submitCO2Data(
        projectId,
        amountWei,
        dataHash,
        timestamp
      );

      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        data: {
          projectId,
          co2Amount,
          dataHash,
          timestamp
        },
        source: 'oasis_contract'
      };
    } catch (error) {
      console.error('Contract submission error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Contract submission failed',
        source: 'oasis_contract'
      };
    }
  }

  /**
   * Get network information
   */
  async getNetworkInfo() {
    try {
      const [network, blockNumber, gasPrice] = await Promise.all([
        this.provider.getNetwork(),
        this.provider.getBlockNumber(),
        this.provider.getFeeData()
      ]);

      return {
        success: true,
        data: {
          chainId: Number(network.chainId),
          name: network.name,
          currentBlock: blockNumber,
          gasPrice: gasPrice.gasPrice ? formatEther(gasPrice.gasPrice) : null,
          maxFeePerGas: gasPrice.maxFeePerGas ? formatEther(gasPrice.maxFeePerGas) : null
        },
        source: 'oasis_node'
      };
    } catch (error) {
      console.error('Network info error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network query failed',
        source: 'oasis_node'
      };
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(address?: string) {
    try {
      const targetAddress = address || this.wallet?.address;
      if (!targetAddress) {
        throw new Error('No address provided and wallet not initialized');
      }

      const balance = await this.provider.getBalance(targetAddress);
      
      return {
        success: true,
        data: {
          address: targetAddress,
          balance: formatEther(balance),
          balanceWei: balance.toString()
        },
        source: 'oasis_node'
      };
    } catch (error) {
      console.error('Balance query error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Balance query failed',
        source: 'oasis_node'
      };
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string) {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        return {
          success: false,
          error: 'Transaction not found',
          source: 'oasis_node'
        };
      }

      return {
        success: true,
        data: {
          hash: receipt.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          status: receipt.status,
          logs: receipt.logs
        },
        source: 'oasis_node'
      };
    } catch (error) {
      console.error('Transaction receipt error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction query failed',
        source: 'oasis_node'
      };
    }
  }
}

// Export singleton instance
export const oasisClient = new OasisClient();
