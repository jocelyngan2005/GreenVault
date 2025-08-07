'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

// Project Owner interfaces
interface MintedNFT {
  id: string;
  projectName: string;
  tokenId: string;
  co2Amount: number;
  pricePerTon: number;
  location: string;
  projectType: string;
  mintDate: string;
  status: 'listed' | 'sold' | 'unlisted';
  totalSupply: number;
  soldAmount: number;
  earnings: number;
  metadata: {
    verificationStandard: string;
    vintage: string;
    projectDescription: string;
  };
}

// Credit Buyer interfaces
interface PurchasedNFT {
  id: string;
  projectName: string;
  tokenId: string;
  co2Amount: number;
  location: string;
  projectType: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  status: 'active' | 'retired';
  retiredDate?: string;
  projectOwner: string;
}

interface Transaction {
  id: string;
  type: 'purchase' | 'retirement' | 'listing' | 'sale';
  projectName: string;
  amount: number;
  price: number;
  date: string;
  transactionHash?: string;
}

export default function AssetsPage() {
  const [userRole, setUserRole] = useState<'project-owner' | 'credit-buyer' | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'assets' | 'history' | 'analytics'>('assets');

  // Project Owner mock data
  const [mintedNFTs] = useState<MintedNFT[]>([
    {
      id: '1',
      projectName: 'Amazon Rainforest Conservation',
      tokenId: 'GV-ARF-001',
      co2Amount: 1.5,
      pricePerTon: 25,
      location: 'Brazil',
      projectType: 'Forest Conservation',
      mintDate: '2025-01-10',
      status: 'listed',
      totalSupply: 1000,
      soldAmount: 750,
      earnings: 18750,
      metadata: {
        verificationStandard: 'VCS',
        vintage: '2024',
        projectDescription: 'Supporting indigenous communities in preserving 10,000 hectares of rainforest'
      }
    },
    {
      id: '2',
      projectName: 'Solar Farm Initiative',
      tokenId: 'GV-SFI-002',
      co2Amount: 2.0,
      pricePerTon: 18,
      location: 'Kenya',
      projectType: 'Renewable Energy',
      mintDate: '2025-01-05',
      status: 'sold',
      totalSupply: 500,
      soldAmount: 500,
      earnings: 9000,
      metadata: {
        verificationStandard: 'Gold Standard',
        vintage: '2024',
        projectDescription: 'Clean energy generation providing power to rural communities'
      }
    },
    {
      id: '3',
      projectName: 'Mangrove Restoration',
      tokenId: 'GV-MR-003',
      co2Amount: 1.2,
      pricePerTon: 22,
      location: 'Philippines',
      projectType: 'Ecosystem Restoration',
      mintDate: '2024-12-20',
      status: 'unlisted',
      totalSupply: 800,
      soldAmount: 0,
      earnings: 0,
      metadata: {
        verificationStandard: 'CDM',
        vintage: '2024',
        projectDescription: 'Coastal ecosystem restoration and community livelihood support'
      }
    }
  ]);

  // Credit Buyer mock data
  const [purchasedNFTs] = useState<PurchasedNFT[]>([
    {
      id: '1',
      projectName: 'Amazon Rainforest Conservation',
      tokenId: 'GV-ARF-001-#123',
      co2Amount: 1.5,
      location: 'Brazil',
      projectType: 'Forest Conservation',
      purchaseDate: '2025-01-10',
      purchasePrice: 25,
      currentValue: 27,
      status: 'active',
      projectOwner: 'Indigenous Community Brazil'
    },
    {
      id: '2',
      projectName: 'Solar Farm Initiative',
      tokenId: 'GV-SFI-002-#456',
      co2Amount: 2.0,
      location: 'Kenya',
      projectType: 'Renewable Energy',
      purchaseDate: '2025-01-05',
      purchasePrice: 18,
      currentValue: 19,
      status: 'retired',
      retiredDate: '2025-01-15',
      projectOwner: 'Community Solar Kenya'
    },
    {
      id: '3',
      projectName: 'Wind Energy Project',
      tokenId: 'GV-WEP-004-#789',
      co2Amount: 1.8,
      location: 'Morocco',
      projectType: 'Renewable Energy',
      purchaseDate: '2024-12-28',
      purchasePrice: 20,
      currentValue: 21,
      status: 'active',
      projectOwner: 'Atlas Wind Corp'
    }
  ]);

  const [projectOwnerTransactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'sale',
      projectName: 'Amazon Rainforest Conservation',
      amount: 750,
      price: 25,
      date: '2025-01-10',
      transactionHash: '0x742d35...2F2e'
    },
    {
      id: '2',
      type: 'listing',
      projectName: 'Solar Farm Initiative',
      amount: 500,
      price: 18,
      date: '2025-01-05',
      transactionHash: '0x8f3a21...9B4c'
    },
    {
      id: '3',
      type: 'listing',
      projectName: 'Mangrove Restoration',
      amount: 800,
      price: 22,
      date: '2024-12-20',
      transactionHash: '0x1a5b33...7D8e'
    }
  ]);

  const [creditBuyerTransactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'purchase',
      projectName: 'Amazon Rainforest Conservation',
      amount: 1.5,
      price: 25,
      date: '2025-01-10',
      transactionHash: '0x742d35...2F2e'
    },
    {
      id: '2',
      type: 'purchase',
      projectName: 'Solar Farm Initiative',
      amount: 2.0,
      price: 18,
      date: '2025-01-05',
      transactionHash: '0x8f3a21...9B4c'
    },
    {
      id: '3',
      type: 'retirement',
      projectName: 'Solar Farm Initiative',
      amount: 2.0,
      price: 0,
      date: '2025-01-15',
      transactionHash: '0x2c7f48...1A3d'
    }
  ]);

  useEffect(() => {
    setIsMounted(true);
    const role = localStorage.getItem('user-role') as 'project-owner' | 'credit-buyer' | null;
    setUserRole(role);
  }, []);

  // Project Owner specific calculations
  const getTotalEarnings = () => {
    return mintedNFTs.reduce((sum, nft) => sum + nft.earnings, 0);
  };

  const getTotalMinted = () => {
    return mintedNFTs.reduce((sum, nft) => sum + nft.totalSupply, 0);
  };

  const getTotalSold = () => {
    return mintedNFTs.reduce((sum, nft) => sum + nft.soldAmount, 0);
  };

  const getActiveListing = () => {
    return mintedNFTs.filter(nft => nft.status === 'listed').length;
  };

  // Credit Buyer specific calculations
  const getTotalCO2Offset = () => {
    return purchasedNFTs.reduce((sum, nft) => sum + nft.co2Amount, 0);
  };

  const getTotalInvestment = () => {
    return purchasedNFTs.reduce((sum, nft) => sum + nft.purchasePrice, 0);
  };

  const getCurrentPortfolioValue = () => {
    return purchasedNFTs.reduce((sum, nft) => sum + nft.currentValue, 0);
  };

  const getRetiredCredits = () => {
    return purchasedNFTs.filter(nft => nft.status === 'retired').length;
  };

  const handleRetireCredit = (creditId: string) => {
    const confirmed = confirm('Are you sure you want to retire this carbon credit? This action cannot be undone and will permanently remove it from circulation.');
    if (confirmed) {
      alert(`Credit ${creditId} has been retired. This represents a permanent contribution to carbon reduction.`);
    }
  };

  const handleListNFT = (nftId: string) => {
    alert(`Listing NFT ${nftId} on the marketplace. You can set your price and availability.`);
  };

  if (!isMounted) {
    return (
      <Navigation>
        <div className="min-h-screen bg-white text-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      </Navigation>
    );
  }

  const getTransactions = () => {
    return userRole === 'project-owner' ? projectOwnerTransactions : creditBuyerTransactions;
  };

  return (
    <Navigation>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {userRole === 'project-owner' ? 'My Carbon Projects' : 'My Carbon Assets'}
          </h1>
          <p className="text-gray-600">
            {userRole === 'project-owner' 
              ? 'Track your minted NFTs, earnings, and project performance'
              : 'Track your environmental impact and carbon credit portfolio'
            }
          </p>
        </div>

        {/* Summary Cards */}
        {userRole === 'project-owner' ? (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="border border-black p-6 text-center">
              <h3 className="text-2xl font-bold text-green-600">${getTotalEarnings().toLocaleString()}</h3>
              <p className="text-sm text-gray-600">Total Earnings</p>
            </div>
            <div className="border border-black p-6 text-center">
              <h3 className="text-2xl font-bold">{getTotalMinted().toLocaleString()}</h3>
              <p className="text-sm text-gray-600">Credits Minted</p>
            </div>
            <div className="border border-black p-6 text-center">
              <h3 className="text-2xl font-bold">{getTotalSold().toLocaleString()}</h3>
              <p className="text-sm text-gray-600">Credits Sold</p>
            </div>
            <div className="border border-black p-6 text-center">
              <h3 className="text-2xl font-bold">{getActiveListing()}</h3>
              <p className="text-sm text-gray-600">Active Listings</p>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="border border-black p-6 text-center">
              <h3 className="text-2xl font-bold text-green-600">{getTotalCO2Offset()}</h3>
              <p className="text-sm text-gray-600">Tons CO₂ Offset</p>
            </div>
            <div className="border border-black p-6 text-center">
              <h3 className="text-2xl font-bold">{purchasedNFTs.length}</h3>
              <p className="text-sm text-gray-600">Credits Owned</p>
            </div>
            <div className="border border-black p-6 text-center">
              <h3 className="text-2xl font-bold">${getTotalInvestment()}</h3>
              <p className="text-sm text-gray-600">Total Investment</p>
            </div>
            <div className="border border-black p-6 text-center">
              <h3 className="text-2xl font-bold">{getRetiredCredits()}</h3>
              <p className="text-sm text-gray-600">Credits Retired</p>
            </div>
          </div>
        )}

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
              {userRole === 'project-owner' ? 'My NFTs' : 'My Credits'}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'history'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Transaction History
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'analytics'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>

        {/* Assets Tab - Project Owner */}
        {activeTab === 'assets' && userRole === 'project-owner' && (
          <div className="space-y-6">
            {mintedNFTs.map(nft => (
              <div key={nft.id} className="border border-black p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold">{nft.projectName}</h3>
                    <p className="text-gray-600">{nft.location} • {nft.projectType}</p>
                    <p className="text-sm text-gray-500">Token ID: {nft.tokenId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm px-2 py-1 border ${
                      nft.status === 'listed' 
                        ? 'bg-green-100 text-green-800 border-green-300'
                        : nft.status === 'sold'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-gray-100 text-gray-800 border-gray-300'
                    }`}>
                      {nft.status === 'listed' ? 'Listed' : nft.status === 'sold' ? 'Sold Out' : 'Unlisted'}
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">CO₂ per Credit</p>
                    <p className="font-semibold">{nft.co2Amount} tons</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Price per Ton</p>
                    <p className="font-semibold">${nft.pricePerTon}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Supply</p>
                    <p className="font-semibold">{nft.totalSupply.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Sold</p>
                    <p className="font-semibold">{nft.soldAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded mb-4">
                  <h4 className="font-semibold mb-2">Project Metadata</h4>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Standard: </span>
                      <span className="font-medium">{nft.metadata.verificationStandard}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Vintage: </span>
                      <span className="font-medium">{nft.metadata.vintage}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Earnings: </span>
                      <span className="font-medium text-green-600">${nft.earnings.toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mt-2">{nft.metadata.projectDescription}</p>
                </div>

                <div className="flex gap-2">
                  {nft.status === 'unlisted' && (
                    <button
                      onClick={() => handleListNFT(nft.id)}
                      className="bg-black text-white px-4 py-2 border border-black hover:bg-white hover:text-black transition-colors"
                    >
                      List on Marketplace
                    </button>
                  )}
                  <Link
                    href={`/project-owner/projects/${nft.id}`}
                    className="bg-white text-black px-4 py-2 border border-black hover:bg-black hover:text-white transition-colors inline-block"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Assets Tab - Credit Buyer */}
        {activeTab === 'assets' && userRole === 'credit-buyer' && (
          <div className="space-y-6">
            {purchasedNFTs.map(nft => (
              <div key={nft.id} className="border border-black p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold">{nft.projectName}</h3>
                    <p className="text-gray-600">{nft.location} • {nft.projectType}</p>
                    <p className="text-sm text-gray-500">By {nft.projectOwner}</p>
                    <p className="text-sm text-gray-500">Token ID: {nft.tokenId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm px-2 py-1 border ${
                      nft.status === 'active' 
                        ? 'bg-green-100 text-green-800 border-green-300'
                        : 'bg-gray-100 text-gray-800 border-gray-300'
                    }`}>
                      {nft.status === 'active' ? 'Active' : 'Retired'}
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">CO₂ Offset</p>
                    <p className="font-semibold">{nft.co2Amount} tons</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Purchase Price</p>
                    <p className="font-semibold">${nft.purchasePrice}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Current Value</p>
                    <p className="font-semibold">${nft.currentValue}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Purchase Date</p>
                    <p className="font-semibold">{new Date(nft.purchaseDate).toLocaleDateString()}</p>
                  </div>
                </div>

                {nft.status === 'retired' && nft.retiredDate && (
                  <div className="bg-gray-50 p-4 rounded mb-4">
                    <h4 className="font-semibold mb-2">🌱 Retirement Details</h4>
                    <p className="text-sm text-gray-700">
                      This credit was permanently retired on {new Date(nft.retiredDate).toLocaleDateString()}, 
                      representing your commitment to carbon reduction.
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  {nft.status === 'active' && (
                    <button
                      onClick={() => handleRetireCredit(nft.id)}
                      className="bg-green-600 text-white px-4 py-2 border border-green-600 hover:bg-white hover:text-green-600 transition-colors"
                    >
                      Retire Credit
                    </button>
                  )}
                  <Link
                    href={`/credit-buyer/marketplace/${nft.id.split('-')[0]}`}
                    className="bg-white text-black px-4 py-2 border border-black hover:bg-black hover:text-white transition-colors inline-block"
                  >
                    View Project
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Transaction History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Transaction History</h2>
            {getTransactions().map(transaction => (
              <div key={transaction.id} className="border border-black p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{transaction.projectName}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span className={`px-2 py-1 border text-xs ${
                        transaction.type === 'purchase' ? 'bg-green-100 text-green-800 border-green-300' :
                        transaction.type === 'sale' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                        transaction.type === 'retirement' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                        'bg-yellow-100 text-yellow-800 border-yellow-300'
                      }`}>
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </span>
                      <span>{transaction.amount} {userRole === 'project-owner' ? 'credits' : 'tons CO₂'}</span>
                      {transaction.price > 0 && <span>${transaction.price.toLocaleString()}</span>}
                      <span>{new Date(transaction.date).toLocaleDateString()}</span>
                    </div>
                    {transaction.transactionHash && (
                      <p className="text-xs text-gray-500 mt-1 font-mono">
                        Tx: {transaction.transactionHash}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4">
              {userRole === 'project-owner' ? 'Project Analytics' : 'Impact Analytics'}
            </h2>
            
            {userRole === 'project-owner' ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border border-black p-6">
                  <h3 className="font-semibold mb-4">Sales Performance</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Revenue</span>
                      <span className="font-semibold">${getTotalEarnings().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Price per Ton</span>
                      <span className="font-semibold">
                        ${(mintedNFTs.reduce((sum, nft) => sum + nft.pricePerTon, 0) / mintedNFTs.length).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sell-through Rate</span>
                      <span className="font-semibold">
                        {((getTotalSold() / getTotalMinted()) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="border border-black p-6">
                  <h3 className="font-semibold mb-4">Project Distribution</h3>
                  <div className="space-y-3">
                    {Array.from(new Set(mintedNFTs.map(nft => nft.projectType))).map(type => {
                      const count = mintedNFTs.filter(nft => nft.projectType === type).length;
                      return (
                        <div key={type} className="flex justify-between">
                          <span>{type}</span>
                          <span className="font-semibold">{count} project{count !== 1 ? 's' : ''}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border border-black p-6">
                  <h3 className="font-semibold mb-4">Environmental Impact</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total CO₂ Offset</span>
                      <span className="font-semibold text-green-600">{getTotalCO2Offset()} tons</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Equivalent to</span>
                      <span className="font-semibold">{Math.round(getTotalCO2Offset() * 2.3)} car-free days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Credits Retired</span>
                      <span className="font-semibold">{getRetiredCredits()} / {purchasedNFTs.length}</span>
                    </div>
                  </div>
                </div>
                
                <div className="border border-black p-6">
                  <h3 className="font-semibold mb-4">Portfolio Performance</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Investment</span>
                      <span className="font-semibold">${getTotalInvestment()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Value</span>
                      <span className="font-semibold">${getCurrentPortfolioValue()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Return</span>
                      <span className={`font-semibold ${
                        getCurrentPortfolioValue() >= getTotalInvestment() ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {getCurrentPortfolioValue() >= getTotalInvestment() ? '+' : ''}
                        ${(getCurrentPortfolioValue() - getTotalInvestment()).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </Navigation>
  );
}
