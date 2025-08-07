// Carbon Credit Currency System
// This module replaces traditional USD payments with carbon credit-based transactions
// Using mock implementation to avoid blockchain dependency errors

import { MockCarbonCreditContractClient, MockCarbonCreditStorage, mockCarbonCreditUtils } from './mockCarbonCreditContracts';

export interface CarbonCreditBalance {
  totalCredits: number;          // Total carbon credits owned
  availableCredits: number;      // Credits available for trading
  lockedCredits: number;         // Credits locked in transactions/escrow
  creditTypes: {
    forestConservation: number;
    renewableEnergy: number;
    ecosystemRestoration: number;
    cleanCooking: number;
    agriculture: number;
    wasteManagement: number;
  };
}

export interface CarbonCreditTransaction {
  id: string;
  type: 'earn' | 'spend' | 'trade' | 'stake' | 'reward';
  amount: number;                // Carbon credits (not USD)
  projectId?: string;
  description: string;
  timestamp: string;
  fromAddress?: string;
  toAddress?: string;
  exchangeRate?: number;         // For historical tracking
}

export interface ProjectNFT {
  id: string;
  name: string;
  description: string;
  location: string;
  projectType: string;
  
  // NFT Properties
  totalSupply: number;           // Total project NFTs available
  currentPrice: number;          // Price in carbon credits (not USD)
  minimumStake: number;          // Minimum carbon credits to participate
  
  // Impact Metrics
  realWorldCO2Impact: number;    // Actual CO2 offset this project creates
  communityBenefit: string[];
  
  // Ownership & Returns
  stakeholders: {
    address: string;
    creditStake: number;         // Carbon credits invested
    ownershipPercentage: number;
    impactShare: number;         // Share of environmental impact
  }[];
  
  // Performance
  totalCreditsStaked: number;
  projectedReturns: number;      // Expected carbon credit returns
  actualReturns: number;         // Actual carbon credits generated
  
  verified: boolean;
  verificationDate?: string;
  metadata: {
    verificationStandard: string;
    methodology: string;
    monitoringData: string;
  };
}

export interface CarbonCreditMarketplace {
  // Project NFT Listings
  projectListings: {
    id: string;
    projectNFT: ProjectNFT;
    sellerAddress: string;
    priceInCredits: number;       // Price in carbon credits
    availability: number;         // How many NFTs available
    stakingOptions: {
      minimumStake: number;
      expectedReturns: number;
      stakingPeriod: string;
    };
  }[];
  
  // Carbon Credit Exchange Rates (for different types)
  exchangeRates: {
    forestConservation: number;   // Base rate = 1.0
    renewableEnergy: number;      // e.g., 1.2 (premium for renewable)
    ecosystemRestoration: number; // e.g., 1.15
    cleanCooking: number;         // e.g., 0.9
    agriculture: number;          // e.g., 1.1
    wasteManagement: number;      // e.g., 0.95
  };
}

// Carbon Credit Earning Mechanisms
export interface CreditEarningAction {
  actionType: 'project_completion' | 'verification' | 'community_validation' | 'impact_achievement' | 'staking_reward';
  creditReward: number;
  requirements: string[];
  description: string;
  eligibility: {
    userType: 'project-owner' | 'credit-buyer' | 'validator' | 'any';
    minimumStake?: number;
    completedProjects?: number;
  };
}

// Replace USD-based pricing with carbon credit economics
export const CARBON_CREDIT_ACTIONS: CreditEarningAction[] = [
  {
    actionType: 'project_completion',
    creditReward: 100,  // Earn 100 carbon credits for completing a verified project
    requirements: ['Project verification', 'Impact measurement', 'Community validation'],
    description: 'Complete and verify a real-world carbon offset project',
    eligibility: { userType: 'project-owner' }
  },
  {
    actionType: 'verification',
    creditReward: 25,   // Earn 25 credits for verifying other projects
    requirements: ['Technical expertise verification', 'Site visit completed'],
    description: 'Verify and validate other carbon offset projects',
    eligibility: { userType: 'any', completedProjects: 1 }
  },
  {
    actionType: 'staking_reward',
    creditReward: 10,   // Earn 10% annually on staked credits
    requirements: ['Minimum 6-month stake'],
    description: 'Stake carbon credits in active projects',
    eligibility: { userType: 'any', minimumStake: 50 }
  },
  {
    actionType: 'impact_achievement',
    creditReward: 50,   // Bonus for exceeding impact targets
    requirements: ['Exceed projected CO2 reduction by 20%'],
    description: 'Achieve exceptional environmental impact',
    eligibility: { userType: 'project-owner' }
  },
  {
    actionType: 'community_validation',
    creditReward: 15,   // Earn credits for community engagement
    requirements: ['Community feedback collection', 'Local partnership establishment'],
    description: 'Engage and validate with local communities',
    eligibility: { userType: 'any' }
  }
];

// Carbon Credit Economy Functions
export class CarbonCreditEconomy {
  
  // Convert a real-world project into a tradable NFT with carbon credit pricing
  static convertProjectToNFT(
    projectData: any,
    baseStakeRequired: number,    // Carbon credits needed to participate
    expectedCreditReturns: number // Carbon credits the project will generate
  ): ProjectNFT {
    return {
      id: projectData.id,
      name: projectData.name,
      description: projectData.description,
      location: projectData.location,
      projectType: projectData.projectType,
      
      totalSupply: Math.floor(expectedCreditReturns / 10), // 10 credits per NFT
      currentPrice: baseStakeRequired,
      minimumStake: Math.max(baseStakeRequired * 0.1, 5), // 10% of base or minimum 5 credits
      
      realWorldCO2Impact: projectData.co2Impact,
      communityBenefit: projectData.communityBenefits || [],
      
      stakeholders: [],
      totalCreditsStaked: 0,
      projectedReturns: expectedCreditReturns,
      actualReturns: 0,
      
      verified: projectData.verified || false,
      verificationDate: projectData.verificationDate,
      metadata: {
        verificationStandard: projectData.methodology || 'VCS',
        methodology: projectData.detailedMethodology || '',
        monitoringData: projectData.monitoringData || ''
      }
    };
  }
  
  // Calculate carbon credit price based on project impact and market demand
  static calculateCreditPrice(
    projectType: string,
    co2Impact: number,
    communityBenefit: number,
    verificationLevel: string
  ): number {
    let basePrice = 10; // Base 10 carbon credits
    
    // Project type multiplier
    const typeMultipliers = {
      'Forest Conservation': 1.3,
      'Renewable Energy': 1.2,
      'Ecosystem Restoration': 1.25,
      'Clean Cooking': 1.0,
      'Agriculture': 1.1,
      'Waste Management': 0.95
    };
    
    basePrice *= typeMultipliers[projectType as keyof typeof typeMultipliers] || 1.0;
    
    // Impact multiplier (CO2 tons)
    basePrice *= Math.max(0.5, Math.min(3.0, co2Impact / 2));
    
    // Community benefit bonus
    basePrice *= (1 + communityBenefit * 0.1);
    
    // Verification premium
    const verificationMultipliers = {
      'VCS': 1.2,
      'Gold Standard': 1.3,
      'Plan Vivo': 1.15,
      'ACR': 1.1
    };
    
    basePrice *= verificationMultipliers[verificationLevel as keyof typeof verificationMultipliers] || 1.0;
    
    return Math.round(basePrice);
  }
  
  // Stake carbon credits in a project NFT
  static stakeCreditsInProject(
    userBalance: CarbonCreditBalance,
    projectNFT: ProjectNFT,
    stakeAmount: number
  ): { success: boolean; message: string; newBalance?: CarbonCreditBalance } {
    
    if (stakeAmount < projectNFT.minimumStake) {
      return {
        success: false,
        message: `Minimum stake is ${projectNFT.minimumStake} carbon credits`
      };
    }
    
    if (userBalance.availableCredits < stakeAmount) {
      return {
        success: false,
        message: `Insufficient carbon credits. You have ${userBalance.availableCredits}, need ${stakeAmount}`
      };
    }
    
    // Calculate ownership percentage
    const newTotalStaked = projectNFT.totalCreditsStaked + stakeAmount;
    const ownershipPercentage = (stakeAmount / newTotalStaked) * 100;
    
    // Update balances
    const newBalance: CarbonCreditBalance = {
      ...userBalance,
      availableCredits: userBalance.availableCredits - stakeAmount,
      lockedCredits: userBalance.lockedCredits + stakeAmount
    };
    
    return {
      success: true,
      message: `Successfully staked ${stakeAmount} carbon credits for ${ownershipPercentage.toFixed(2)}% ownership`,
      newBalance
    };
  }
  
  // Calculate returns from project NFT ownership
  static calculateProjectReturns(
    projectNFT: ProjectNFT,
    userStake: number,
    actualCO2Achieved: number
  ): number {
    const ownershipPercentage = userStake / projectNFT.totalCreditsStaked;
    const baseReturns = projectNFT.projectedReturns * ownershipPercentage;
    
    // Performance bonus/penalty based on actual vs projected impact
    const performanceRatio = actualCO2Achieved / projectNFT.realWorldCO2Impact;
    const performanceMultiplier = Math.max(0.5, Math.min(2.0, performanceRatio));
    
    return Math.round(baseReturns * performanceMultiplier);
  }
}

// Utility functions for the carbon credit economy
export const carbonCreditUtils = {
  
  // Format carbon credit amounts for display
  formatCredits: (amount: number): string => {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}k CC`;
    }
    return `${amount} CC`; // CC = Carbon Credits
  },
  
  // Convert between different types of carbon credits
  convertCreditTypes: (
    amount: number,
    fromType: keyof CarbonCreditBalance['creditTypes'],
    toType: keyof CarbonCreditBalance['creditTypes'],
    exchangeRates: CarbonCreditMarketplace['exchangeRates']
  ): number => {
    const fromRate = exchangeRates[fromType];
    const toRate = exchangeRates[toType];
    return Math.round((amount * fromRate) / toRate);
  },
  
  // Calculate total portfolio value in carbon credits
  calculatePortfolioValue: (balance: CarbonCreditBalance): number => {
    return balance.totalCredits;
  },
  
  // Get available earning opportunities
  getEarningOpportunities: (userType: 'project-owner' | 'credit-buyer', completedProjects: number = 0): CreditEarningAction[] => {
    return CARBON_CREDIT_ACTIONS.filter(action => 
      action.eligibility.userType === 'any' || 
      action.eligibility.userType === userType
    ).filter(action => 
      !action.eligibility.completedProjects || 
      completedProjects >= action.eligibility.completedProjects
    );
  }
};
