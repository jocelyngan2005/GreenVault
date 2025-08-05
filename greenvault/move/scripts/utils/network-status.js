// File: scripts/utils/network-status.js
// Network Status Checker for GreenVault

require('dotenv').config();
const { JsonRpcProvider, Wallet, Contract, formatEther, formatUnits } = require('ethers');

class NetworkStatusChecker {
    constructor() {
        this.rpcUrl = process.env.OASIS_RPC_URL || 'https://testnet.sapphire.oasis.io';
        this.chainId = process.env.CHAIN_ID || '23295';
        this.contractAddress = process.env.OASIS_CONTRACT_ADDRESS;
        this.privateKey = process.env.OASIS_PRIVATE_KEY;
        
        this.provider = null;
        this.wallet = null;
        this.contract = null;
        
        this.statusResults = {
            network: { status: 'unknown', details: {} },
            wallet: { status: 'unknown', details: {} },
            contract: { status: 'unknown', details: {} },
            overall: 'unknown'
        };
    }

    async checkCompleteStatus() {
        console.log('🌐 GreenVault Network Status Check\n');
        console.log(`📡 RPC Endpoint: ${this.rpcUrl}`);
        console.log(`🔗 Chain ID: ${this.chainId}\n`);
        
        try {
            await this.checkNetworkConnection();
            await this.checkWalletStatus();
            await this.checkContractStatus();
            
            this.determineOverallStatus();
            this.generateStatusReport();
            
        } catch (error) {
            console.error('❌ Status check failed:', error.message);
            this.statusResults.overall = 'failed';
        }
        
        return this.statusResults;
    }

    async checkNetworkConnection() {
        console.log('🔍 Checking Network Connection...');
        
        try {
            // Initialize provider
            this.provider = new JsonRpcProvider(this.rpcUrl);
            // Get network info
            const network = await this.provider.getNetwork();
            const blockNumber = await this.provider.getBlockNumber();
            const feeData = await this.provider.getFeeData();
            const gasPrice = feeData.gasPrice;
            // Verify chain ID matches
            const actualChainId = network.chainId.toString();
            const expectedChainId = this.chainId;
            if (actualChainId === expectedChainId) {
                this.statusResults.network.status = 'connected';
                console.log('✅ Network connected successfully');
            } else {
                this.statusResults.network.status = 'chain_mismatch';
                console.log(`⚠️  Chain ID mismatch: expected ${expectedChainId}, got ${actualChainId}`);
            }
            this.statusResults.network.details = {
                chainId: actualChainId,
                chainName: network.name || 'Oasis Sapphire',
                blockNumber: blockNumber,
                gasPrice: formatUnits(gasPrice, 'gwei') + ' gwei',
                rpcResponse: true
            };
            console.log(`📊 Current Block: ${blockNumber}`);
            console.log(`⛽ Gas Price: ${formatUnits(gasPrice, 'gwei')} gwei`);
            
        } catch (error) {
            this.statusResults.network.status = 'disconnected';
            this.statusResults.network.details = { error: error.message };
            console.log('❌ Network connection failed:', error.message);
        }
    }

    async checkWalletStatus() {
        console.log('\n💰 Checking Wallet Status...');
        
        if (!this.privateKey) {
            this.statusResults.wallet.status = 'no_key';
            console.log('❌ No private key configured');
            return;
        }

        try {
            // Initialize wallet
            this.wallet = new Wallet(this.privateKey, this.provider);
            const address = this.wallet.address;
            // Get balance
            const balance = await this.provider.getBalance(address);
            const balanceEth = parseFloat(formatEther(balance));
            // Get transaction count (nonce)
            const nonce = await this.provider.getTransactionCount(address);
            
            // Determine wallet status
            if (balanceEth > 0) {
                this.statusResults.wallet.status = 'funded';
                console.log('✅ Wallet funded and ready');
            } else {
                this.statusResults.wallet.status = 'unfunded';
                console.log('⚠️  Wallet has zero balance');
            }
            
            this.statusResults.wallet.details = {
                address: address,
                balance: balanceEth,
                balanceWei: balance.toString(),
                nonce: nonce,
                hasPrivateKey: true
            };
            
            console.log(`📍 Address: ${address}`);
            console.log(`💎 Balance: ${balanceEth} ETH`);
            console.log(`📝 Nonce: ${nonce}`);
            
            // Check if balance is sufficient for operations
            if (balanceEth < 0.01) {
                console.log('⚠️  Low balance warning: Consider funding wallet for transactions');
            }
            
        } catch (error) {
            this.statusResults.wallet.status = 'invalid_key';
            this.statusResults.wallet.details = { error: error.message };
            console.log('❌ Wallet validation failed:', error.message);
        }
    }

    async checkContractStatus() {
        console.log('\n📄 Checking Contract Status...');
        
        if (!this.contractAddress || this.contractAddress === 'YOUR_CONTRACT_ADDRESS') {
            this.statusResults.contract.status = 'not_deployed';
            console.log('❌ No contract address configured');
            return;
        }

        try {
            // Basic contract existence check
            const code = await this.provider.getCode(this.contractAddress);
            if (code === '0x') {
                this.statusResults.contract.status = 'not_found';
                console.log('❌ Contract not found at specified address');
                return;
            }
            // Basic ABI for oracle contract interaction
            const basicABI = [
                "function getCO2Data() view returns (uint256)",
                "function owner() view returns (address)",
                "function lastUpdated() view returns (uint256)"
            ];
            this.contract = new Contract(this.contractAddress, basicABI, this.provider);
            // Try to call a view function
            let contractData = {};
            try {
                const owner = await this.contract.owner();
                contractData.owner = owner;
                console.log(`👤 Owner: ${owner}`);
            } catch (e) {
                console.log('⚠️  Could not read owner (function may not exist)');
            }
            try {
                const lastUpdated = await this.contract.lastUpdated();
                contractData.lastUpdated = lastUpdated.toString();
                const updateTime = new Date(Number(lastUpdated) * 1000);
                console.log(`⏰ Last Updated: ${updateTime.toISOString()}`);
            } catch (e) {
                console.log('⚠️  Could not read lastUpdated (function may not exist)');
            }
            try {
                const co2Data = await this.contract.getCO2Data();
                contractData.co2Data = co2Data.toString();
                console.log(`🌱 CO2 Data: ${co2Data}`);
            } catch (e) {
                console.log('⚠️  Could not read CO2 data (function may not exist)');
            }
            this.statusResults.contract.status = 'deployed';
            this.statusResults.contract.details = {
                address: this.contractAddress,
                codeSize: code.length,
                hasCode: true,
                ...contractData
            };
            console.log('✅ Contract deployed and responsive');
            
        } catch (error) {
            this.statusResults.contract.status = 'error';
            this.statusResults.contract.details = { error: error.message };
            console.log('❌ Contract check failed:', error.message);
        }
    }

    determineOverallStatus() {
        const networkOk = this.statusResults.network.status === 'connected';
        const walletOk = ['funded', 'unfunded'].includes(this.statusResults.wallet.status);
        const contractOk = this.statusResults.contract.status === 'deployed';
        
        if (networkOk && walletOk && contractOk) {
            this.statusResults.overall = 'ready';
        } else if (networkOk && walletOk) {
            this.statusResults.overall = 'partial';
        } else if (networkOk) {
            this.statusResults.overall = 'network_only';
        } else {
            this.statusResults.overall = 'not_ready';
        }
    }

    generateStatusReport() {
        console.log('\n📊 Network Status Report');
        console.log('═'.repeat(50));
        
        // Overall status
        const statusIcons = {
            'ready': '🟢',
            'partial': '🟡',
            'network_only': '🟠',
            'not_ready': '🔴',
            'failed': '💥'
        };
        
        console.log(`${statusIcons[this.statusResults.overall]} Overall Status: ${this.statusResults.overall.toUpperCase()}`);
        
        // Individual components
        console.log('\n📋 Component Status:');
        console.log(`  🌐 Network: ${this.getStatusIcon(this.statusResults.network.status)} ${this.statusResults.network.status}`);
        console.log(`  💰 Wallet: ${this.getStatusIcon(this.statusResults.wallet.status)} ${this.statusResults.wallet.status}`);
        console.log(`  📄 Contract: ${this.getStatusIcon(this.statusResults.contract.status)} ${this.statusResults.contract.status}`);
        
        // Recommendations
        console.log('\n💡 Recommendations:');
        
        if (this.statusResults.network.status !== 'connected') {
            console.log('  • Check network configuration and RPC endpoint');
        }
        
        if (this.statusResults.wallet.status === 'no_key') {
            console.log('  • Configure OASIS_PRIVATE_KEY in .env file');
        } else if (this.statusResults.wallet.status === 'unfunded') {
            console.log('  • Fund wallet with ETH for transactions');
        }
        
        if (this.statusResults.contract.status === 'not_deployed') {
            console.log('  • Deploy oracle contract using: npm run setup-oracle');
        } else if (this.statusResults.contract.status === 'not_found') {
            console.log('  • Verify contract address in .env file');
        }
        
        if (this.statusResults.overall === 'ready') {
            console.log('  ✅ System ready for operations!');
        }
    }

    getStatusIcon(status) {
        const icons = {
            'connected': '✅',
            'deployed': '✅',
            'funded': '✅',
            'unfunded': '⚠️',
            'not_deployed': '❌',
            'not_found': '❌',
            'no_key': '❌',
            'invalid_key': '❌',
            'disconnected': '❌',
            'chain_mismatch': '⚠️',
            'error': '❌',
            'unknown': '❓'
        };
        return icons[status] || '❓';
    }

    // Quick status check (less verbose)
    async quickCheck() {
        try {
            const provider = new JsonRpcProvider(this.rpcUrl);
            const blockNumber = await provider.getBlockNumber();
            console.log(`✅ Network: Block ${blockNumber}`);
            if (this.privateKey) {
                const wallet = new Wallet(this.privateKey, provider);
                const balance = await provider.getBalance(wallet.address);
                console.log(`💰 Wallet: ${formatEther(balance)} ETH`);
            }
            if (this.contractAddress && this.contractAddress !== 'YOUR_CONTRACT_ADDRESS') {
                const code = await provider.getCode(this.contractAddress);
                console.log(`📄 Contract: ${code !== '0x' ? 'Deployed' : 'Not Found'}`);
            }
        } catch (error) {
            console.log('❌ Quick check failed:', error.message);
        }
    }
}

// CLI usage
async function main() {
    const checker = new NetworkStatusChecker();
    
    const args = process.argv.slice(2);
    if (args.includes('--quick')) {
        await checker.quickCheck();
    } else {
        await checker.checkCompleteStatus();
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = NetworkStatusChecker;
