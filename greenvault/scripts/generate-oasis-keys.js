#!/usr/bin/env node

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

/**
 * Generate Oasis Sapphire credentials for production
 * This script creates a new private key and provides setup instructions
 */

console.log('🔐 Generating Oasis Sapphire Credentials for Production');
console.log('=' .repeat(60));

// Generate a new private key
const wallet = ethers.Wallet.createRandom();

console.log('\n📊 Generated Credentials:');
console.log('Private Key:', wallet.privateKey);
console.log('Public Address:', wallet.address);

console.log('\n🌐 Network Endpoints:');
console.log('Mainnet: https://sapphire-mainnet.oasis.dev');
console.log('Testnet: https://testnet.sapphire.oasis.dev');

console.log('\n💰 Getting Test Tokens:');
console.log('1. Visit: https://faucet.testnet.oasis.dev/');
console.log('2. Enter your address:', wallet.address);
console.log('3. Request test ROSE tokens');

console.log('\n📝 Contract Deployment Steps:');
console.log('1. Deploy your preferences contract to Oasis Sapphire');
console.log('2. Get the deployed contract address');
console.log('3. Update your .env.local file');

console.log('\n🔧 Environment Variables to Update:');
console.log(`OASIS_PRIVATE_KEY=${wallet.privateKey}`);
console.log('OASIS_PREFERENCES_CONTRACT=<your_deployed_contract_address>');
console.log('NEXT_PUBLIC_OASIS_SAPPHIRE_ENDPOINT=https://sapphire-mainnet.oasis.dev');

console.log('\n⚠️  Security Warning:');
console.log('- NEVER commit your private key to version control');
console.log('- Store it securely (use environment variables)');
console.log('- Consider using a hardware wallet for production');

console.log('\n📋 Next Steps:');
console.log('1. Save your private key securely');
console.log('2. Get test ROSE tokens from the faucet');
console.log('3. Deploy a preferences storage contract');
console.log('4. Update your environment variables');
console.log('5. Test on Sapphire testnet first');

// Save to secure file (not in git)
const credentialsFile = path.join(__dirname, '../.oasis-credentials.txt');
const credentials = `
Oasis Sapphire Credentials (Generated ${new Date().toISOString()})
================================================================

Private Key: ${wallet.privateKey}
Public Address: ${wallet.address}

Environment Variables:
OASIS_PRIVATE_KEY=${wallet.privateKey}
OASIS_PREFERENCES_CONTRACT=<deploy_contract_and_add_address_here>
NEXT_PUBLIC_OASIS_SAPPHIRE_ENDPOINT=https://sapphire-mainnet.oasis.dev

⚠️  KEEP THIS FILE SECURE - DO NOT COMMIT TO GIT
`;

fs.writeFileSync(credentialsFile, credentials);
console.log(`\n💾 Credentials saved to: ${credentialsFile}`);
console.log('(This file is gitignored for security)');
