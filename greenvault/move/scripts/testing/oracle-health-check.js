// File: scripts/oracle-health-check.js
// Comprehensive health check for Oasis oracle integration

require('dotenv').config();
const OasisOracle = require('../production/oasis-integration');

class OracleHealthChecker {
    constructor() {
        this.rpcUrl = process.env.OASIS_RPC_URL;
        this.privateKey = process.env.OASIS_PRIVATE_KEY;
        this.contractAddress = process.env.OASIS_CONTRACT_ADDRESS;
        this.results = {
            connectivity: false,
            authentication: false,
            contract: false,
            dataSources: false,
            performance: {},
            errors: []
        };
    }

    async runFullHealthCheck() {
        console.log('🔍 Starting Oasis Oracle Health Check...\n');

        try {
            // 1. Network connectivity
            await this.checkConnectivity();
            
            // 2. Authentication
            await this.checkAuthentication();
            
            // 3. Contract deployment
            await this.checkContractDeployment();
            
            // 4. External data sources
            await this.checkDataSources();
            
            // 5. Performance metrics
            await this.checkPerformance();
            
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Health check failed:', error);
            this.results.errors.push(error.message);
        }
    }

    async checkConnectivity() {
        console.log('Checking network connectivity...');
        
        try {
            if (!this.rpcUrl) {
                throw new Error('OASIS_RPC_URL not configured');
            }

            const oracle = new OasisOracle(this.rpcUrl, '0x' + '1'.repeat(64), '0x' + '1'.repeat(40));
            
            // Test basic RPC connectivity
            const startTime = Date.now();
            await oracle.provider.getNetwork();
            const responseTime = Date.now() - startTime;
            
            this.results.connectivity = true;
            this.results.performance.rpcResponseTime = responseTime;
            console.log(`✅ Network connectivity OK (${responseTime}ms)`);
            
        } catch (error) {
            this.results.connectivity = false;
            this.results.errors.push(`Network connectivity failed: ${error.message}`);
            console.log(`❌ Network connectivity failed: ${error.message}`);
        }
    }

    async checkAuthentication() {
        console.log('Checking authentication...');
        
        try {
            if (!this.privateKey || this.privateKey === 'your_private_key_here') {
                throw new Error('OASIS_PRIVATE_KEY not configured properly');
            }

            const oracle = new OasisOracle(this.rpcUrl, this.privateKey, '0x' + '1'.repeat(40));
            
            // Check wallet balance using provider directly  
            const balance = await oracle.provider.getBalance(oracle.wallet.address);
            console.log(`Wallet balance: ${balance > 0 ? 'Funded' : 'Empty'} (${oracle.provider.constructor.name})`);
            
            this.results.authentication = true;
            console.log('✅ Authentication OK');
            
        } catch (error) {
            this.results.authentication = false;
            this.results.errors.push(`Authentication failed: ${error.message}`);
            console.log(`❌ Authentication failed: ${error.message}`);
        }
    }

    async checkContractDeployment() {
        console.log('Checking contract deployment...');
        
        try {
            if (!this.contractAddress || this.contractAddress === 'your_deployed_contract_address') {
                console.log('Contract address not configured - using placeholder');
                this.results.contract = false;
                return;
            }

            const oracle = new OasisOracle(this.rpcUrl, this.privateKey, this.contractAddress);
            
            // Check if contract exists
            const code = await oracle.provider.getCode(this.contractAddress);
            if (code === '0x') {
                throw new Error('No contract deployed at specified address');
            }
            
            this.results.contract = true;
            console.log('✅ Contract deployment OK');
            
        } catch (error) {
            this.results.contract = false;
            this.results.errors.push(`Contract check failed: ${error.message}`);
            console.log(`❌ Contract check failed: ${error.message}`);
        }
    }

    async checkDataSources() {
        console.log('Checking external data sources...');
        
        const dataSources = [
            { name: 'Satellite API', check: () => this.testSatelliteAPI() },
            { name: 'IoT Sensors', check: () => this.testIoTAPI() },
            { name: 'Verra Registry', check: () => this.testVerraAPI() },
            { name: 'Gold Standard', check: () => this.testGoldStandardAPI() }
        ];

        let successCount = 0;
        
        for (const source of dataSources) {
            try {
                await source.check();
                successCount++;
                console.log(`✅ ${source.name} OK`);
            } catch (error) {
                console.log(`❌ ${source.name} failed: ${error.message}`);
                this.results.errors.push(`${source.name}: ${error.message}`);
            }
        }
        
        this.results.dataSources = successCount > 0;
        console.log(`Data sources: ${successCount}/${dataSources.length} available`);
    }

    async testSatelliteAPI() {
        // Mock satellite API test
        if (!process.env.SATELLITE_API_KEY) {
            throw new Error('SATELLITE_API_KEY not configured');
        }
        // In production, make actual API call
        return true;
    }

    async testIoTAPI() {
        // Mock IoT API test
        if (!process.env.IOT_API_KEY) {
            throw new Error('IOT_API_KEY not configured');
        }
        // In production, make actual API call
        return true;
    }

    async testVerraAPI() {
        // Mock Verra API test
        if (!process.env.VERRA_API_KEY) {
            throw new Error('VERRA_API_KEY not configured');
        }
        // In production, make actual API call
        return true;
    }

    async testGoldStandardAPI() {
        // Mock Gold Standard API test
        if (!process.env.GOLD_STANDARD_API_KEY) {
            throw new Error('GOLD_STANDARD_API_KEY not configured');
        }
        // In production, make actual API call
        return true;
    }

    async checkPerformance() {
        console.log('Running performance tests...');
        
        try {
            const oracle = new OasisOracle(this.rpcUrl, this.privateKey, this.contractAddress);
            
            // Test data submission performance
            const submitStartTime = Date.now();
            const mockResult = await oracle.createProofData(
                { method: 'test', confidence: 90 },
                '0xtest'
            );
            const submitTime = Date.now() - submitStartTime;
            
            // Test data retrieval performance
            const retrieveStartTime = Date.now();
            await oracle.fetchExternalVerification('test_project', 'verra');
            const retrieveTime = Date.now() - retrieveStartTime;
            
            this.results.performance = {
                ...this.results.performance,
                dataSubmission: submitTime,
                dataRetrieval: retrieveTime
            };
            
            console.log(`✅ Performance test completed`);
            console.log(`   - Data submission: ${submitTime}ms`);
            console.log(`   - Data retrieval: ${retrieveTime}ms`);
            
        } catch (error) {
            console.log(`❌ Performance test failed: ${error.message}`);
            this.results.errors.push(`Performance test: ${error.message}`);
        }
    }

    generateReport() {
        console.log('\n=== Oracle Health Check Report ===');
        console.log(`Network Connectivity: ${this.results.connectivity ? '✅ OK' : '❌ FAIL'}`);
        console.log(`Authentication: ${this.results.authentication ? '✅ OK' : '❌ FAIL'}`);
        console.log(`Contract Deployment: ${this.results.contract ? '✅ OK' : '❌ FAIL'}`);
        console.log(`Data Sources: ${this.results.dataSources ? '✅ OK' : '❌ FAIL'}`);
        
        if (this.results.performance.rpcResponseTime) {
            console.log(`RPC Response Time: ${this.results.performance.rpcResponseTime}ms`);
        }
        
        const overallHealth = this.results.connectivity && this.results.authentication;
        console.log(`\nOverall Health: ${overallHealth ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
        
        if (this.results.errors.length > 0) {
            console.log('\nIssues Found:');
            this.results.errors.forEach(error => console.log(`   - ${error}`));
            
            console.log('\nRecommended Actions:');
            console.log('   1. Copy .env.example to .env and configure your credentials');
            console.log('   2. Deploy oracle contract to Oasis network if not done');
            console.log('   3. Fund your wallet with test tokens');
            console.log('   4. Obtain API keys for external data sources');
        }
        
        return overallHealth;
    }
}

// Run health check if called directly
if (require.main === module) {
    const checker = new OracleHealthChecker();
    checker.runFullHealthCheck().catch(console.error);
}

module.exports = OracleHealthChecker;
