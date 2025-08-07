'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

interface OwnedNFT {
  id: string;
  projectName: string;
  co2Amount: number;
  origin: string;
  status: 'active' | 'retired';
  datePurchased: string;
  nftCount: number;
  projectType: string;
  verification: string;
  region: string;
  expiryDate?: string;
  retiredDate?: string;
  purchasePrice: number;
  currentValue: number;
}

export default function CreditBuyerAssets() {
  const [isMounted, setIsMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterProjectType, setFilterProjectType] = useState('All');
  const [sortBy, setSortBy] = useState('date-desc');
  const [searchTerm, setSearchTerm] = useState('');

  const [ownedNFTs] = useState<OwnedNFT[]>([
    {
      id: 'nft-1',
      projectName: 'Amazon Rainforest Conservation',
      co2Amount: 1.5,
      origin: 'Brazil – Forest Conservation',
      region: 'South America',
      status: 'active',
      datePurchased: '2025-08-01',
      nftCount: 1,
      projectType: 'Forest Conservation',
      verification: 'Gold Standard',
      expiryDate: '2030-08-01',
      purchasePrice: 25,
      currentValue: 28
    },
    {
      id: 'nft-2',
      projectName: 'Solar Farm Initiative',
      co2Amount: 0.8,
      origin: 'Kenya – Renewable Energy',
      region: 'Africa',
      status: 'active',
      datePurchased: '2025-07-28',
      nftCount: 1,
      projectType: 'Renewable Energy',
      verification: 'Verra VCS',
      expiryDate: '2032-07-28',
      purchasePrice: 18,
      currentValue: 20
    },
    {
      id: 'nft-3',
      projectName: 'Coastal Mangrove Restoration',
      co2Amount: 2.1,
      origin: 'Philippines – Ecosystem Restoration',
      region: 'Asia',
      status: 'retired',
      datePurchased: '2025-07-15',
      retiredDate: '2025-07-20',
      nftCount: 2,
      projectType: 'Ecosystem Restoration',
      verification: 'Climate Action Reserve',
      purchasePrice: 22,
      currentValue: 22
    },
    {
      id: 'nft-4',
      projectName: 'Wind Energy Morocco',
      co2Amount: 3.2,
      origin: 'Morocco – Renewable Energy',
      region: 'Africa',
      status: 'active',
      datePurchased: '2025-07-10',
      nftCount: 2,
      projectType: 'Renewable Energy',
      verification: 'Gold Standard',
      expiryDate: '2035-07-10',
      purchasePrice: 19,
      currentValue: 21
    },
    {
      id: 'nft-5',
      projectName: 'Clean Cooking Stoves Uganda',
      co2Amount: 1.0,
      origin: 'Uganda – Clean Cooking',
      region: 'Africa',
      status: 'active',
      datePurchased: '2025-06-25',
      nftCount: 3,
      projectType: 'Clean Cooking',
      verification: 'Gold Standard',
      expiryDate: '2028-06-25',
      purchasePrice: 12,
      currentValue: 15
    }
  ]);

  const regions = ['All', 'Africa', 'Asia', 'South America', 'North America', 'Europe'];
  const projectTypes = ['All', 'Forest Conservation', 'Renewable Energy', 'Ecosystem Restoration', 'Clean Cooking', 'Agriculture'];
  const statuses = ['All', 'active', 'retired'];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filter and sort NFTs
  const filteredAndSortedNFTs = ownedNFTs
    .filter(nft => {
      if (filterRegion !== 'All' && nft.region !== filterRegion) return false;
      if (filterStatus !== 'All' && nft.status !== filterStatus) return false;
      if (filterProjectType !== 'All' && nft.projectType !== filterProjectType) return false;
      if (searchTerm && !nft.projectName.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !nft.origin.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc': return new Date(b.datePurchased).getTime() - new Date(a.datePurchased).getTime();
        case 'date-asc': return new Date(a.datePurchased).getTime() - new Date(b.datePurchased).getTime();
        case 'amount-desc': return b.co2Amount - a.co2Amount;
        case 'amount-asc': return a.co2Amount - b.co2Amount;
        case 'value-desc': return b.currentValue - a.currentValue;
        case 'name-asc': return a.projectName.localeCompare(b.projectName);
        default: return 0;
      }
    });

  const totalCO2 = ownedNFTs.reduce((sum, nft) => sum + nft.co2Amount, 0);
  const totalValue = ownedNFTs.reduce((sum, nft) => sum + (nft.currentValue * nft.nftCount), 0);
  const totalPurchasePrice = ownedNFTs.reduce((sum, nft) => sum + (nft.purchasePrice * nft.nftCount), 0);
  const totalNFTs = ownedNFTs.reduce((sum, nft) => sum + nft.nftCount, 0);

  const retireNFT = (nftId: string) => {
    // This would typically make an API call to retire the NFT
    console.log('Retiring NFT:', nftId);
    alert('NFT retirement functionality would be implemented here');
  };

  return (
    <Navigation>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">🌱 My Carbon Credit NFTs</h1>
              <p className="text-gray-600">Manage and track your carbon credit NFT portfolio</p>
            </div>
            <Link 
              href="/credit-buyer/marketplace" 
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            >
              Buy More NFTs
            </Link>
          </div>

          {/* Portfolio Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <p className="text-sm text-green-600 mb-1">Total NFTs</p>
              <p className="text-2xl font-bold text-green-800">{totalNFTs}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-600 mb-1">Total CO₂ Offset</p>
              <p className="text-2xl font-bold text-blue-800">{totalCO2.toFixed(1)} tons</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Purchase Value</p>
              <p className="text-2xl font-bold text-gray-800">${totalPurchasePrice}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
              <p className="text-sm text-purple-600 mb-1">Current Value</p>
              <p className="text-2xl font-bold text-purple-800">${totalValue}</p>
              <p className={`text-xs ${totalValue >= totalPurchasePrice ? 'text-green-600' : 'text-red-600'}`}>
                {totalValue >= totalPurchasePrice ? '+' : ''}${(totalValue - totalPurchasePrice).toFixed(0)} ({(((totalValue - totalPurchasePrice) / totalPurchasePrice) * 100).toFixed(1)}%)
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="border border-black p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Filter & Sort ({filteredAndSortedNFTs.length} NFTs)</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1 text-sm border border-black ${
                  viewMode === 'cards' ? 'bg-black text-white' : 'hover:bg-black hover:text-white'
                } transition-colors`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 text-sm border border-black ${
                  viewMode === 'table' ? 'bg-black text-white' : 'hover:bg-black hover:text-white'
                } transition-colors`}
              >
                Table
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-gray-300 text-sm"
              />
            </div>
            <div>
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="w-full p-2 border border-gray-300 text-sm"
              >
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filterProjectType}
                onChange={(e) => setFilterProjectType(e.target.value)}
                className="w-full p-2 border border-gray-300 text-sm"
              >
                {projectTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-2 border border-gray-300 text-sm"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status === 'All' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-2 border border-gray-300 text-sm"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-desc">CO₂ Amount: High to Low</option>
                <option value="amount-asc">CO₂ Amount: Low to High</option>
                <option value="value-desc">Value: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
            </div>
            <div>
              <button
                onClick={() => {
                  setFilterRegion('All');
                  setFilterProjectType('All');
                  setFilterStatus('All');
                  setSearchTerm('');
                  setSortBy('date-desc');
                }}
                className="w-full p-2 border border-black hover:bg-black hover:text-white transition-colors text-sm"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* NFT Display */}
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedNFTs.map((nft) => (
              <div key={nft.id} className="border border-black p-6 bg-white">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg mb-1">{nft.projectName}</h3>
                    <p className="text-sm text-gray-600">{nft.origin}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    nft.status === 'active' 
                      ? 'text-green-600 bg-green-100' 
                      : 'text-gray-600 bg-gray-100'
                  }`}>
                    {nft.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">CO₂ Amount:</span>
                    <span className="font-semibold">{nft.co2Amount} tons</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">NFT Count:</span>
                    <span className="font-semibold">{nft.nftCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Purchased:</span>
                    <span className="font-semibold">{new Date(nft.datePurchased).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Value:</span>
                    <span className="font-semibold">${nft.currentValue * nft.nftCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Verification:</span>
                    <span className="font-semibold text-green-600">{nft.verification}</span>
                  </div>
                  {nft.expiryDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expires:</span>
                      <span className="font-semibold">{new Date(nft.expiryDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {nft.retiredDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Retired:</span>
                      <span className="font-semibold">{new Date(nft.retiredDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {nft.status === 'active' && (
                    <button
                      onClick={() => retireNFT(nft.id)}
                      className="flex-1 bg-red-600 text-white py-2 px-4 text-sm hover:bg-red-700 transition-colors"
                    >
                      Retire NFT
                    </button>
                  )}
                  <Link
                    href={`/credit-buyer/assets/${nft.id}`}
                    className="flex-1 bg-black text-white py-2 px-4 text-center text-sm hover:bg-gray-800 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-black bg-white">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-black">
                  <tr>
                    <th className="text-left p-4 font-semibold">Project Name</th>
                    <th className="text-left p-4 font-semibold">Origin</th>
                    <th className="text-left p-4 font-semibold">CO₂ Amount</th>
                    <th className="text-left p-4 font-semibold">NFTs</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">Date Purchased</th>
                    <th className="text-left p-4 font-semibold">Current Value</th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedNFTs.map((nft, index) => (
                    <tr key={nft.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{nft.projectName}</p>
                          <p className="text-xs text-gray-600">{nft.verification}</p>
                        </div>
                      </td>
                      <td className="p-4 text-sm">{nft.origin}</td>
                      <td className="p-4 text-sm font-medium">{nft.co2Amount} tons</td>
                      <td className="p-4 text-sm">{nft.nftCount}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          nft.status === 'active' 
                            ? 'text-green-600 bg-green-100' 
                            : 'text-gray-600 bg-gray-100'
                        }`}>
                          {nft.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-sm">{new Date(nft.datePurchased).toLocaleDateString()}</td>
                      <td className="p-4 text-sm font-medium">${nft.currentValue * nft.nftCount}</td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          {nft.status === 'active' && (
                            <button
                              onClick={() => retireNFT(nft.id)}
                              className="bg-red-600 text-white px-2 py-1 text-xs hover:bg-red-700 transition-colors"
                            >
                              Retire
                            </button>
                          )}
                          <Link
                            href={`/credit-buyer/assets/${nft.id}`}
                            className="bg-black text-white px-2 py-1 text-xs hover:bg-gray-800 transition-colors"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredAndSortedNFTs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No NFTs match your current filters</p>
            <button
              onClick={() => {
                setFilterRegion('All');
                setFilterProjectType('All');
                setFilterStatus('All');
                setSearchTerm('');
              }}
              className="px-6 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>
    </Navigation>
  );
}
