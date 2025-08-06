// File: scripts/mock-oracle-contract.js
// Mock Oracle Smart Contract for Testing

class MockOracleContract {
    constructor() {
        this.data = new Map(); // Store CO2 data
        this.address = '0x' + Math.random().toString(16).substr(2, 40).padEnd(40, '0'); // Generate proper 42-char address
        this.deployed = true;
        console.log(`Mock Oracle Contract deployed at: ${this.address}`);
    }

    // Mock contract methods
    async submitCO2Data(projectId, co2Amount, dataHash, timestamp) {
        // Simulate transaction processing
        await this.simulateDelay(100, 300);
        
        const txHash = '0x' + Math.random().toString(16).substr(2, 64);
        
        // Store data
        this.data.set(projectId, {
            amount: co2Amount,
            dataHash: dataHash,
            timestamp: timestamp,
            verified: true,
            txHash: txHash
        });
        
        console.log(`Mock CO2 data stored for project ${projectId}`);
        
        return {
            hash: txHash,
            wait: async () => ({
                status: 1,
                blockNumber: Math.floor(Math.random() * 1000000),
                gasUsed: '50000'
            })
        };
    }

    async getCO2Data(projectId) {
        await this.simulateDelay(50, 150);
        
        const data = this.data.get(projectId);
        if (!data) {
            throw new Error(`No data found for project ${projectId}`);
        }
        
        return [data.amount, data.dataHash, data.timestamp];
    }

    async verifyDataIntegrity(dataHash, signature) {
        await this.simulateDelay(75, 200);
        // Mock verification logic: return false for explicitly invalid hashes
        const isInvalid = dataHash.toLowerCase().includes('invalid');
        return !isInvalid;
    }

    // Simulate network delay
    async simulateDelay(min = 50, max = 200) {
        const delay = Math.random() * (max - min) + min;
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    // Get contract address
    getAddress() {
        return this.address;
    }

    // Check if contract is deployed
    isDeployed() {
        return this.deployed;
    }

    // Get all stored data (for debugging)
    getAllData() {
        return Object.fromEntries(this.data);
    }
}

module.exports = MockOracleContract;
