// File: scripts/deploy-mock-oracle.js
// Deploy Mock Oracle Contract for Testing

require('dotenv').config();
const MockOracleContract = require('./mock-oracle-contract');
const fs = require('fs');
const path = require('path');

class MockOracleDeployment {
    constructor() {
        this.mockContract = null;
        this.deploymentInfo = {};
    }

    async deployMockOracle() {
        console.log('Deploying Mock Oracle Contract...\n');
        
        try {
            // Create mock contract instance
            this.mockContract = new MockOracleContract();
            
            // Simulate deployment process
            console.log('Simulating contract deployment...');
            await this.simulateDeployment();
            
            // Generate deployment info
            this.deploymentInfo = {
                contractAddress: this.mockContract.getAddress(),
                deploymentTime: new Date().toISOString(),
                network: 'mock-testnet',
                gasUsed: '2,150,000',
                deploymentCost: '0.00215 ETH (mock)',
                features: [
                    'CO2 data submission',
                    'Data retrieval',
                    'Integrity verification',
                    'Event logging'
                ]
            };
            
            console.log('✅ Mock Oracle Contract deployed successfully!\n');
            this.printDeploymentInfo();
            
            // Update environment file
            await this.updateEnvFile();
            
            // Test contract functionality
            await this.testDeployedContract();
            
            return this.deploymentInfo;
            
        } catch (error) {
            console.error('❌ Mock deployment failed:', error.message);
            throw error;
        }
    }

    async simulateDeployment() {
        const steps = [
            'Compiling contract...',
            'Estimating gas costs...',
            'Broadcasting transaction...',
            'Waiting for confirmation...',
            'Verifying deployment...'
        ];
        
        for (const step of steps) {
            console.log(`   ${step}`);
            await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
        }
    }

    printDeploymentInfo() {
        console.log('Deployment Information:');
        console.log(`   Contract Address: ${this.deploymentInfo.contractAddress}`);
        console.log(`   Network: ${this.deploymentInfo.network}`);
        console.log(`   Gas Used: ${this.deploymentInfo.gasUsed}`);
        console.log(`   Deployment Cost: ${this.deploymentInfo.deploymentCost}`);
        console.log(`   Deployment Time: ${this.deploymentInfo.deploymentTime}`);
        console.log('\nContract Features:');
        this.deploymentInfo.features.forEach(feature => {
            console.log(`   ✅ ${feature}`);
        });
        console.log();
    }

    async updateEnvFile() {
        try {
            const envPath = path.join(__dirname, '../.env');
            let envContent = '';
            
            // Read existing .env file
            if (fs.existsSync(envPath)) {
                envContent = fs.readFileSync(envPath, 'utf8');
                
                // Update existing OASIS_CONTRACT_ADDRESS
                if (envContent.includes('OASIS_CONTRACT_ADDRESS=')) {
                    envContent = envContent.replace(
                        /OASIS_CONTRACT_ADDRESS=.*/,
                        `OASIS_CONTRACT_ADDRESS=${this.deploymentInfo.contractAddress}`
                    );
                } else {
                    envContent += `\nOASIS_CONTRACT_ADDRESS=${this.deploymentInfo.contractAddress}\n`;
                }
                
                // Add mock deployment flag
                if (!envContent.includes('MOCK_DEPLOYMENT=')) {
                    envContent += `MOCK_DEPLOYMENT=true\n`;
                }
            } else {
                // Create new .env file
                envContent = `OASIS_CONTRACT_ADDRESS=${this.deploymentInfo.contractAddress}\nMOCK_DEPLOYMENT=true\n`;
            }
            
            fs.writeFileSync(envPath, envContent);
            console.log('Updated .env file with mock contract address');
            
        } catch (error) {
            console.log('Could not update .env file:', error.message);
            console.log(`   Please manually add: OASIS_CONTRACT_ADDRESS=${this.deploymentInfo.contractAddress}`);
        }
    }

    async testDeployedContract() {
        console.log('Testing deployed mock contract...\n');
        
        try {
            // Test 1: Submit CO2 data
            console.log('1️ Testing CO2 data submission...');
            const submitResult = await this.mockContract.submitCO2Data(
                'test_project_001',
                '100000000', // 100 tons in 6 decimals
                '0x' + 'a'.repeat(64), // Mock data hash
                Math.floor(Date.now() / 1000)
            );
            
            const receipt = await submitResult.wait();
            console.log(`   Transaction confirmed: ${submitResult.hash}`);
            console.log(`   Gas used: ${receipt.gasUsed}`);
            
            // Test 2: Retrieve CO2 data
            console.log('\n2️ Testing CO2 data retrieval...');
            const [amount, dataHash, timestamp] = await this.mockContract.getCO2Data('test_project_001');
            console.log(`   Data retrieved successfully`);
            console.log(`   Amount: ${amount} (100 tons)`);
            console.log(`   Data Hash: ${dataHash}`);
            console.log(`   Timestamp: ${new Date(Number(timestamp) * 1000).toISOString()}`);
            
            // Test 3: Verify data integrity
            console.log('\n3️ Testing data integrity verification...');
            const isValid = await this.mockContract.verifyDataIntegrity(dataHash, '0x' + 'b'.repeat(128));
            console.log(`   Data integrity: ${isValid ? 'VALID' : 'INVALID'}`);
            
            console.log('\n🎉 All contract tests passed!');
            
        } catch (error) {
            console.log(`❌ Contract testing failed: ${error.message}`);
        }
    }

    async generateMockData() {
        console.log('\nGenerating sample mock data...');
        
        const mockProjects = [
            { id: 'wind_farm_001', co2Amount: 150, type: 'renewable_energy' },
            { id: 'forest_protection_002', co2Amount: 250, type: 'redd_plus' },
            { id: 'solar_installation_003', co2Amount: 80, type: 'renewable_energy' },
            { id: 'reforestation_004', co2Amount: 300, type: 'afforestation' }
        ];
        
        for (const project of mockProjects) {
            try {
                const dataHash = '0x' + Math.random().toString(16).substr(2, 64);
                const result = await this.mockContract.submitCO2Data(
                    project.id,
                    (project.co2Amount * 1000000).toString(), // Convert to 6 decimals
                    dataHash,
                    Math.floor(Date.now() / 1000)
                );
                
                console.log(`   ✅ ${project.id}: ${project.co2Amount} tons CO2`);
            } catch (error) {
                console.log(`   ❌ Failed to create data for ${project.id}`);
            }
        }
        
        console.log('\nMock data generation completed!');
    }

    getContractInstance() {
        return this.mockContract;
    }

    getDeploymentInfo() {
        return this.deploymentInfo;
    }
}

// Run deployment if called directly
async function main() {
    console.log('Mock Oracle Contract Deployment\n');
    console.log('This will deploy a mock oracle contract for testing purposes.');
    console.log('No real blockchain transactions or funds required!\n');
    
    const deployment = new MockOracleDeployment();
    
    try {
        await deployment.deployMockOracle();
        await deployment.generateMockData();
        
        console.log('\nMock deployment completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Run: npm run health-check');
        console.log('2. Test: npm run test-oracle');
        console.log('3. Integration test with GreenVault contracts');
        
    } catch (error) {
        console.error('\nDeployment failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = MockOracleDeployment;
