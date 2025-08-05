// File: test-runner.js
// Comprehensive test runner for GreenVault

const { execSync } = require('child_process');

class GreenVaultTester {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            errors: []
        };
    }

    // Run all Move tests
    async runMoveTests() {
        console.log('Running Move contract tests...');

        try {
            const output = execSync('sui move test', { encoding: 'utf8' });
            console.log(output);

            // Parse test results
            const passedMatch = output.match(/(\d+) passed/);
            const failedMatch = output.match(/(\d+) failed/);

            if (passedMatch) this.testResults.passed += parseInt(passedMatch[1]);
            if (failedMatch) this.testResults.failed += parseInt(failedMatch[1]);

            console.log('Move tests completed successfully!');
        } catch (error) {
            console.error('Move tests failed:', error.message);
            this.testResults.errors.push('Move tests failed');
        }
    }

    // Test oracle integration
    async testOracleIntegration() {
        console.log('Testing oracle integration...');

        try {
            const OasisOracleIntegrator = require('../production/oasis-integration');
            
            // Mock oracle for testing
            const mockOracle = new OasisOracleIntegrator(
                'http://localhost:8545', // Mock RPC
                '0x' + '1'.repeat(64), // Mock private key
                '0x' + '1'.repeat(40)  // Mock contract address
            );

            // Test data structures
            const testCases = [
                {
                    name: 'CO2 measurement submission',
                    test: () => mockOracle.submitCO2Measurement('TEST_001', 100, {}, '0x')
                },
                {
                    name: 'Satellite data fetching',
                    test: () => mockOracle.fetchSatelliteData(
                        { lat: -10.123, lng: -50.456 },
                        { start: '2024-01-01', end: '2024-01-31' }
                    )
                }
            ];

            for (const testCase of testCases) {
                try {
                    console.log(`Testing: ${testCase.name}`);
                    await testCase.test();
                    this.testResults.passed++;
                    console.log(`✓ ${testCase.name} passed`);
                } catch (error) {
                    this.testResults.failed++;
                    this.testResults.errors.push(`${testCase.name}: ${error.message}`);
                    console.log(`✗ ${testCase.name} failed: ${error.message}`);
                }
            }

        } catch (error) {
            console.error('Oracle integration tests failed:', error);
            this.testResults.errors.push('Oracle integration tests failed');
        }
    }

    // Generate test report
    generateReport() {
        console.log('\n=== Test Report ===');
        console.log(`Total tests: ${this.testResults.passed + this.testResults.failed}`);
        console.log(`Passed: ${this.testResults.passed}`);
        console.log(`Failed: ${this.testResults.failed}`);
        
        if (this.testResults.errors.length > 0) {
            console.log('\nErrors:');
            this.testResults.errors.forEach(error => console.log(`- ${error}`));
        }

        const successRate = (this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100;
        console.log(`Success rate: ${successRate.toFixed(2)}%`);

        return this.testResults.failed === 0;
    }

    // Run all tests
    async runAllTests() {
        console.log('Starting GreenVault test suite...\n');

        await this.runMoveTests();
        await this.testOracleIntegration();

        const success = this.generateReport();
        
        if (success) {
            console.log('\nAll tests passed!');
            process.exit(0);
        } else {
            console.log('\nSome tests failed!');
            process.exit(1);
        }
    }
}

// CLI execution
if (require.main === module) {
    const tester = new GreenVaultTester();
    tester.runAllTests().catch(error => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = GreenVaultTester;