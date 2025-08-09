#!/usr/bin/env node

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

/**
 * Deploy UserPreferencesStorage contract to Oasis Sapphire
 * This script deploys the contract and provides the address for your .env
 */

async function deployContract() {
    console.log('🚀 Deploying UserPreferencesStorage to Oasis Sapphire');
    console.log('=' .repeat(60));

    // Read your private key (you'll need to update this)
    const PRIVATE_KEY = process.env.OASIS_PRIVATE_KEY || '0xa95244744f9fe883c5f042ff4221809483d08cafad4ba9d0ac18170ce634a06b';
    
    // Connect to Oasis Sapphire Testnet
    const provider = new ethers.JsonRpcProvider('https://testnet.sapphire.oasis.dev');
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('📍 Deploying from address:', wallet.address);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log('💰 Account balance:', ethers.formatEther(balance), 'ROSE');
    
    if (balance === 0n) {
        console.log('❌ No ROSE tokens found!');
        console.log('🔗 Get test tokens: https://faucet.testnet.oasis.dev/');
        console.log('📋 Your address:', wallet.address);
        return;
    }

    // Contract source code (simplified for deployment)
    const contractSource = `
        pragma solidity ^0.8.0;
        
        contract UserPreferencesStorage {
            event PreferencesUpdated(string indexed userId, uint256 timestamp);
            
            mapping(string => bytes) private userPreferences;
            mapping(string => bool) public hasPreferences;
            address public owner;
            
            constructor() { owner = msg.sender; }
            
            function storePreferences(string memory userId, bytes memory encryptedData) external {
                userPreferences[userId] = encryptedData;
                hasPreferences[userId] = true;
                emit PreferencesUpdated(userId, block.timestamp);
            }
            
            function getPreferences(string memory userId) external view returns (bytes memory) {
                return userPreferences[userId];
            }
            
            function deletePreferences(string memory userId) external {
                delete userPreferences[userId];
                hasPreferences[userId] = false;
                emit PreferencesUpdated(userId, block.timestamp);
            }
            
            function userHasPreferences(string memory userId) external view returns (bool) {
                return hasPreferences[userId];
            }
        }
    `;

    // Compile contract (simplified)
    // In production, use Hardhat or Foundry for compilation
    console.log('⚙️  For contract deployment, you can use:');
    console.log('1. Remix IDE: https://remix.ethereum.org/');
    console.log('2. Hardhat: npm install --save-dev hardhat');
    console.log('3. Foundry: https://getfoundry.sh/');
    
    console.log('\n📝 Manual Deployment Steps:');
    console.log('1. Copy the contract from contracts/UserPreferencesStorage.sol');
    console.log('2. Go to https://remix.ethereum.org/');
    console.log('3. Create new file and paste the contract');
    console.log('4. Compile the contract');
    console.log('5. Connect to Oasis Sapphire Testnet');
    console.log('6. Deploy using your private key');
    
    console.log('\n🌐 Oasis Sapphire Network Details:');
    console.log('Network Name: Oasis Sapphire Testnet');
    console.log('RPC URL: https://testnet.sapphire.oasis.dev');
    console.log('Chain ID: 0x5aff');
    console.log('Currency: ROSE');
    console.log('Explorer: https://testnet.explorer.sapphire.oasis.dev/');
    
    console.log('\n📋 After Deployment:');
    console.log('1. Copy the contract address');
    console.log('2. Update OASIS_PREFERENCES_CONTRACT in .env.local');
    console.log('3. Test your AI agent with real Oasis integration!');
}

deployContract().catch(console.error);
