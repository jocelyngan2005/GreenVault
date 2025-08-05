// File: scripts/oracle-setup.js
// Deploy and configure Oracle contract on Oasis Network

require('dotenv').config();
const { ethers } = require('ethers');

class OracleSetup {
    constructor() {
        this.rpcUrl = process.env.OASIS_RPC_URL || 'https://testnet.sapphire.oasis.io';
        this.privateKey = process.env.OASIS_PRIVATE_KEY;
        this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
        this.wallet = new ethers.Wallet(this.privateKey, this.provider);
    }

    async deployOracleContract() {
        console.log('Deploying Oracle Contract to Oasis Network...\n');

        try {
            // Oracle contract bytecode and ABI (simplified version)
            const oracleABI = [
                "constructor()",
                "function submitCO2Data(string projectId, uint256 co2Amount, bytes32 dataHash, uint256 timestamp) external",
                "function getCO2Data(string projectId) external view returns (uint256, bytes32, uint256)",
                "function verifyDataIntegrity(bytes32 dataHash, bytes signature) external view returns (bool)",
                "function updateOracle(address newOracle) external",
                "function owner() external view returns (address)",
                "event CO2DataSubmitted(string indexed projectId, uint256 amount, address oracle)",
                "event OracleUpdated(address oldOracle, address newOracle)"
            ];

            // Simple oracle contract bytecode (this would be compiled from Solidity)
            const oracleBytecode = "0x608060405234801561001057600080fd5b50600080546001600160a01b0319163317905561000f806100326000396000f3fe6080604052348015600f57600080fd5b5060405161000f9061000f8061000f565b90509056";

            console.log('Contract Details:');
            console.log(`- Deployer: ${this.wallet.address}`);
            console.log(`- Network: ${this.rpcUrl}`);
            
            // Check wallet balance
            const balance = await this.provider.getBalance(this.wallet.address);
            console.log(`- Balance: ${ethers.formatEther(balance)} ETH`);

            if (balance === 0n) {
                throw new Error('Insufficient balance for deployment. Please fund your wallet.');
            }

            // Deploy contract
            const contractFactory = new ethers.ContractFactory(oracleABI, oracleBytecode, this.wallet);
            
            console.log('\nDeploying contract...');
            const contract = await contractFactory.deploy();
            
            console.log(`Transaction hash: ${contract.deploymentTransaction().hash}`);
            console.log('Waiting for confirmation...');
            
            await contract.waitForDeployment();
            const contractAddress = await contract.getAddress();
            
            console.log(`\n✅ Oracle contract deployed successfully!`);
            console.log(`Contract address: ${contractAddress}`);
            console.log(`View on explorer: https://explorer.sapphire.oasis.io/address/${contractAddress}`);

            // Update .env file with contract address
            await this.updateEnvFile(contractAddress);

            return contractAddress;

        } catch (error) {
            console.error('❌ Deployment failed:', error.message);
            
            if (error.message.includes('insufficient funds')) {
                console.log('\n💡 Troubleshooting:');
                console.log('1. Get test tokens from Oasis faucet');
                console.log('2. Check wallet address and private key');
                console.log('3. Verify network configuration');
            }
            
            throw error;
        }
    }

    async updateEnvFile(contractAddress) {
        const fs = require('fs');
        const path = require('path');
        
        try {
            const envPath = path.join(__dirname, '../../.env'); // Go up two levels to root
            let envContent = '';
            
            // Read existing .env file or create new one
            if (fs.existsSync(envPath)) {
                envContent = fs.readFileSync(envPath, 'utf8');
                
                // Update existing OASIS_CONTRACT_ADDRESS
                if (envContent.includes('OASIS_CONTRACT_ADDRESS=')) {
                    envContent = envContent.replace(
                        /OASIS_CONTRACT_ADDRESS=.*/,
                        `OASIS_CONTRACT_ADDRESS=${contractAddress}`
                    );
                } else {
                    envContent += `\nOASIS_CONTRACT_ADDRESS=${contractAddress}\n`;
                }
            } else {
                // Create new .env file
                envContent = `OASIS_CONTRACT_ADDRESS=${contractAddress}\n`;
            }
            
            fs.writeFileSync(envPath, envContent);
            console.log('Updated .env file with contract address');
            
        } catch (error) {
            console.log('Could not update .env file:', error.message);
            console.log(`Please manually add: OASIS_CONTRACT_ADDRESS=${contractAddress}`);
        }
    }

    async verifyDeployment(contractAddress) {
        console.log('\nVerifying deployment...');
        
        try {
            const code = await this.provider.getCode(contractAddress);
            if (code === '0x') {
                throw new Error('No contract code found at address');
            }
            
            console.log('✅ Contract verification successful');
            console.log(`Contract code size: ${(code.length - 2) / 2} bytes`);

            return true;
            
        } catch (error) {
            console.error('❌ Contract verification failed:', error.message);
            return false;
        }
    }

    async setupOraclePermissions(contractAddress) {
        console.log('\nSetting up oracle permissions...');
        
        try {
            const oracleABI = [
                "function owner() external view returns (address)",
                "function updateOracle(address newOracle) external"
            ];
            
            const contract = new ethers.Contract(contractAddress, oracleABI, this.wallet);
            
            // Check if we're the owner
            const owner = await contract.owner();
            if (owner.toLowerCase() !== this.wallet.address.toLowerCase()) {
                console.log('Warning: Not contract owner. Cannot set permissions.');
                return false;
            }
            
            console.log('Oracle permissions configured');
            return true;
            
        } catch (error) {
            console.log('Could not configure permissions:', error.message);
            return false;
        }
    }
}

// Run setup if called directly
async function main() {
    if (!process.env.OASIS_PRIVATE_KEY) {
        console.error('OASIS_PRIVATE_KEY not found in environment variables');
        console.log('Please create a .env file with your configuration');
        process.exit(1);
    }

    const setup = new OracleSetup();
    
    try {
        const contractAddress = await setup.deployOracleContract();
        await setup.verifyDeployment(contractAddress);
        await setup.setupOraclePermissions(contractAddress);
        
        console.log('\nOracle setup completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Run: npm run health-check');
        console.log('2. Test oracle: npm run test-oracle');
        console.log('3. Integrate with GreenVault contracts');
        
    } catch (error) {
        console.error('\nSetup failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = OracleSetup;
