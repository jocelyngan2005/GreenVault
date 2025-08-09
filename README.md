# GreenVault 🌱

A minimalistic black-and-white progressive web application built with Next.js that combines a privacy-preserving identity/password manager with a decentralized carbon credit marketplace.

## Introduction

### 📝 Problem Statement
Many individuals and organizations lack secure digital identities and access to sustainability-focused programs, while small-scale carbon offset projects often go unrecognized or unverified. GreenVault aims to solve both:
- Provide a privacy-preserving, decentralized identity and password manager for anyone needing secure storage of secrets, credentials, or accounts.
- Enable on-chain participation in verified carbon credit ecosystems, especially for those seeking transparency and global access.

### 🎯 Objectives
1. Deliver a secure, privacy-first decentralized identity and password management system for users with limited access to digital infrastructure while introducing global sustainability and carbon credit ecosystem.
2. Empower individuals and organizations to participate in global sustainability markets by registering, trading, and tracking carbon offset assets tied to real-world projects.
3. Foster inclusivity by making wallet-optional, low-bandwidth, and accessible solutions for onboarding and participation.
4. Support verification and recognition of small-scale carbon offset projects, increasing transparency and impact.

### 🏗️ System Overview
GreenVault is a Web3-based platform that combines decentralized identity management with a sustainable carbon credit marketplace. The system is designed to be privacy-first, wallet-optional, and inclusivity-driven, enabling:
- Secure, decentralized identity creation and management using zkLogin and DID protocols.
- Encrypted secrets and password management via Walrus & Seal and Oasis Confidential EVM.
- On-chain registration, trading, and staking of verified carbon credit NFTs, with support for fractional ownership and performance-based returns.
- AI-powered assistant for carbon offset guidance, impact analysis, and personalized recommendations.
- Accessible user interfaces and APIs for both individuals and project owners, supporting low-bandwidth and mobile-first use cases.

### 👥 User Roles & Workflow
GreenVault connects local project owners (who supply carbon offset projects) with buyers (companies or individuals who buy carbon credits) in a secure, trustless, and decentralized way. The vault can also be used by any user to store and manage other secret accounts or credentials.

#### User Role A: Local Project Owner / Individual Needing Secure Vault
- Log in using email or Google (via zkLogin) — no wallet required.
- System creates a DID and a secure Vault tied to this identity.
- Register your carbon offset project (e.g., 10 hectares of forest preserved in Indonesia), or use the Vault to store other secret accounts and credentials.
- Platform mints an NFT representing your project (with metadata: type, CO₂ amount, location).
- List your project/NFT on the marketplace for buyers to purchase carbon credits.

#### User Role B: Company or Individual Wanting to Offset Emissions
- Log in using email or Google (via zkLogin) — no wallet required.
- Go to the Dashboard and input your goal: e.g., "Offset 5 tons this month".
- View available carbon credit NFTs from verified projects.
- Buy NFTs; the CO₂ amount is marked as offset in your profile.
- Optionally, use the AI assistant to automate monthly offsetting and get recommendations.

## 👩‍💻 Developer Roles 

**June** — Blockchain & Smart Contracts Lead
   - Develop smart contracts on Sui for carbon credit minting, trading, and project registry
   - Integrate Oasis trustless oracles for CO₂ data
   - Optional DID anchoring
   - Write contract tests & deploy

**Pui Yan** — Identity & Privacy Engineer
   - Implement zkLogin (email/Google access)
   - Create and manage DIDs
   - Build Password & Identity Vault using Walrus & Seal
   - Handle key encryption/decryption logic

**Jocelyn** — Frontend & AI/UX Lead
   - Design and develop PWA frontend (Login, Vault, Carbon dashboard)
   - Implement AI Agent: auto-buy carbon credits, chat-based assistant
   - Create pitch deck, handle demo UI

#### Summary
- Local project owners supply and register offset projects, earning recognition and revenue, or use the Vault for secure management of other secrets.
- Buyers (companies/individuals) offset their own emissions by purchasing verified credits.
- GreenVault provides the secure, decentralized infrastructure to connect, verify, and transact between these groups, while also serving as a general-purpose vault for secret account management.

## Features

### 🔐 Privacy-Preserving Identity Manager
- **zkLogin Authentication**: Wallet-less login using email or Google
- **Decentralized Identity (DID)**: Secure identity management without storing personal data
- **Encrypted Vault**: Password and secrets management using Walrus & Seal + Oasis Confidential EVM
- **Decrypt-on-demand**: Secure access to stored credentials

### 🌱 Carbon Credit Marketplace
- **Verified Carbon Credits as NFTs**: Browse and purchase verified carbon offset projects
- **Project Details**: View CO2 offset amounts, locations, prices, and verification status
- **Portfolio Management**: Track owned carbon credits and environmental impact
- **Listing Capability**: NGOs and project owners can list new carbon credits

### 🤖 AI Assistant
- **Carbon Offset Guidance**: AI-powered assistant for finding optimal carbon credits
- **Impact Analysis**: Track and analyze your environmental footprint
- **Sustainable Recommendations**: Personalized suggestions for carbon offsetting

##  Tech Stack 🛠️

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS (minimal black-and-white theme)
- **Authentication**: zkLogin
- **Storage**: Walrus & Seal
- **Design**: Progressive, low-bandwidth-friendly, accessible

##  Getting Started 🚀

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   Navigate to `http://localhost:3001` (or the port shown in terminal)


## Pages & Components 

### 📄 Landing Page (`/`)
- Project introduction and mission statement
- Login/Sign up with zkLogin (email/Google)
- Language toggle (English/Spanish)
- Clean, minimal design with key features
- Overview of platform features and sustainability goals

### 📄 Authentication
- **Login** (`/login`): zkLogin with email/Google options
- **Sign Up** (`/signup`): Account creation with DID setup
- **Onboarding** (`/onboarding`): Guided setup for identity, vault creation, and sustainability onboarding

### 📄 Vault Dashboard (`/vault`)
- Encrypted password and secret management (Walrus & Seal, Oasis Confidential EVM)
- Organize secrets by category (credentials, project keys, etc.)
- Add/edit/delete secrets
- Master password authentication for decryption
- Use vault for storing credentials, carbon project keys, or other sensitive data

### 📄 Carbon Marketplace (`/marketplace`)
- Grid view of available carbon credits (NFTs)
- Filter projects by type, location, impact, and verification status
- Purchase carbon credits (on-chain, wallet-optional)
- List new credits/projects for sale (for project owners)
- View project details: CO₂ offset, verification, metadata

### 📄 My Carbon Assets (`/assets`)
- Portfolio of owned carbon credits (NFTs)
- Track environmental impact (CO₂ offset summary)
- View transaction history
- Retire credits (mark as offset)

### 📄 AI Assistant (`/assistant`)
- Chat interface for carbon offset guidance and sustainability recommendations
- Quick actions for offsetting, impact analysis, and monthly automation
- Personalized suggestions based on user profile and goals

### 📄 Settings (`/settings`)
- Manage DID (decentralized identity)
- Vault recovery and backup options
- Theme toggle (light/dark)
- Language selector
- Account management (profile, security, preferences)

### 📄 Role Selection (`/role-selection`)
- Choose between "Project Owner" and "Credit Buyer" roles.
- **Project Owner:** Register carbon offset projects, mint NFTs, list on marketplace, track verification/sales, no wallet required.
- **Credit Buyer:** Set offset goals, browse/purchase verified carbon credit NFTs, track footprint, use AI assistant, login with zkLogin or wallet.
- Role selection is stored and can be switched later.

### 📄 Project Owner Pages
- `/project-owner`: Dashboard for project owners.
- `/project-owner/new-project`: Register new carbon offset projects.
- `/project-owner/marketplace`: Manage listed projects and view marketplace status.
- `/project-owner/assets`: View owned project assets.
- `/project-owner/verification`: Track and manage project verification.

### 📄 Credit Buyer Pages
- `/credit-buyer`: Dashboard for buyers.
- `/credit-buyer/marketplace`: Browse and purchase carbon credits (multiple marketplace views).
- `/credit-buyer/assets`: View owned credits and impact.
- `/credit-buyer/cart`: Manage purchase cart.

### 📄 Learn More (`/learn-more`)
Provides an in-depth overview of GreenVault's mission, user roles, platform features, and the impact of carbon credits. Includes:
- Explanation of how GreenVault connects project owners and buyers
- Details on privacy, security, and sustainability benefits
- Guidance for new users on choosing a role and getting started

### 📄 Profile (`/profile`)
Central hub for managing your GreenVault identity and activity:
- View and update your decentralized identity (DID)
- Access and manage your encrypted vault
- Track your carbon offset history and environmental impact
- Edit personal information and security settings

### 📄 Vault (`/vault`)
Advanced encrypted vault for all your sensitive data:
- Store and organize passwords, credentials, and project keys
- Use category-based organization for easy access
- Add, edit, and delete secrets securely
- Decrypt secrets on demand with master password authentication
- Integrates with Walrus & Seal and Oasis Confidential EVM for privacy

### 📄 Onboarding, Login, Signup, Auth Callback
Essential flows for user access and identity setup:
- `/onboarding`: Step-by-step guide for new users to set up identity, vault, and understand platform features
- `/login`: Secure authentication using zkLogin (email/Google) or wallet
- `/signup`: Create a new account, set up DID, and vault
- `/auth/callback`: Handles authentication responses and redirects for third-party logins

## Design Principles 🎨

- **Minimalist**: Pure black-and-white color scheme
- **Accessible**: Semantic HTML and ARIA compliant
- **Progressive**: Works on all devices and connections
- **Low-bandwidth**: Optimized for minimal data usage
- **Clean UX**: Intuitive navigation and clear information hierarchy

## Security Features 🔒

- **zkLogin Integration**: Privacy-preserving authentication
- **DID Management**: Decentralized identity without personal data storage
- **Encrypted Storage**: Vault secured via Walrus & Seal network
- **Master Password**: Additional encryption layer for sensitive data
- **Recovery Options**: Secure backup and recovery mechanisms


## Environmental Impact 🌍

GreenVault promotes environmental sustainability by:
- Facilitating carbon credit purchases
- Tracking environmental impact
- Supporting verified offset projects
- Connecting users with sustainable actions
- Providing AI-powered optimization

## Future Enhancements 🔮

- Real zkLogin integration
- Actual Walrus & Seal storage implementation
- Smart contract integration for carbon credits
- Advanced AI features
- Mobile app development
- Enhanced analytics and reporting

## Contributing 🤝

This project demonstrates a complete implementation of a privacy-first, environmentally-conscious web application. The codebase is structured for easy extension and real-world deployment.

---

**Built with privacy and sustainability in mind** 🌱🔐

