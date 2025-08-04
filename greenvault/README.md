# GreenVault

A minimalistic black-and-white progressive web application built with Next.js that combines a privacy-preserving identity/password manager with a decentralized carbon credit marketplace.

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

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS (minimal black-and-white theme)
- **Authentication**: zkLogin (simulated)
- **Storage**: Walrus & Seal + Oasis Confidential EVM (conceptual)
- **Design**: Progressive, low-bandwidth-friendly, accessible

## Pages & Components

### 1. Landing Page (`/`)
- Project introduction and mission statement
- Login/Sign up buttons with zkLogin
- Language toggle (English/Spanish)
- Clean, minimal design with key features

### 2. Authentication
- **Login** (`/login`): zkLogin with email/Google options
- **Sign Up** (`/signup`): Account creation with DID setup
- **Onboarding** (`/onboarding`): Guided setup process

### 3. Vault Dashboard (`/vault`)
- Encrypted password management
- Category-based organization
- Add/edit/delete secrets
- Master password authentication for decryption

### 4. Carbon Marketplace (`/marketplace`)
- Grid view of available carbon credits
- Project filtering by type
- Purchase functionality
- List new credits form

### 5. My Carbon Assets (`/assets`)
- Portfolio of owned carbon credits
- Environmental impact tracking
- Transaction history
- Credit retirement options

### 6. AI Assistant (`/assistant`)
- Chat interface for carbon offset guidance
- Quick action buttons
- Personalized recommendations
- Impact analysis

### 7. Settings (`/settings`)
- DID management
- Vault recovery options
- Theme toggle (light/dark)
- Language selector
- Account management

## Design Principles

- **Minimalist**: Pure black-and-white color scheme
- **Accessible**: Semantic HTML and ARIA compliant
- **Progressive**: Works on all devices and connections
- **Low-bandwidth**: Optimized for minimal data usage
- **Clean UX**: Intuitive navigation and clear information hierarchy

## Getting Started

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

## Key Features Implemented

- ✅ Responsive design with Tailwind CSS
- ✅ Multi-language support (EN/ES)
- ✅ Dark/light theme toggle
- ✅ Simulated zkLogin authentication flow
- ✅ Encrypted vault UI with decrypt-on-demand
- ✅ Carbon credit marketplace with filtering
- ✅ Portfolio management and impact tracking
- ✅ AI assistant chat interface
- ✅ Settings and account management
- ✅ Progressive Web App ready structure

## Security Features

- **zkLogin Integration**: Privacy-preserving authentication
- **DID Management**: Decentralized identity without personal data storage
- **Encrypted Storage**: Vault secured via Walrus & Seal network
- **Master Password**: Additional encryption layer for sensitive data
- **Recovery Options**: Secure backup and recovery mechanisms

## Environmental Impact

GreenVault promotes environmental sustainability by:
- Facilitating carbon credit purchases
- Tracking environmental impact
- Supporting verified offset projects
- Connecting users with sustainable actions
- Providing AI-powered optimization

## Future Enhancements

- Real zkLogin integration
- Actual Walrus & Seal storage implementation
- Smart contract integration for carbon credits
- Advanced AI features
- Mobile app development
- Enhanced analytics and reporting

## Contributing

This project demonstrates a complete implementation of a privacy-first, environmentally-conscious web application. The codebase is structured for easy extension and real-world deployment.

---

**Built with privacy and sustainability in mind** 🌱🔐
