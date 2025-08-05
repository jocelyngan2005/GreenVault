// File: scripts/utils/env-validator.js
// Environment Configuration Validator for GreenVault

require('dotenv').config();
const fs = require('fs');
const path = require('path');

class EnvironmentValidator {
    constructor() {
        this.requiredVars = {
            // Core Oasis Configuration (Required)
            'OASIS_RPC_URL': {
                required: true,
                default: 'https://testnet.sapphire.oasis.io',
                description: 'Oasis network RPC endpoint'
            },
            'OASIS_PRIVATE_KEY': {
                required: true,
                default: null,
                description: 'Your wallet private key for Oasis network',
                sensitive: true
            },
            'OASIS_CONTRACT_ADDRESS': {
                required: false,
                default: null,
                description: 'Deployed oracle contract address'
            },
            
            // Network Configuration (Optional)
            'CHAIN_ID': {
                required: false,
                default: '23295',
                description: 'Oasis Sapphire Testnet Chain ID'
            },
            'GAS_LIMIT': {
                required: false,
                default: '1000000',
                description: 'Default gas limit for transactions'
            },
            'GAS_PRICE': {
                required: false,
                default: '1000000000',
                description: 'Default gas price in wei'
            },
            
            // External API Keys (Optional for development)
            'SATELLITE_API_KEY': {
                required: false,
                default: null,
                description: 'Satellite imagery API key (optional - mock data used if not provided)'
            },
            'IOT_API_KEY': {
                required: false,
                default: null,
                description: 'IoT sensors API key (optional - mock data used if not provided)'
            },
            'VERRA_API_KEY': {
                required: false,
                default: null,
                description: 'Verra carbon registry API key (optional)'
            },
            'GOLD_STANDARD_API_KEY': {
                required: false,
                default: null,
                description: 'Gold Standard registry API key (optional)'
            },
            
            // Development Settings (Optional)
            'NODE_ENV': {
                required: false,
                default: 'development',
                description: 'Environment mode (development/production)'
            },
            'DEBUG': {
                required: false,
                default: 'true',
                description: 'Enable debug logging'
            },
            'LOG_LEVEL': {
                required: false,
                default: 'info',
                description: 'Logging level (debug/info/warn/error)'
            },
            'MOCK_DEPLOYMENT': {
                required: false,
                default: 'false',
                description: 'Use mock oracle instead of real deployment'
            }
        };
        
        this.validationResults = {
            valid: true,
            errors: [],
            warnings: [],
            missing: [],
            present: []
        };
    }

    async validateEnvironment() {
        console.log('🔍 GreenVault Environment Validation\n');
        
        // Check if .env file exists
        const envPath = path.join(process.cwd(), '.env');
        if (!fs.existsSync(envPath)) {
            this.validationResults.valid = false;
            this.validationResults.errors.push('❌ .env file not found');
            console.log('❌ .env file not found in project root');
            console.log('💡 Run: cp .env.example .env (and configure your settings)');
            return this.validationResults;
        }

        console.log('✅ .env file found');
        
        // Validate each required variable
        for (const [varName, config] of Object.entries(this.requiredVars)) {
            await this.validateVariable(varName, config);
        }
        
        // Additional validations
        this.validatePrivateKeyFormat();
        this.validateContractAddress();
        this.validateNetworkConfiguration();
        
        // Generate report
        this.generateReport();
        
        return this.validationResults;
    }

    validateVariable(varName, config) {
        const value = process.env[varName];
        
        if (!value || value.trim() === '') {
            if (config.required) {
                this.validationResults.errors.push(`❌ Required variable ${varName} is missing`);
                this.validationResults.missing.push(varName);
                this.validationResults.valid = false;
                console.log(`❌ ${varName}: MISSING (Required)`);
                console.log(`   Description: ${config.description}`);
            } else {
                this.validationResults.warnings.push(`⚠️  Optional variable ${varName} not set`);
                console.log(`⚠️  ${varName}: Not set (using ${config.default || 'mock data'})`);
            }
        } else {
            this.validationResults.present.push(varName);
            if (config.sensitive) {
                console.log(`✅ ${varName}: Set (${value.substring(0, 6)}...${value.slice(-4)})`);
            } else {
                console.log(`✅ ${varName}: ${value}`);
            }
        }
    }

    validatePrivateKeyFormat() {
        const privateKey = process.env.OASIS_PRIVATE_KEY;
        if (privateKey) {
            if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
                this.validationResults.errors.push('❌ OASIS_PRIVATE_KEY format invalid');
                this.validationResults.valid = false;
                console.log('❌ Private key format invalid (should be 0x + 64 hex characters)');
            }
        }
    }

    validateContractAddress() {
        const contractAddress = process.env.OASIS_CONTRACT_ADDRESS;
        if (contractAddress && contractAddress !== 'YOUR_CONTRACT_ADDRESS') {
            if (!contractAddress.startsWith('0x') || contractAddress.length !== 42) {
                this.validationResults.warnings.push('⚠️  Contract address format may be invalid');
                console.log('⚠️  Contract address format unusual (should be 0x + 40 hex characters)');
            }
        }
    }

    validateNetworkConfiguration() {
        const rpcUrl = process.env.OASIS_RPC_URL;
        const chainId = process.env.CHAIN_ID;
        
        if (rpcUrl && !rpcUrl.startsWith('http')) {
            this.validationResults.errors.push('❌ Invalid RPC URL format');
            this.validationResults.valid = false;
        }
        
        if (chainId && isNaN(parseInt(chainId))) {
            this.validationResults.warnings.push('⚠️  Chain ID should be numeric');
        }
    }

    generateReport() {
        console.log('\n📊 Environment Validation Report');
        console.log('═'.repeat(50));
        
        console.log(`✅ Variables Present: ${this.validationResults.present.length}`);
        console.log(`⚠️  Warnings: ${this.validationResults.warnings.length}`);
        console.log(`❌ Errors: ${this.validationResults.errors.length}`);
        console.log(`📋 Missing Required: ${this.validationResults.missing.length}`);
        
        if (this.validationResults.errors.length > 0) {
            console.log('\n❌ Critical Issues:');
            this.validationResults.errors.forEach(error => console.log(`   ${error}`));
        }
        
        if (this.validationResults.warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            this.validationResults.warnings.forEach(warning => console.log(`   ${warning}`));
        }
        
        if (this.validationResults.missing.length > 0) {
            console.log('\n📝 Missing Required Variables:');
            this.validationResults.missing.forEach(varName => {
                const config = this.requiredVars[varName];
                console.log(`   ${varName}: ${config.description}`);
            });
        }
        
        console.log('\n🎯 Environment Status:', this.validationResults.valid ? '✅ VALID' : '❌ INVALID');
        
        if (!this.validationResults.valid) {
            console.log('\n🔧 Quick Fix:');
            console.log('1. Copy .env.example to .env');
            console.log('2. Fill in required values (especially OASIS_PRIVATE_KEY)');
            console.log('3. Run this validator again');
        } else {
            console.log('\n🚀 Environment ready for deployment!');
        }
    }

    async generateEnvTemplate() {
        console.log('\n📄 Generating .env.example template...');
        
        let template = '# GreenVault Environment Configuration\n\n';
        
        const sections = {
            'Core Configuration': ['OASIS_RPC_URL', 'OASIS_PRIVATE_KEY', 'OASIS_CONTRACT_ADDRESS'],
            'Network Settings': ['CHAIN_ID', 'GAS_LIMIT', 'GAS_PRICE'],
            'External APIs': ['SATELLITE_API_KEY', 'IOT_API_KEY', 'VERRA_API_KEY', 'GOLD_STANDARD_API_KEY'],
            'Development': ['NODE_ENV', 'DEBUG', 'LOG_LEVEL', 'MOCK_DEPLOYMENT']
        };
        
        for (const [sectionName, vars] of Object.entries(sections)) {
            template += `# ${sectionName}\n`;
            vars.forEach(varName => {
                const config = this.requiredVars[varName];
                if (config) {
                    template += `# ${config.description}\n`;
                    if (config.required) {
                        template += `${varName}=your_${varName.toLowerCase()}_here\n`;
                    } else {
                        template += `${varName}=${config.default || ''}\n`;
                    }
                    template += '\n';
                }
            });
        }
        
        const templatePath = path.join(process.cwd(), '.env.example');
        fs.writeFileSync(templatePath, template);
        console.log(`✅ Template saved to: ${templatePath}`);
    }
}

// CLI usage
async function main() {
    const validator = new EnvironmentValidator();
    
    const args = process.argv.slice(2);
    if (args.includes('--generate-template')) {
        await validator.generateEnvTemplate();
        return;
    }
    
    const results = await validator.validateEnvironment();
    
    if (!results.valid) {
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = EnvironmentValidator;
