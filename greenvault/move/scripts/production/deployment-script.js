// File: deployment-script.js
//  Deployment script for GreenVault contracts

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class GreenVaultDeployer {
    constructor(network = 'testnet') {
        this.network = network;
        this.deploymentConfig = {
            testnet: {
                rpcUrl: 'https://fullnode.testnet.sui.io',
                faucetUrl: 'https://faucet.testnet.sui.io/gas'
            },
            mainnet: {
                rpcUrl: 'https://fullnode.mainnet.sui.io'
            }
        };
    }

    // Deploy all GreenVault contracts
    async deployContracts() {
        console.log(`Deploying GreenVault contracts to ${this.network}...`);

        try {
            // Check Sui client version first
            console.log('Checking Sui client version...');
            try {
                const versionOutput = execSync('sui --version', { encoding: 'utf8' });
                console.log(`Sui version: ${versionOutput.trim()}`);
            } catch (versionError) {
                console.warn('Could not check Sui version:', versionError.message);
            }

            // Build the Move package
            console.log('Building Move package...');
            execSync('sui move build', { stdio: 'inherit' });

            // Deploy the package with better error handling
            console.log('Deploying package...');
            let deployOutput;
            try {
                deployOutput = execSync('sui client publish --gas-budget 20000000', { 
                    encoding: 'utf8',
                    timeout: 120000 // 2 minute timeout
                });
            } catch (deployError) {
                console.error('Deployment failed with error:', deployError.message);
                
                // Check for common issues
                if (deployError.message.includes('Access is denied')) {
                    console.error('\nPermission Error Solutions:');
                    console.error('1. Run PowerShell as Administrator');
                    console.error('2. Check Move.lock file permissions');
                    console.error('3. Ensure you have write access to the directory');
                }
                
                if (deployError.message.includes('version mismatch')) {
                    console.error('\nVersion Mismatch Solutions:');
                    console.error('1. Update Sui CLI: Download from https://github.com/MystenLabs/sui/releases');
                    console.error('2. Check sui --version');
                    console.error('3. Restart terminal after update');
                }
                
                throw deployError;
            }

            // Parse deployment output to get package ID
            const packageIdMatch = deployOutput.match(/Package ID: (0x[a-fA-F0-9]+)/);
            if (!packageIdMatch) {
                throw new Error('Could not find package ID in deployment output');
            }

            const packageId = packageIdMatch[1];
            console.log(`Package deployed with ID: ${packageId}`);

            // Save deployment info
            const deploymentInfo = {
                packageId,
                network: this.network,
                timestamp: new Date().toISOString(),
                contracts: {
                    carbon_credit: `${packageId}::carbon_credit`,
                    oracle_integration: `${packageId}::oracle_integration`,
                    deployment: `${packageId}::deployment`
                }
            };

            fs.writeFileSync(
                `deployment-${this.network}.json`,
                JSON.stringify(deploymentInfo, null, 2)
            );

            console.log('Deployment completed successfully!');
            return deploymentInfo;

        } catch (error) {
            console.error('Deployment failed:', error);
            throw error;
        }
    }

    // Initialize contracts with demo data
    async initializeDemo(packageId) {
        console.log('Initializing demo projects...');

        try {
            // Call setup functions
            execSync(`sui client call --package ${packageId} --module deployment --function setup_production_config --gas-budget 10000000`, {
                stdio: 'inherit'
            });

            execSync(`sui client call --package ${packageId} --module deployment --function create_demo_projects --gas-budget 10000000`, {
                stdio: 'inherit'
            });

            console.log('Demo initialization completed!');
        } catch (error) {
            console.error('Demo initialization failed:', error);
            throw error;
        }
    }

    // Setup oracle connections
    async setupOracles(oasisConfig) {
        console.log('Setting up oracle connections...');

        const oracleIntegrator = new (require('./oasis-integration'))(
            oasisConfig.rpcUrl,
            oasisConfig.privateKey,
            oasisConfig.contractAddress
        );

        // Test oracle connection
        const testData = {
            project: 'TEST_PROJECT',
            co2Amount: 100,
            measurementData: { method: 'satellite', confidence: 95 }
        };

        const result = await oracleIntegrator.submitCO2Measurement(
            testData.project,
            testData.co2Amount,
            testData.measurementData,
            '0x' // Mock signature
        );

        if (result.success) {
            console.log('Oracle connection established successfully!');
        } else {
            console.error('Oracle connection failed:', result.error);
        }

        return oracleIntegrator;
    }
}

// CLI execution
if (require.main === module) {
    const network = process.argv[2] || 'testnet';
    const deployer = new GreenVaultDeployer(network);

    deployer.deployContracts()
        .then(deploymentInfo => {
            console.log('Deployment info saved to:', `deployment-${network}.json`);
            
            // Initialize demo if on testnet
            if (network === 'testnet') {
                return deployer.initializeDemo(deploymentInfo.packageId);
            }
        })
        .catch(error => {
            console.error('Deployment process failed:', error);
            process.exit(1);
        });
}

module.exports = GreenVaultDeployer;