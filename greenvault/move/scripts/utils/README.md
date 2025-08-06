# 🔧 GreenVault Utilities Directory

This directory contains essential utility scripts for the GreenVault project. These tools help with environment validation, network monitoring, and wallet management.

## 📁 Directory Contents

### 🔍 **Environment Validator** (`env-validator.js`)
Validates your environment configuration to ensure all required variables are properly set.

**Features:**
- ✅ Validates all required environment variables
- ⚠️ Warns about missing optional variables  
- 🔐 Securely displays sensitive information (masked)
- 📄 Generates .env.example template
- 🎯 Provides specific recommendations for fixes

**Usage:**
```bash
# Validate current environment
npm run validate-env

# Generate .env template
node scripts/utils/env-validator.js --generate-template
```

**Key Validations:**
- `OASIS_PRIVATE_KEY` format and presence
- `OASIS_RPC_URL` connectivity format
- `OASIS_CONTRACT_ADDRESS` format (if deployed)
- Network configuration (Chain ID, gas settings)
- Optional API keys for external services

---

### 🌐 **Network Status Checker** (`network-status.js`)
Comprehensive network connectivity and status monitoring tool.

**Features:**
- 🔗 Network connectivity testing
- 💰 Wallet balance and status checking
- 📄 Contract deployment verification
- ⚡ Quick status overview mode
- 📊 Detailed status reporting

**Usage:**
```bash
# Full network status check
npm run check-network

# Quick status check
npm run check-network-quick

# Direct usage
node scripts/utils/network-status.js
node scripts/utils/network-status.js --quick
```

**Status Checks:**
- **Network**: RPC connectivity, chain ID, block number, gas prices
- **Wallet**: Address validation, balance, transaction count
- **Contract**: Deployment status, owner, last update, CO2 data

---

### 🔐 **Wallet Generator** (`wallet-generator.js`)
Secure wallet generation and management utility for development and testing.

**Features:**
- 🎲 Generate random secure wallets
- 📝 Create wallets from mnemonic phrases
- 🧪 Generate multiple test wallets
- 💰 Check wallet balances
- 🔒 Save/load encrypted wallet files
- 🚀 Setup complete development environment
- ✅ Validate wallet security

**Usage:**
```bash
# Generate random wallet
npm run generate-wallet

# Setup complete dev environment
npm run generate-dev-env

# Check wallet balance
npm run check-balance 0x1234...

# Advanced options
node scripts/utils/wallet-generator.js --help
node scripts/utils/wallet-generator.js --multiple 10
node scripts/utils/wallet-generator.js --mnemonic "your twelve word phrase here"
node scripts/utils/wallet-generator.js --validate 0x1234privatekey...
```

**Security Features:**
- 🔐 Cryptographically secure random generation
- 🎯 Private key format validation
- 🛡️ Weak key detection
- 🔒 Encrypted wallet file storage
- ⚠️ Security warnings and best practices

---

## 🚀 Quick Start Guide

### 1. **Validate Your Environment**
```bash
npm run validate-env
```
This will check if your `.env` file is properly configured.

### 2. **Check Network Status**
```bash
npm run check-network
```
Verify connectivity to Oasis network and contract status.

### 3. **Generate Development Wallet**
```bash
npm run generate-dev-env
```
Creates a complete development environment with wallets and configuration.

### 4. **Quick Health Check**
```bash
npm run check-network-quick
```
Fast overview of system status.

---

## 📋 NPM Scripts Reference

| Script | Description | Tool Used |
|--------|-------------|-----------|
| `validate-env` | Validate environment configuration | `env-validator.js` |
| `check-network` | Full network status check | `network-status.js` |
| `check-network-quick` | Quick network status | `network-status.js --quick` |
| `generate-wallet` | Generate random wallet | `wallet-generator.js --random` |
| `generate-dev-env` | Setup development environment | `wallet-generator.js --dev-env` |
| `check-balance` | Check wallet balance | `wallet-generator.js --balance` |

---

## 🔧 Advanced Usage

### Environment Validator

**Generate Template:**
```bash
node scripts/utils/env-validator.js --generate-template
```

**Integration in CI/CD:**
```bash
# Validate environment before deployment
npm run validate-env || exit 1
npm run deploy:testnet
```

### Network Status Checker

**Programmatic Usage:**
```javascript
const NetworkStatusChecker = require('./scripts/utils/network-status.js');

const checker = new NetworkStatusChecker();
const status = await checker.checkCompleteStatus();

if (status.overall === 'ready') {
    console.log('System ready for deployment!');
}
```

### Wallet Generator

**Multiple Wallets:**
```bash
node scripts/utils/wallet-generator.js --multiple 10
```

**From Mnemonic:**
```bash
node scripts/utils/wallet-generator.js --mnemonic "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
```

**Encrypted Storage:**
```javascript
const WalletGenerator = require('./scripts/utils/wallet-generator.js');

const generator = new WalletGenerator();
const wallet = generator.generateRandomWallet();
await generator.saveWalletSecurely(wallet, 'your-password', 'dev-wallet.json');
```

---

## 🛡️ Security Best Practices

### ⚠️ **Important Security Notes**

1. **Never commit private keys** to version control
2. **Use encrypted wallet files** for storage
3. **Validate wallet security** before production use
4. **Keep passwords secure** - they cannot be recovered
5. **Use testnet only** for development wallets
6. **Fund wallets securely** using official faucets

### 🔐 **Environment Security**

- Store sensitive data in `.env` files (gitignored)
- Use environment-specific configurations
- Validate all inputs before processing
- Monitor for weak or compromised keys

---

## 🐛 Troubleshooting

### Common Issues

**Environment Validation Fails:**
- Check if `.env` file exists in project root
- Verify private key format (0x + 64 hex characters)
- Ensure RPC URL is accessible

**Network Connection Issues:**
- Verify RPC endpoint is correct
- Check internet connectivity
- Confirm Chain ID matches network

**Wallet Generation Problems:**
- Ensure sufficient entropy
- Check Node.js version compatibility
- Verify ethers.js dependency

### 🆘 **Getting Help**

1. Run validation tools first: `npm run validate-env`
2. Check network status: `npm run check-network`
3. Review error messages carefully
4. Consult the main project documentation
5. Check Oasis network status

---

## 📚 Dependencies

These utilities require:
- **Node.js** v16+ 
- **ethers.js** v6.x
- **dotenv** for environment management
- **crypto** (built-in Node.js module)
- **fs/path** (built-in Node.js modules)

---

## 🎯 Integration Examples

### Pre-deployment Check Script
```bash
#!/bin/bash
# deployment-check.sh

echo "🔍 Pre-deployment validation..."

# Validate environment
npm run validate-env || { echo "Environment validation failed!"; exit 1; }

# Check network status
npm run check-network || { echo "Network check failed!"; exit 1; }

echo "✅ Ready for deployment!"
npm run deploy:testnet
```

### Development Setup Script
```bash
#!/bin/bash
# dev-setup.sh

echo "🚀 Setting up development environment..."

# Generate development environment
npm run generate-dev-env

# Validate setup
npm run validate-env

echo "✅ Development environment ready!"
echo "💰 Don't forget to fund your wallet at https://faucet.testnet.oasis.io/"
```

---

*These utilities are essential for maintaining a secure and reliable GreenVault development environment. Always validate your setup before deploying to production networks.*
