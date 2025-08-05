// File: scripts/utils/wallet-generator.js
// Secure Wallet Generator for GreenVault

const { JsonRpcProvider, Wallet, formatEther, entropyToMnemonic, hexlify } = require('ethers');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class WalletGenerator {
    constructor() {
        this.rpcUrl = process.env.OASIS_RPC_URL || 'https://testnet.sapphire.oasis.io';
        this.provider = new JsonRpcProvider(this.rpcUrl);
    }

    /**
     * Generate a new random wallet
     */
    generateRandomWallet() {
        console.log('🔐 Generating new random wallet...\n');
        
        // Generate random wallet
        const wallet = Wallet.createRandom();
        
        const walletInfo = {
            address: wallet.address,
            privateKey: wallet.privateKey,
            mnemonic: wallet.mnemonic.phrase,
            derivationPath: wallet.mnemonic.path
        };
        
        this.displayWalletInfo(walletInfo, 'Random Wallet Generated');
        return walletInfo;
    }

    /**
     * Generate wallet from custom mnemonic
     */
    generateFromMnemonic(mnemonic, derivationPath = "m/44'/60'/0'/0/0") {
        console.log('🔐 Generating wallet from mnemonic...\n');
        
        try {
            const wallet = Wallet.fromMnemonic(mnemonic, derivationPath);
            
            const walletInfo = {
                address: wallet.address,
                privateKey: wallet.privateKey,
                mnemonic: mnemonic,
                derivationPath: derivationPath
            };
            
            this.displayWalletInfo(walletInfo, 'Wallet from Mnemonic');
            return walletInfo;
            
        } catch (error) {
            console.error('❌ Invalid mnemonic phrase:', error.message);
            return null;
        }
    }

    /**
     * Generate multiple wallets for testing
     */
    generateMultipleWallets(count = 5) {
        console.log(`🔐 Generating ${count} test wallets...\n`);
        
        const wallets = [];
        
        for (let i = 0; i < count; i++) {
            const wallet = Wallet.createRandom();
            wallets.push({
                index: i + 1,
                address: wallet.address,
                privateKey: wallet.privateKey,
                mnemonic: wallet.mnemonic.phrase
            });
        }
        
        // Display summary
        console.log('📋 Generated Wallets Summary:');
        console.log('═'.repeat(60));
        wallets.forEach(wallet => {
            console.log(`${wallet.index}. ${wallet.address}`);
        });
        
        return wallets;
    }

    /**
     * Generate wallet with custom entropy
     */
    generateWithEntropy(customEntropy = null) {
        console.log('🔐 Generating wallet with custom entropy...\n');
        
        let entropy;
        if (customEntropy) {
            // Use provided entropy (must be 32 bytes)
            entropy = customEntropy;
        } else {
            // Generate cryptographically secure random entropy
            entropy = crypto.randomBytes(32);
        }
        
        const mnemonic = entropyToMnemonic(entropy);
        const wallet = Wallet.fromMnemonic(mnemonic);
        const walletInfo = {
            address: wallet.address,
            privateKey: wallet.privateKey,
            mnemonic: mnemonic,
            entropy: hexlify(entropy)
        };
        
        this.displayWalletInfo(walletInfo, 'Wallet with Custom Entropy');
        return walletInfo;
    }

    /**
     * Check balance of a wallet
     */
    async checkWalletBalance(addressOrPrivateKey) {
        console.log('💰 Checking wallet balance...\n');
        
        try {
            let address;
            
            // Determine if input is address or private key
            if (addressOrPrivateKey.length === 42 && addressOrPrivateKey.startsWith('0x')) {
                address = addressOrPrivateKey;
            } else if (addressOrPrivateKey.length === 66 && addressOrPrivateKey.startsWith('0x')) {
                const wallet = new Wallet(addressOrPrivateKey);
                address = wallet.address;
            } else {
                throw new Error('Invalid address or private key format');
            }
            
            const balance = await this.provider.getBalance(address);
            const balanceEth = formatEther(balance);
            const nonce = await this.provider.getTransactionCount(address);
            
            console.log(`📍 Address: ${address}`);
            console.log(`💎 Balance: ${balanceEth} ETH`);
            console.log(`📝 Nonce: ${nonce}`);
            console.log(`🌐 Network: Oasis Sapphire Testnet\n`);
            
            return {
                address,
                balance: balanceEth,
                balanceWei: balance.toString(),
                nonce
            };
            
        } catch (error) {
            console.error('❌ Balance check failed:', error.message);
            return null;
        }
    }

    /**
     * Save wallet to encrypted file
     */
    async saveWalletSecurely(walletInfo, password, filename = null) {
        console.log('💾 Saving wallet securely...\n');
        
        try {
            const wallet = new Wallet(walletInfo.privateKey);
            const encryptedJson = await wallet.encrypt(password);
            
            const safeFilename = filename || `wallet_${wallet.address.slice(2, 8)}_${Date.now()}.json`;
            const walletDir = path.join(process.cwd(), 'wallets');
            
            // Create wallets directory if it doesn't exist
            if (!fs.existsSync(walletDir)) {
                fs.mkdirSync(walletDir);
            }
            
            const filepath = path.join(walletDir, safeFilename);
            fs.writeFileSync(filepath, encryptedJson);
            
            console.log(`✅ Wallet saved to: ${filepath}`);
            console.log('🔒 Wallet is encrypted with your password');
            console.log('⚠️  Keep your password safe - it cannot be recovered!\n');
            
            return filepath;
            
        } catch (error) {
            console.error('❌ Failed to save wallet:', error.message);
            return null;
        }
    }

    /**
     * Load wallet from encrypted file
     */
    async loadWalletFromFile(filepath, password) {
        console.log('📂 Loading encrypted wallet...\n');
        
        try {
            const encryptedJson = fs.readFileSync(filepath, 'utf8');
            const wallet = await Wallet.fromEncryptedJson(encryptedJson, password);
            
            const walletInfo = {
                address: wallet.address,
                privateKey: wallet.privateKey,
                loadedFrom: filepath
            };
            
            console.log('✅ Wallet loaded successfully');
            console.log(`📍 Address: ${wallet.address}\n`);
            
            return walletInfo;
            
        } catch (error) {
            console.error('❌ Failed to load wallet:', error.message);
            console.log('💡 Common issues: wrong password, corrupted file, invalid format\n');
            return null;
        }
    }

    /**
     * Generate development environment configuration
     */
    generateDevEnvironment() {
        console.log('🚀 Setting up development environment...\n');
        
        // Generate main development wallet
        const devWallet = this.generateRandomWallet();
        
        // Generate test wallets
        console.log('\n🧪 Generating test wallets...');
        const testWallets = this.generateMultipleWallets(3);
        
        // Create environment template
        const envTemplate = this.createEnvTemplate(devWallet);
        
        console.log('\n📄 Environment Configuration:');
        console.log('═'.repeat(50));
        console.log(envTemplate);
        
        return {
            devWallet,
            testWallets,
            envTemplate
        };
    }

    /**
     * Create .env template with generated wallet
     */
    createEnvTemplate(walletInfo) {
        return `# GreenVault Development Environment
# Generated on ${new Date().toISOString()}

# Core Oasis Configuration
OASIS_RPC_URL=https://testnet.sapphire.oasis.io
OASIS_PRIVATE_KEY=${walletInfo.privateKey}
OASIS_CONTRACT_ADDRESS=YOUR_CONTRACT_ADDRESS

# Network Settings
CHAIN_ID=23295
GAS_LIMIT=1000000
GAS_PRICE=1000000000

# Development Settings
NODE_ENV=development
DEBUG=true
LOG_LEVEL=info
MOCK_DEPLOYMENT=false

# External APIs (Optional - mock data used if not provided)
SATELLITE_API_KEY=your_satellite_api_key_here
IOT_API_KEY=your_iot_api_key_here
VERRA_API_KEY=your_verra_api_key_here
GOLD_STANDARD_API_KEY=your_gold_standard_api_key_here`;
    }

    /**
     * Display wallet information securely
     */
    displayWalletInfo(walletInfo, title) {
        console.log(`🎯 ${title}`);
        console.log('═'.repeat(50));
        console.log(`📍 Address: ${walletInfo.address}`);
        console.log(`🔑 Private Key: ${walletInfo.privateKey.substring(0, 10)}...${walletInfo.privateKey.slice(-6)} (truncated)`);
        
        if (walletInfo.mnemonic) {
            console.log(`📝 Mnemonic: ${walletInfo.mnemonic}`);
        }
        
        if (walletInfo.derivationPath) {
            console.log(`🛤️  Path: ${walletInfo.derivationPath}`);
        }
        
        if (walletInfo.entropy) {
            console.log(`🎲 Entropy: ${walletInfo.entropy.substring(0, 10)}...${walletInfo.entropy.slice(-6)}`);
        }
        
        console.log('\n⚠️  Security Warnings:');
        console.log('• Never share your private key or mnemonic');
        console.log('• Store them securely (preferably encrypted)');
        console.log('• These are for testnet only - never use in production');
        console.log('• Fund your wallet at: https://faucet.testnet.oasis.io/\n');
    }

    /**
     * Validate wallet security
     */
    validateWalletSecurity(privateKey) {
        console.log('🔍 Validating wallet security...\n');
        
        const issues = [];
        
        // Check private key format
        if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
            issues.push('Invalid private key format');
        }
        
        // Check for common weak keys (all zeros, sequential, etc.)
        const keyWithoutPrefix = privateKey.slice(2);
        if (keyWithoutPrefix.match(/^0+$/) || keyWithoutPrefix.match(/^1+$/) || keyWithoutPrefix.match(/^f+$/i)) {
            issues.push('Potentially weak private key detected');
        }
        
        // Check entropy quality (basic)
        const bytes = Buffer.from(keyWithoutPrefix, 'hex');
        const uniqueBytes = new Set(bytes).size;
        if (uniqueBytes < 10) {
            issues.push('Low entropy private key detected');
        }
        
        if (issues.length === 0) {
            console.log('✅ Wallet security validation passed');
        } else {
            console.log('⚠️  Security issues detected:');
            issues.forEach(issue => console.log(`   • ${issue}`));
        }
        
        console.log();
        return issues.length === 0;
    }
}

// CLI usage
async function main() {
    const generator = new WalletGenerator();
    const args = process.argv.slice(2);
    
    if (args.includes('--help')) {
        console.log(`
🔐 GreenVault Wallet Generator

Usage:
  node wallet-generator.js [options]

Options:
  --random              Generate random wallet
  --multiple [count]    Generate multiple test wallets (default: 5)
  --mnemonic "phrase"   Generate from mnemonic phrase
  --entropy             Generate with custom entropy
  --balance "address"   Check wallet balance
  --dev-env             Setup complete development environment
  --validate "key"      Validate private key security
  --help                Show this help message

Examples:
  node wallet-generator.js --random
  node wallet-generator.js --multiple 10
  node wallet-generator.js --balance 0x1234...
  node wallet-generator.js --dev-env
        `);
        return;
    }
    
    if (args.includes('--random')) {
        generator.generateRandomWallet();
    } else if (args.includes('--multiple')) {
        const countIndex = args.indexOf('--multiple') + 1;
        const count = args[countIndex] ? parseInt(args[countIndex]) : 5;
        generator.generateMultipleWallets(count);
    } else if (args.includes('--mnemonic')) {
        const mnemonicIndex = args.indexOf('--mnemonic') + 1;
        const mnemonic = args[mnemonicIndex];
        if (mnemonic) {
            generator.generateFromMnemonic(mnemonic);
        } else {
            console.error('❌ Please provide mnemonic phrase');
        }
    } else if (args.includes('--entropy')) {
        generator.generateWithEntropy();
    } else if (args.includes('--balance')) {
        const addressIndex = args.indexOf('--balance') + 1;
        const address = args[addressIndex];
        if (address) {
            await generator.checkWalletBalance(address);
        } else {
            console.error('❌ Please provide wallet address or private key');
        }
    } else if (args.includes('--dev-env')) {
        generator.generateDevEnvironment();
    } else if (args.includes('--validate')) {
        const keyIndex = args.indexOf('--validate') + 1;
        const privateKey = args[keyIndex];
        if (privateKey) {
            generator.validateWalletSecurity(privateKey);
        } else {
            console.error('❌ Please provide private key to validate');
        }
    } else {
        // Default: generate random wallet
        generator.generateRandomWallet();
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = WalletGenerator;
