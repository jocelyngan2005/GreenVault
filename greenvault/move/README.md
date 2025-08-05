# GreenVault Sui Smart Contract

## Overview

GreenVault is a carbon credit trading and sustainability platform built on Sui, leveraging Move smart contracts for secure, transparent, and inclusive climate action. The system supports carbon credit NFTs, decentralized identity (DID), oracle data verification, fractional credits, and community-focused features.

## Modules 

- **carbon_credit.move** Mint, trade, retire, and manage carbon credit NFTs. Supports project registry and marketplace.
- **did_manager.move:** Privacy-preserving decentralized identity, community verification, and reputation system.
- **oracle_integration.move:** Oracle registry and CO2 data verification for projects.
- **fractional_credits.move:** Fractionalization of credits, micro-credit rewards, and inclusive trading.
- **integration_bridge.move:** Central hub for integrating all modules and managing permissions, stats, and lifecycle events.

## Getting Started

### Prerequisites

- Sui CLI
- Move toolchain

### Installation

Clone the repository:

```bash
git clone https://github.com/your-org/GreenVault.git
cd GreenVault/greenvault/move
```

### Build & Test

```bash
sui move build
sui move test
```

### Publish to Sui Network 

```bash
cd move
sui client publish --gas-budget <amount>
```

## 📋 Module Architecture

### 1. Carbon Credit Module (`carbon_credit.move`)

**Core Functions:**

#### Project Management
- `register_project()` - Register new carbon offset projects
- `verify_project()` - Admin verification of projects before credit minting
- `add_verified_issuer()` - Grant issuer privileges to verified organizations

#### Credit Lifecycle
- `mint_carbon_credit()` - Issue carbon credit NFTs for verified projects
- `mint_micro_credit()` - Create small credits for everyday eco-friendly actions
- `retire_credit()` - Permanently remove credits from circulation
- `set_credit_pending()` - Mark credits as pending verification

#### Marketplace Operations
- `list_credit_for_sale()` - List credits on the marketplace
- `list_credit_with_community_priority()` - List with community discounts
- `buy_credit()` - Purchase listed credits

#### Identity Integration
- `register_did()` - Register decentralized identities

#### Query Functions
- `get_marketplace_stats()` - Retrieve trading volume and community fund data
- `get_registry_stats()` - Get total credits issued and retired
- `get_credit_info()` - Get detailed credit information

**Key Features:**
- **Community Priority**: Reserved trading periods and discounts for underserved communities
- **Fee Structure**: Automatic fee distribution with 25% going to community fund
- **Project Types**: Support for reforestation, clean cooking, renewable energy, waste management, and agriculture
- **Status Tracking**: Active, escrowed, retired, and pending status management

### 2. Oracle Integration Module (`oracle_integration.move`)

**Core Functions:**

#### Oracle Management
- `register_oracle()` - Admin registration of authorized oracles
- `slash_oracle()` - Penalize oracles for malicious behavior

#### Data Verification
- `request_co2_verification()` - Submit CO2 measurement data for verification
- `submit_oracle_verification()` - Oracle submission of verification results
- `update_data_feed()` - Update real-time environmental data feeds

#### Query Functions
- `get_oracle_reputation()` - Check oracle reliability scores
- `get_data_feed()` - Retrieve latest environmental data
- `validate_data_feed()` - Check feed validity and confirmations
- `is_verification_complete()` - Check if verification has required confirmations
- `get_data_feed_by_type()` - Get feeds by environmental data type

**Key Features:**
- **Reputation System**: Dynamic scoring based on verification accuracy
- **Multi-Oracle Consensus**: Requires multiple confirmations for verification
- **Data Types**: CO2 emissions, forest coverage, renewable energy, waste reduction
- **Stake-Based Security**: Oracles must stake tokens to participate

### 3. Fractional Credits Module (`fractional_credits.move`)

**Core Functions:**

#### Fractionalization
- `fractionalize_credit()` - Convert carbon credit NFTs into tradeable fractions
- `purchase_fractions()` - Buy fractional credits for micro-transactions

#### Micro-Credit System
- `setup_action_rewards()` - Configure rewards for eco-friendly actions
- `claim_micro_credits()` - Claim rewards for sustainable behaviors
- `retire_fractions()` - Permanently offset fractional credits

#### Query Functions
- `get_pool_info()` - Get fractionalization pool details
- `get_user_fraction_balance()` - Check user's fractional holdings
- `get_daily_limit_info()` - View daily earning limits and progress

**Key Features:**
- **Micro-Transactions**: Enable small-scale carbon offsetting
- **Daily Limits**: Prevent gaming with reasonable earning caps
- **Action Rewards**: Configurable rewards for various sustainable actions
- **Community Pool**: Accumulated fractions for community initiatives

### 4. DID Manager Module (`did_manager.move`)

**Core Functions:**

#### Identity Management
- `create_identity()` - Create privacy-preserving digital identities
- `update_privacy_settings()` - Manage data sharing preferences

#### Verification System
- `register_community_verifier()` - Register organizations that can verify identities
- `request_verification()` - Submit verification upgrade requests
- `process_verification()` - Community verifier approval/rejection

#### Reputation & Actions
- `record_sustainability_action()` - Log eco-friendly actions for reputation
- `endorse_community_member()` - Community peer endorsement system

#### Query Functions
- `get_public_identity_info()` - Retrieve public identity data (with privacy controls)
- `get_verification_level()` - Check user verification status
- `get_manager_stats()` - System-wide identity statistics

**Key Features:**
- **Privacy-First**: Encrypted attributes with zero-knowledge proofs
- **Community Verification**: Peer-to-peer identity validation
- **Reputation Scoring**: Dynamic scoring based on sustainable actions
- **Verification Levels**: Basic, KYC, Community, and Institutional tiers

### 5. Integration Bridge Module (`integration_bridge.move`)

**Core Functions:**

#### Cross-Module Operations
- `initialize_hub()` - Setup central coordination hub
- `register_verified_project()` - Register projects with automatic oracle verification
- `onboard_community_member()` - Complete user onboarding across all modules
- `issue_verified_credits()` - Mint credits only after oracle verification

#### Enhanced Trading
- `community_verified_trade()` - Trading with DID verification requirements
- `record_comprehensive_action()` - Multi-module sustainability action logging

#### Administration
- `grant_permissions()` - Manage cross-module access permissions
- `generate_impact_report()` - Create comprehensive impact assessments

#### Query Functions
- `get_hub_stats()` - Central statistics across all modules
- `has_permission()` - Check user permissions for cross-module operations

**Key Features:**
- **Unified Operations**: Seamless interaction between all modules
- **Permission System**: Fine-grained access control across modules
- **Impact Tracking**: Comprehensive measurement of environmental and social impact
- **Community Integration**: Special workflows for underserved populations


## 🎯 Use Cases

### For Environmental Projects
1. **Register Project** → **Oracle Verification** → **Mint Credits** → **List for Sale**
2. Ongoing monitoring through oracle data feeds
3. Community-priority trading for social impact projects

### For Individual Users
1. **Create DID Identity** → **Verify with Community** → **Perform Eco-Actions**
2. Earn micro-credits for daily sustainable behaviors
3. Purchase fractional credits for personal offsetting

### For Refugees and Underserved Communities
1. **Special Onboarding** with community verification
2. **Priority Access** to discounted carbon credits
3. **Enhanced Rewards** for sustainability actions
4. **Community Fund** support from marketplace fees

### For Organizations
1. **Become Oracle** for data verification services
2. **Register as Community Verifier** for identity validation
3. **Bulk Trading** with institutional verification levels

## 🔧 Technical Architecture

### Data Structures
- **Shared Objects**: Registries, marketplaces, and managers for multi-user access
- **Owned Objects**: Individual credits and verification requests
- **Tables**: Efficient storage for large datasets (projects, identities, oracles)

### Security Features
- **Access Control**: Role-based permissions with admin functions
- **Oracle Consensus**: Multiple confirmations required for data verification
- **Reputation System**: Dynamic scoring to prevent malicious behavior
- **Privacy Protection**: Encrypted attributes with user-controlled sharing

### Economic Mechanisms
- **Fee Distribution**: 25% of marketplace fees support community initiatives
- **Stake Requirements**: Oracles must stake tokens for participation
- **Daily Limits**: Prevent micro-credit gaming while enabling genuine participation
- **Community Discounts**: Special pricing for verified underserved populations

## 🚀 Getting Started

1. **Deploy Contracts**: Use the deployment scripts in `/scripts/production/`
2. **Initialize System**: Run the integration hub setup
3. **Register Initial Oracles**: Set up data verification network
4. **Onboard Community Verifiers**: Enable identity verification
5. **Register First Projects**: Begin carbon credit lifecycle

For detailed testing instructions, see `smart_contract_testing_guide.md`.


## Features

- Carbon credit NFT minting, trading, and retirement
- DID-based identity and community verification
- Oracle integration for verified sustainability data
- Fractional credits for micro-transactions and inclusive rewards
- Community-focused trading and impact reporting

## License

This project is licensed under the MIT License.
