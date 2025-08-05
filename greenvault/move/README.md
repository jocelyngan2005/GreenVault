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

## Usage

- Deploy modules to Sui and initialize with the provided entry functions.
- Interact with contracts using Sui CLI, SDK, or integrate with your Next.js backend via API routes.

## Features

- Carbon credit NFT minting, trading, and retirement
- DID-based identity and community verification
- Oracle integration for verified sustainability data
- Fractional credits for micro-transactions and inclusive rewards
- Community-focused trading and impact reporting

## License

This project is licensed under the MIT License.
