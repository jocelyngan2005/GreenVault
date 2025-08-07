'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { CarbonCreditEconomy, carbonCreditUtils, CarbonCreditBalance } from '@/lib/carbonCreditEconomy';

// Carbon Credit Economy Interfaces
interface CarbonCreditNFT {
  id: string;
  projectName: string;
  projectId: string;
  creditType: 'forestConservation' | 'renewableEnergy' | 'ecosystemRestoration' | 'cleanCooking' | 'agriculture' | 'wasteManagement';
  
  // NFT represents real-world project ownership
  realWorldCO2Impact: number;    // Actual CO2 this represents (tons/year)
  stakingValue: number;          // Carbon credits invested to acquire this NFT
  ownershipPercentage: number;   // Percentage ownership of the underlying project
  
  // Economics (carbon credit based)
  acquisitionCost: number;       // Carbon credits spent to acquire
  currentValue: number;          // Current value in carbon credits
  annualReturns: number;         // Carbon credits earned annually
  
  // Project Details
  location: string;
  projectType: string;
  verificationStandard: string;
  stakingDate: string;
  status: 'active' | 'completed' | 'retired';
  
  // Performance Metrics
  projectedImpact: number;       // Projected CO2 reduction
  actualImpact: number;          // Measured CO2 reduction
  performanceRatio: number;      // actual/projected
  
  metadata: {
    description: string;
    communityBenefit: string[];
    monitoringData: string;
  };
}

interface CarbonCreditTransaction {
  id: string;
  type: 'stake' | 'return' | 'exchange' | 'retirement' | 'performance_bonus';
  projectName: string;
  amount: number;                // Carbon credits
  impactGenerated: number;       // CO2 tons
  date: string;
  description: string;
  transactionHash?: string;
}

export default function CarbonCreditAssetsPage() {
  const [userRole, setUserRole] = useState<'project-owner' | 'credit-buyer' | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'assets' | 'history' | 'analytics'>('assets');

  // User's carbon credit balance and portfolio
  const [userBalance, setUserBalance] = useState<CarbonCreditBalance>({
    totalCredits: 350,
    availableCredits: 120,
    lockedCredits: 230,           // Credits staked in projects
    creditTypes: {
      forestConservation: 150,
      renewableEnergy: 80,
      ecosystemRestoration: 70,
      cleanCooking: 30,
      agriculture: 15,
      wasteManagement: 5
    }
  });

  // Project Owner - Carbon Credit NFTs representing real projects they've created
  const [ownedProjectNFTs] = useState<CarbonCreditNFT[]>([
    {
      id: '1',
      projectName: 'Amazon Rainforest Conservation',
      projectId: 'AMZN-2024-001',
      creditType: 'forestConservation',
      realWorldCO2Impact: 1500,     // This project offsets 1,500 tons CO2 annually
      stakingValue: 2500,           // 2,500 carbon credits staked by all investors
      ownershipPercentage: 100,     // Project owner has 100% ownership
      acquisitionCost: 0,           // No cost for project creator
      currentValue: 2800,           // Current value based on performance
      annualReturns: 350,           // Earning 350 carbon credits annually
      location: 'Brazil',
      projectType: 'Forest Conservation',
      verificationStandard: 'VCS v4.0',
      stakingDate: '2024-01-10',
      status: 'active',
      projectedImpact: 1500,
      actualImpact: 1680,           // Exceeding projections
      performanceRatio: 1.12,
      metadata: {
        description: 'Supporting indigenous communities in preserving 10,000 hectares of rainforest',
        communityBenefit: ['Indigenous employment', 'Traditional knowledge preservation', 'Sustainable livelihoods'],
        monitoringData: 'Satellite monitoring + ground verification'
      }
    },
    {
      id: '2',
      projectName: 'Solar Micro-Grid Initiative',
      projectId: 'SOLR-2024-002',
      creditType: 'renewableEnergy',
      realWorldCO2Impact: 800,
      stakingValue: 1200,
      ownershipPercentage: 100,
      acquisitionCost: 0,
      currentValue: 1350,
      annualReturns: 180,
      location: 'Kenya',
      projectType: 'Renewable Energy',
      verificationStandard: 'Gold Standard',
      stakingDate: '2024-02-15',
      status: 'active',
      projectedImpact: 800,
      actualImpact: 750,
      performanceRatio: 0.94,
      metadata: {
        description: 'Distributed solar energy system serving rural communities',
        communityBenefit: ['Clean energy access', 'Reduced energy costs', 'Local technician training'],
        monitoringData: 'Smart meter data + community surveys'
      }
    }
  ]);

  // Credit Buyer - Carbon Credit NFTs representing investments in projects
  const [investedProjectNFTs] = useState<CarbonCreditNFT[]>([
    {
      id: '3',
      projectName: 'Mangrove Restoration Project',
      projectId: 'MNGR-2024-003',
      creditType: 'ecosystemRestoration',
      realWorldCO2Impact: 200,      // Their share represents 200 tons CO2 annually
      stakingValue: 150,            // Invested 150 carbon credits
      ownershipPercentage: 12.5,    // 12.5% ownership in the project
      acquisitionCost: 150,
      currentValue: 175,
      annualReturns: 22,
      location: 'Philippines',
      projectType: 'Ecosystem Restoration',
      verificationStandard: 'Plan Vivo',
      stakingDate: '2024-03-20',
      status: 'active',
      projectedImpact: 200,
      actualImpact: 230,
      performanceRatio: 1.15,
      metadata: {
        description: 'Coastal mangrove restoration with community participation',
        communityBenefit: ['Coastal protection', 'Fisheries enhancement', 'Eco-tourism'],
        monitoringData: 'Drone surveys + biodiversity assessments'
      }
    },
    {
      id: '4',
      projectName: 'Clean Cooking Stoves Distribution',
      projectId: 'COOK-2024-004',
      creditType: 'cleanCooking',
      realWorldCO2Impact: 50,
      stakingValue: 80,
      ownershipPercentage: 8,
      acquisitionCost: 80,
      currentValue: 85,
      annualReturns: 12,
      location: 'Uganda',
      projectType: 'Clean Cooking',
      verificationStandard: 'Gold Standard',
      stakingDate: '2024-04-10',
      status: 'active',
      projectedImpact: 50,
      actualImpact: 55,
      performanceRatio: 1.10,
      metadata: {
        description: 'Efficient cookstoves reducing deforestation and indoor air pollution',
        communityBenefit: ['Health improvements', 'Time savings', 'Forest preservation'],
        monitoringData: 'Usage tracking + health impact studies'
      }
    }
  ]);

  // Transaction history using carbon credits
  const [transactions] = useState<CarbonCreditTransaction[]>([
    {
      id: '1',
      type: 'stake',
      projectName: 'Mangrove Restoration Project',
      amount: 150,
      impactGenerated: 0,
      date: '2024-03-20',
      description: 'Initial stake in coastal restoration project'
    },
    {
      id: '2',
      type: 'return',
      projectName: 'Mangrove Restoration Project',
      amount: 22,
      impactGenerated: 30,
      date: '2024-04-20',
      description: 'Monthly returns from project performance'
    },
    {
      id: '3',
      type: 'performance_bonus',
      projectName: 'Amazon Rainforest Conservation',
      amount: 50,
      impactGenerated: 180,
      date: '2024-05-15',
      description: 'Bonus for exceeding CO2 reduction targets'
    },
    {
      id: '4',
      type: 'retirement',
      projectName: 'Personal Impact Portfolio',
      amount: 25,
      impactGenerated: 25,
      date: '2024-06-01',
      description: 'Retired credits for personal carbon neutrality'
    }
  ]);

  useEffect(() => {
    setIsMounted(true);
    const role = localStorage.getItem('user-role') as 'project-owner' | 'credit-buyer' | null;
    setUserRole(role);
  }, []);

  if (!isMounted) {
    return null;
  }

  // Calculate portfolio metrics
  const getTotalCO2Impact = () => {
    const nfts = userRole === 'project-owner' ? ownedProjectNFTs : investedProjectNFTs;
    return nfts.reduce((sum, nft) => sum + nft.realWorldCO2Impact, 0);
  };

  const getTotalInvestment = () => {
    const nfts = userRole === 'project-owner' ? ownedProjectNFTs : investedProjectNFTs;
    return nfts.reduce((sum, nft) => sum + nft.acquisitionCost, 0);
  };

  const getCurrentPortfolioValue = () => {
    const nfts = userRole === 'project-owner' ? ownedProjectNFTs : investedProjectNFTs;
    return nfts.reduce((sum, nft) => sum + nft.currentValue, 0);
  };

  const getAnnualCreditReturns = () => {
    const nfts = userRole === 'project-owner' ? ownedProjectNFTs : investedProjectNFTs;
    return nfts.reduce((sum, nft) => sum + nft.annualReturns, 0);
  };

  const handleRetireCredits = (nftId: string, amount: number) => {
    const confirmed = confirm(`Are you sure you want to retire ${amount} carbon credits? This will permanently remove them from circulation and count toward your environmental impact.`);
    if (confirmed) {
      alert(`Successfully retired ${amount} carbon credits! This represents permanent CO2 offset and contributes to your environmental impact goals.`);
    }
  };

  const handleStakeMore = (nftId: string) => {
    alert(`Opening staking interface for additional investment. You can stake more carbon credits to increase your ownership and returns.`);
  };

  return (
    <Navigation>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {userRole === 'project-owner' ? 'My Carbon Credit Projects' : 'My Carbon Credit Portfolio'}
          </h1>
          <p className="text-gray-600">
            {userRole === 'project-owner' 
              ? 'Track your real-world projects represented as NFTs, funded by carbon credit staking'
              : 'Monitor your carbon credit investments in real-world environmental projects'
            }
          </p>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-50 border border-black p-4 text-center">
            <div className="text-2xl font-bold">{carbonCreditUtils.formatCredits(getCurrentPortfolioValue())}</div>
            <p className="text-sm text-gray-600">
              {userRole === 'project-owner' ? 'Project Value' : 'Portfolio Value'}
            </p>
          </div>
          <div className="bg-gray-50 border border-black p-4 text-center">
            <div className="text-2xl font-bold">{getTotalCO2Impact().toLocaleString()}</div>
            <p className="text-sm text-gray-600">CO₂ Impact (tons/year)</p>
          </div>
          <div className="bg-gray-50 border border-black p-4 text-center">
            <div className="text-2xl font-bold">{carbonCreditUtils.formatCredits(getAnnualCreditReturns())}</div>
            <p className="text-sm text-gray-600">Annual Credit Returns</p>
          </div>
          <div className="bg-gray-50 border border-black p-4 text-center">
            <div className="text-2xl font-bold">{userRole === 'project-owner' ? ownedProjectNFTs.length : investedProjectNFTs.length}</div>
            <p className="text-sm text-gray-600">
              {userRole === 'project-owner' ? 'Active Projects' : 'Project Investments'}
            </p>
          </div>
        </div>

        {/* Carbon Credit Balance */}
        <div className="border border-black p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Carbon Credit Balance</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{carbonCreditUtils.formatCredits(userBalance.availableCredits)}</div>
              <p className="text-sm text-gray-600">Available</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{carbonCreditUtils.formatCredits(userBalance.lockedCredits)}</div>
              <p className="text-sm text-gray-600">Staked in Projects</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{carbonCreditUtils.formatCredits(userBalance.totalCredits)}</div>
              <p className="text-sm text-gray-600">Total Credits</p>
            </div>
          </div>
        </div>

        {/* Tabbed Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('assets')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'assets'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {userRole === 'project-owner' ? 'My Project NFTs' : 'My Investments'}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'history'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Credit Transactions
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'analytics'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Impact Analytics
            </button>
          </nav>
        </div>

        {/* Assets Tab */}
        {activeTab === 'assets' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(userRole === 'project-owner' ? ownedProjectNFTs : investedProjectNFTs).map((nft) => (
              <div key={nft.id} className="border border-black p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{nft.projectName}</h3>
                    <p className="text-sm text-gray-600">{nft.location} • {nft.projectType}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 border ${
                    nft.status === 'active' ? 'border-green-600 text-green-600' : 'border-gray-600 text-gray-600'
                  }`}>
                    {nft.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="font-medium">{carbonCreditUtils.formatCredits(nft.currentValue)}</p>
                    <p className="text-gray-600">Current Value</p>
                  </div>
                  <div>
                    <p className="font-medium">{nft.realWorldCO2Impact.toLocaleString()} tons</p>
                    <p className="text-gray-600">Annual CO₂ Impact</p>
                  </div>
                  <div>
                    <p className="font-medium">{carbonCreditUtils.formatCredits(nft.annualReturns)}</p>
                    <p className="text-gray-600">Annual Returns</p>
                  </div>
                  <div>
                    <p className="font-medium">{nft.ownershipPercentage}%</p>
                    <p className="text-gray-600">Ownership</p>
                  </div>
                </div>

                {/* Performance Indicator */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Performance</span>
                    <span className={nft.performanceRatio >= 1 ? 'text-green-600' : 'text-orange-600'}>
                      {(nft.performanceRatio * 100).toFixed(1)}% of target
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 border border-gray-300">
                    <div 
                      className={`h-full ${nft.performanceRatio >= 1 ? 'bg-green-600' : 'bg-orange-600'}`}
                      style={{ width: `${Math.min(nft.performanceRatio * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  {userRole === 'project-owner' ? (
                    <>
                      <button 
                        className="w-full bg-black text-white py-2 px-4 hover:bg-gray-800 transition-colors text-sm"
                        onClick={() => alert(`Opening project management dashboard for ${nft.projectName}`)}
                      >
                        Manage Project
                      </button>
                      <button 
                        className="w-full border border-black py-2 px-4 hover:bg-black hover:text-white transition-colors text-sm"
                        onClick={() => handleRetireCredits(nft.id, 25)}
                      >
                        Retire Credits for Impact
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        className="w-full bg-black text-white py-2 px-4 hover:bg-gray-800 transition-colors text-sm"
                        onClick={() => handleStakeMore(nft.id)}
                      >
                        Stake More Credits
                      </button>
                      <button 
                        className="w-full border border-black py-2 px-4 hover:bg-black hover:text-white transition-colors text-sm"
                        onClick={() => handleRetireCredits(nft.id, Math.floor(nft.annualReturns / 4))}
                      >
                        Retire Quarterly Returns
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Transaction History Tab */}
        {activeTab === 'history' && (
          <div className="overflow-x-auto">
            <table className="w-full border border-black">
              <thead>
                <tr className="border-b border-black">
                  <th className="text-left p-4 font-semibold">Date</th>
                  <th className="text-left p-4 font-semibold">Type</th>
                  <th className="text-left p-4 font-semibold">Project</th>
                  <th className="text-left p-4 font-semibold">Carbon Credits</th>
                  <th className="text-left p-4 font-semibold">CO₂ Impact</th>
                  <th className="text-left p-4 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-200">
                    <td className="p-4 text-sm">{transaction.date}</td>
                    <td className="p-4 text-sm">
                      <span className={`px-2 py-1 text-xs border ${
                        transaction.type === 'stake' ? 'border-blue-600 text-blue-600' :
                        transaction.type === 'return' ? 'border-green-600 text-green-600' :
                        transaction.type === 'retirement' ? 'border-purple-600 text-purple-600' :
                        'border-orange-600 text-orange-600'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="p-4 text-sm">{transaction.projectName}</td>
                    <td className="p-4 text-sm font-medium">
                      {transaction.type === 'stake' || transaction.type === 'retirement' ? '-' : '+'}
                      {carbonCreditUtils.formatCredits(transaction.amount)}
                    </td>
                    <td className="p-4 text-sm">
                      {transaction.impactGenerated > 0 ? `${transaction.impactGenerated} tons` : '-'}
                    </td>
                    <td className="p-4 text-sm text-gray-600">{transaction.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-black p-6">
                <h3 className="font-bold mb-4">
                  {userRole === 'project-owner' ? 'Project Performance' : 'Investment Performance'}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Average Performance</span>
                    <span className="font-medium">108.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total CO₂ Offset</span>
                    <span className="font-medium">{getTotalCO2Impact().toLocaleString()} tons</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Credit ROI</span>
                    <span className="font-medium text-green-600">+18.5%</span>
                  </div>
                </div>
              </div>

              <div className="border border-black p-6">
                <h3 className="font-bold mb-4">Carbon Credit Breakdown</h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(userBalance.creditTypes).map(([type, amount]) => (
                    <div key={type} className="flex justify-between">
                      <span className="capitalize">{type.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span>{carbonCreditUtils.formatCredits(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-black p-6">
                <h3 className="font-bold mb-4">Environmental Impact</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Personal Carbon Neutrality</span>
                    <span className="font-medium text-green-600">Achieved</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Communities Supported</span>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Projects Funded</span>
                    <span className="font-medium">{userRole === 'project-owner' ? ownedProjectNFTs.length : investedProjectNFTs.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </Navigation>
  );
}
